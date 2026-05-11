// ABASummaryGraph.jsx
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
// If you have chartjs-plugin-datalabels installed, you can import it.
// import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
  // , ChartDataLabels
);

// Colors for TH-0001..TH-0005
const sensorColors = {
  "TH-0001": "#FFA500",
  "TH-0002": "#0033A0",
  "TH-0003": "#00B5E2",
  "TH-0004": "#DC143C",
  "TH-0005": "#2E8B57"
};

const EQUIPMENT_TO_ABA_NAME = {
  "TH-0001": "ABA Wine Cellar 1",
  "TH-0002": "ABA Wine Cellar 2",
  "TH-0003": "ABA Wine Cellar 3",
  "TH-0004": "ABA Wine Cellar 4",
  "TH-0005": "ABA Wine Cellar 5"
};

const ABASummaryGraph = ({ date }) => {
  const [chartData, setChartData] = useState(null);
  const [sensorList, setSensorList] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("TH-0001");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [temperatureStats, setTemperatureStats] = useState({ avg: 0, max: 0, min: 0 });

  const calcStats = (datasets, sel) => {
    const ds = datasets.find(d => d.label === sel);
    if (!ds) return { avg: 0, max: 0, min: 0 };
    const vals = ds.data.filter(v => v !== null && v !== undefined);
    if (!vals.length) return { avg: 0, max: 0, min: 0 };
    const sum = vals.reduce((a, b) => a + b, 0);
    return {
      avg: +(sum / vals.length).toFixed(1),
      max: +Math.max(...vals).toFixed(1),
      min: +Math.min(...vals).toFixed(1)
    };
  };

  useEffect(() => {
    if (chartData && selectedSensor) {
      setTemperatureStats(calcStats(chartData.datasets, selectedSensor));
    }
  }, [chartData, selectedSensor]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const formattedDate = date.toISOString().split("T")[0];

        const res = await fetch(
          `${process.env.REACT_APP_BE_URL}/proxy/skyspark/wineABA?date=${formattedDate}`,
          { credentials: "include" }
        );
        const raw = await res.text();

        const lines = raw.split("\n");
        const csvText = lines[0].startsWith("ver:") ? lines.slice(1).join("\n") : raw;

        const parsed = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });

        const sensorsMap = {};
        const timeSet = new Set();

        (parsed.data || []).forEach(row => {
          const ts = row.ts || row.time || row.Time || row.timestamp || row.timeStamp;
          const eq = (row.equipment || row.sensor || row.name || "")
            .toString()
            .replace(/"/g, "")
            .trim();
          const tmp = row.temperature ?? row.temp ?? row.value;

          if (!ts || !eq || tmp === undefined || tmp === null) return;
          if (!/^TH-000[1-5]$/i.test(eq)) return;

          const t = String(ts).trim(); // "HH:MM:SS"
          const temp = parseFloat(tmp);
          if (!Number.isFinite(temp)) return;

          timeSet.add(t);
          if (!sensorsMap[eq]) sensorsMap[eq] = {};
          sensorsMap[eq][t] = temp;
        });

        const times = [...timeSet].sort();
        const order = ["TH-0001", "TH-0002", "TH-0003", "TH-0004", "TH-0005"].filter(k => sensorsMap[k]);
        setSensorList(order);

        const datasets = order.map(eq => ({
          label: eq,
          data: times.map(t => sensorsMap[eq][t] ?? null),
          borderColor: sensorColors[eq] || "#888",
          backgroundColor: sensorColors[eq] || "#888",
          tension: 0.1,
          spanGaps: true,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
          fill: false
        }));

        setChartData({ labels: times, datasets });

        const initial = order[0] || "TH-0001";
        setSelectedSensor(initial);
        setTemperatureStats(calcStats(datasets, initial));
        setError(null);
      } catch (e) {
        console.error(e);
        setError("Failed to fetch ABA data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "nearest",
        intersect: false,
        callbacks: {
          title: items => `Time: ${items[0].label}`,
          label: ctx =>
            `${EQUIPMENT_TO_ABA_NAME[ctx.dataset.label] || ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}°C`
        }
      },
      // ✅ Hide any data labels if the plugin is present
      datalabels: { display: false }
    },
    scales: {
      y: {
        title: { display: true, text: "Temperature (°C)", font: { size: 12 } },
        min: 0,
        max: 18,
        ticks: { stepSize: 2, font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.1)" },
        border: { display: true, color: "rgba(0,0,0,0.3)" }
      },
      x: {
        ticks: { maxTicksLimit: 12 },
        title: { display: true, text: "Time" }
      }
    },
    interaction: { mode: "point", intersect: false },
    elements: { point: { radius: 0, hoverRadius: 4 } }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h4 className="text-orange-600 text-lg font-semibold mb-4">ABA - Wine Cellar</h4>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Loading temperature data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h4 className="text-orange-600 text-lg font-semibold mb-4">ABA - Wine Cellar</h4>
        <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-3">
      <div
        className="flex items-center mb-3"
        style={{ display: "flex", flexDirection: "row", gap: "5%" }}
      >
        <h2 className="text-orange-600 font-bold text-lg px-2 py-1" style={{ color: "orange" }}>
          ABA
        </h2>

        <select
          className="border-0 px-2 py-1 rounded ml-4"
          value={selectedSensor}
          onChange={e => setSelectedSensor(e.target.value)}
        >
          {sensorList.map(sensor => (
            <option key={sensor} value={sensor}>
              ABA Cellar {sensor}
            </option>
          ))}
        </select>

        <div className="ml-auto text-sm flex items-center gap-4" style={{ marginLeft: "40%" }}>
          <div>
            Avg: <span className="text-blue-600 font-semibold">{temperatureStats.avg}°C</span>
          </div>
          <div>
            Max: <span className="text-red-600 font-semibold">{temperatureStats.max}°C</span>
          </div>
          <div>
            Min: <span className="text-green-600 font-semibold">{temperatureStats.min}°C</span>
          </div>
        </div>
      </div>

      <div style={{ width: "100%", padding: 16 }}>
        <div
          style={{
            width: "100%",
            height: 400,
            backgroundColor: "#fff",
            padding: 16,
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0"
          }}
        >
          {chartData && chartData.datasets.length ? (
            <Line data={{ labels: chartData.labels, datasets: chartData.datasets }} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No ABA sensor data available for the selected date.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ABASummaryGraph;
