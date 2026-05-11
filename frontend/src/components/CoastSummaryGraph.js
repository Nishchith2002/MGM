


import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import Papa from "papaparse";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Colors: C21 red, C22 blue
const sensorColors = {
  C21: "#DC143C",
  C22: "#1E90FF",
};

const CoastSummaryGraph = ({ date }) => {
  const [chartData, setChartData] = useState(null);
  const [sensorList, setSensorList] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("C21");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [temperatureStats, setTemperatureStats] = useState({ avg: 0, max: 0, min: 0 });

  // Compute stats for the chosen sensor (from datasets already built)
  const calculateStats = (datasets, sensorName) => {
    const ds = datasets.find(d => d.label.startsWith(sensorName));
    if (!ds) return { avg: 0, max: 0, min: 0 };
    const values = ds.data.filter(v => typeof v === "number");
    if (!values.length) return { avg: 0, max: 0, min: 0 };
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: +(sum / values.length).toFixed(1),
      max: +Math.max(...values).toFixed(1),
      min: +Math.min(...values).toFixed(1),
    };
  };

  useEffect(() => {
    if (chartData && selectedSensor) {
      setTemperatureStats(calculateStats(chartData.datasets, selectedSensor));
    }
  }, [chartData, selectedSensor]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const formattedDate = date.toISOString().split("T")[0];
        const resp = await fetch(
          `${process.env.REACT_APP_BE_URL}/proxy/skyspark/coastWine?date=${formattedDate}`,
          { credentials: "include" }
        );
        const rawText = await resp.text();

        // If first line is ver:..., strip it
        const csvData = rawText.startsWith("ver:") ? rawText.split("\n").slice(1).join("\n") : rawText;

        const parsed = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });

        const sensorsMap = {};        // { C21: {time: temp}, C22: {time: temp} }
        const allTimes = new Set();   // unique timestamps

        parsed.data.forEach((row) => {
          const ts = row.ts || row.time || row.timestamp;
          const temperature = row.temperature ?? row.temp ?? row.value;
          const location = (row.location || row.loc || "").toString().toLowerCase();
          const equipment = (row.equipment || row.sensor || row.name || "").toString().replace(/"/g, "").trim();

          // Only wine cellar lines (as per your filter)
          if (!location.includes("wine")) return;
          if (!ts || temperature === undefined || temperature === null) return;

          // Extract sensor id: C21 or C22
          const m = equipment.match(/\bC2[12]\b/);
          if (!m) return;
          const sensorId = m[0];

          const tempNum = parseFloat(temperature);
          if (Number.isNaN(tempNum) || tempNum < 0 || tempNum > 30) return;

          if (!sensorsMap[sensorId]) sensorsMap[sensorId] = {};
          sensorsMap[sensorId][ts] = tempNum;
          allTimes.add(ts);
        });

        const times = [...allTimes].sort();
        const names = Object.keys(sensorsMap).sort(); // usually ["C21","C22"]
        setSensorList(names.length ? names : ["C21", "C22"]);

        // Build datasets (keep both sensors visible)
        const datasets = names.map((name) => {
          const series = times.map(t => sensorsMap[name]?.[t] ?? null);
          const vals = series.filter(v => typeof v === "number");
          const current = vals.length ? vals[vals.length - 1] : null;

          return {
            label: `${name}${current !== null ? " " + current.toFixed(1) + "°C" : ""}`,
            data: series,
            borderColor: sensorColors[name] || "#888888",
            backgroundColor: "transparent",
            tension: 0.25,
            spanGaps: true,
            pointRadius: 0,
            pointHoverRadius: 3,
            borderWidth: 1.8,
            fill: false,
          };
        });

        setChartData({ labels: times, datasets });

        const initial = names[0] || "C21";
        setSelectedSensor(initial);
        setTemperatureStats(calculateStats(datasets, initial));
      } catch (e) {
        console.error(e);
        setError("Failed to fetch data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

 const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: { top: 4, right: 8, bottom: 4, left: 8 }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: "nearest",
      intersect: false,
      callbacks: {
        title: (items) => `Time: ${items[0].label}`,
        label: (ctx) => {
          const sensor = ctx.dataset.label?.split(" ")[0] || "";
          const value = ctx.parsed.y !== null ? ctx.parsed.y.toFixed(1) : "N/A";
          return `${sensor}: ${value}°C`;
        }
      }
    },
    datalabels: {
      display: false // ✅ avoid clutter on line points
    }
  },
  scales: {
    y: {
      title: {
        display: true,
        text: "Temperature (°C)",
        font: { size: 11 }
      },
      grid: { color: "rgba(0,0,0,0.08)" },
      min: 0,
      max: 18,
      ticks: {
        stepSize: 2,
        font: { size: 9 }
      },
      border: {
        display: true,
        color: "rgba(0,0,0,0.3)"
      }
    },
    x: {
      ticks: {
        maxTicksLimit: 8,
        font: { size: 9 },
        autoSkip: true
      },
      title: {
        display: true,
        text: "Time",
        font: { size: 11 }
      },
      grid: { display: false }
    }
  },
  elements: {
    point: {
      radius: 0,
      hoverRadius: 3
    },
    line: {
      borderWidth: 1.5
    }
  },
  interaction: {
    mode: "nearest",
    intersect: false
  }
};


  const handleSensorChange = (e) => setSelectedSensor(e.target.value);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h4 className="text-orange-600 text-lg font-semibold mb-3" style={{ color: "orange" }}>Coast</h4>
        <div className="flex items-center justify-center h-48 text-gray-500">Loading temperature data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h4 className="text-orange-600 text-lg font-semibold mb-3" style={{ color: "orange" }}>Coast</h4>
        <div className="flex items-center justify-center h-48 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-3">
      {/* Header */}
      <div className="flex items-center mb-3" style={{ display: "flex", gap: "5%" }}>
        <h2 className="text-orange-600 font-bold text-lg" style={{ color: "orange" }}>Coast</h2>

        <select className="border-0 px-2 py-1 rounded ml-4" value={selectedSensor} onChange={handleSensorChange}>
          {sensorList.map((sensor) => (
            <option key={sensor} value={sensor}>Wine Cellar {sensor}</option>
          ))}
        </select>

        <div className="ml-auto text-sm text-right" style={{ marginLeft: "65%" }}>
          <div>Avg: <span className="text-blue-600 font-semibold">{temperatureStats.avg}°C</span></div>
          <div>Max: <span className="text-red-600 font-semibold">{temperatureStats.max}°C</span></div>
          <div>Min: <span className="text-green-600 font-semibold">{temperatureStats.min}°C</span></div>
        </div>
      </div>

      {/* Chart — reduced size */}
      <div style={{ width: "100%", padding: "12px" }}>
        <div
          style={{
            width: "50%",
            height: "260px",           // ↓ smaller (was ~400)
            backgroundColor: "#fff",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          {chartData && chartData.datasets.length > 0 ? (
            <div style={{ height: "100%" }}>
              <Line
                data={{
                  labels: chartData.labels,
                  datasets: chartData.datasets, // show both C21 & C22
                }}
                options={chartOptions}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No C21/C22 sensor data available for the selected date.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoastSummaryGraph;
