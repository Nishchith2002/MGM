






import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
// import { Grid } from '@mui/material';
import { Grid, Box, Typography } from "@mui/material";

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

// Sensor groups
const GROUPS = {
  "FEB18-1 to 8": ["FEB18-1", "FEB18-2", "FEB18-3", "FEB18-4", "FEB18-5", "FEB18-6", "FEB18-7", "FEB18-8"],
  "FEB18-9 to 16": ["FEB18-9", "FEB18-10", "FEB18-11", "FEB18-12", "FEB18-13", "FEB18-14", "FEB18-15", "FEB18-16"],
  "FEB18-17 to 24": ["FEB18-17", "FEB18-18", "FEB18-19", "FEB18-20", "FEB18-21", "FEB18-22", "FEB18-23", "FEB18-24"],
  "FEB19-1 to 4": ["FEB19-1", "FEB19-2", "FEB19-3", "FEB19-4"]
};

const sensorColors = {
  // Group 1: FEB18-1 to FEB18-8
  "FEB18-1": "#DC143C",   // Crimson Red
  "FEB18-2": "#1E90FF",   // Dodger Blue
  "FEB18-3": "#32CD32",   // Lime Green
  "FEB18-4": "#FFA500",   // Orange
  "FEB18-5": "#9370DB",   // Medium Purple
  "FEB18-6": "#20B2AA",   // Light Sea Green
  "FEB18-7": "#FF1493",   // Deep Pink
  "FEB18-8": "#00CED1",   // Dark Turquoise

  // Group 2: FEB18-9 to FEB18-16
  "FEB18-9": "#008000",   // Green
  "FEB18-10": "#8B0000",  // Dark Red
  "FEB18-11": "#00008B",  // Dark Blue
  "FEB18-12": "#B8860B",  // Dark GoldenRod
  "FEB18-13": "#4B0082",  // Indigo
  "FEB18-14": "#A0522D",  // Sienna
  "FEB18-15": "#9932CC",  // Dark Orchid
  "FEB18-16": "#5F9EA0",  // Cadet Blue

  // Group 3: FEB18-17 to FEB18-24
  "FEB18-17": "#DAA520",  // GoldenRod
  "FEB18-18": "#FF4500",  // Orange Red
  "FEB18-19": "#6A5ACD",  // Slate Blue
  "FEB18-20": "#008B8B",  // Dark Cyan
  "FEB18-21": "#FF69B4",  // Hot Pink
  "FEB18-22": "#3CB371",  // Medium Sea Green
  "FEB18-23": "#4682B4",  // Steel Blue
  "FEB18-24": "#C71585",  // Medium Violet Red

  // Group 4: FEB19-1 to FEB19-4
  "FEB19-1": "#CD5C5C",   // Indian Red
  "FEB19-2": "#00FA9A",   // Medium Spring Green
  "FEB19-3": "#BA55D3",   // Medium Orchid
  "FEB19-4": "#87CEFA"    // Light Sky Blue
};

const GrillSummaryGraph = ({ date }) => {
  const [sensorData, setSensorData] = useState({});
  const [timestamps, setTimestamps] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [stats, setStats] = useState({ avg: 0, min: 0, max: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const formattedDate = date.toISOString().split("T")[0];
       const response = await fetch(
          `${process.env.REACT_APP_BE_URL}/proxy/skyspark/coastWine?date=${formattedDate}`,
          { credentials: "include" }
        );
      const text = await response.text();
      const csv = text.startsWith("ver:") ? text.split("\n").slice(1).join("\n") : text;

      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true, dynamicTyping: true });

      const rawData = {};
      const times = [];

      parsed.data.forEach((row) => {
        const ts = row.ts;
        const sensor = row.equipment?.replace(/"/g, "").trim();
        const temp = parseFloat(row.temperature);

        if (!sensor || !sensor.startsWith("FEB") || isNaN(temp)) return;

        if (!rawData[sensor]) rawData[sensor] = {};
        rawData[sensor][ts] = temp;
        if (!times.includes(ts)) times.push(ts);
      });

      setSensorData(rawData);
      setTimestamps(times.sort());
      const firstSensor = Object.keys(rawData)[0];
      setSelectedSensor(firstSensor);
    };

    fetchData();
  }, [date]);

  useEffect(() => {
    if (selectedSensor && sensorData[selectedSensor]) {
      const temps = Object.values(sensorData[selectedSensor]);
      const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
      const min = Math.min(...temps);
      const max = Math.max(...temps);
      setStats({ avg: avg.toFixed(2), min: min.toFixed(2), max: max.toFixed(2) });
    }
  }, [selectedSensor, sensorData]);

  const buildChartData = (sensorNames) => {
    return {
      labels: timestamps,
      datasets: sensorNames.map((sensor) => {
        const sensorTemps = timestamps.map((t) => sensorData[sensor]?.[t] ?? null).filter(temp => temp !== null);
        const currentTemp = sensorTemps.length > 0 ? sensorTemps[sensorTemps.length - 1] : 0;
        
        return {
          label: `${sensor} ${currentTemp.toFixed(1)}°C`,
          data: timestamps.map((t) => sensorData[sensor]?.[t] ?? null),
          borderColor: sensorColors[sensor] || "#000",
          backgroundColor: "transparent",
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 0,
          spanGaps: true
        };
      })
    };
  };
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false, // hide legend completely
      position: 'top',
      align: 'start',
      labels: {
        usePointStyle: true,
        pointStyle: 'line',
        boxWidth: 20,
        boxHeight: 2,
        padding: 10,
        font: { size: 11 }
      }
    },
    tooltip: {
      mode: 'nearest',
      intersect: false,
      callbacks: {
        title: (tooltipItems) => `Time: ${tooltipItems[0].label}`,
        label: (context) => {
          const sensor = context.dataset.label?.split(" ")[0] || "";
          const value = context.parsed.y !== null ? context.parsed.y.toFixed(1) : "N/A";
          return `${sensor}: ${value}°C`;
        }
      }
    },
    datalabels: {
      display: false // ✅ disable point value labels
    }
  },
  scales: {
    y: {
      title: {
        display: true,
        text: "Temperature (°C)",
        font: { size: 12 }
      },
      min: 0,
      max: 20,
      ticks: { stepSize: 2 }
    },
    x: {
      ticks: { maxTicksLimit: 12 },
      title: { display: true, text: "Time" }
    }
  },
  interaction: {
    mode: 'point',
    intersect: false
  },
  elements: {
    point: {
      radius: 0,
      hoverRadius: 4
    }
  }
};



  const allGrillSensors = Object.keys(sensorData).filter((s) => s.startsWith("FEB"));

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-3">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-orange-600 font-bold text-lg" style={{color:"orange"}}>Grill 58</h2>
        <select
          className="border px-2 py-1 rounded"
          value={selectedSensor}
          onChange={(e) => setSelectedSensor(e.target.value)}
        >
          {allGrillSensors.map((sensor) => (
            <option key={sensor} value={sensor}>{sensor}</option>
          ))}
        </select>
        <div className="text-sm text-right" style={{marginLeft:"88%"}}>
          <div>Avg: <span className="text-blue-600 font-semibold">{stats.avg}°C</span></div>
          <div>Max: <span className="text-red-600 font-semibold">{stats.max}°C</span></div>
          <div>Min: <span className="text-green-600 font-semibold">{stats.min}°C</span></div>
        </div>
      </div>

      {/* 2x2 Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gridTemplateRows: '1fr 1fr',
        gap: '16px',
        width: '100%',
        padding: '16px'
      }}>
        {Object.entries(GROUPS).map(([label, sensors]) => (
          <div
            key={label}
            style={{
              width: "100%",
              height: "300px",
              backgroundColor: "#fff",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "1px solid #e0e0e0"
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, fontSize: 15, marginBottom: 1 }}
            >
              {label}
            </Typography>
            <div style={{ height: "250px" }}>
              <Line data={buildChartData(sensors)} options={options} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrillSummaryGraph;