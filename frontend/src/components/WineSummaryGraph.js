



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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Updated colors to match your image: yellow for MFB22-1, dark blue for MFB22-2, light blue for MFB22-3, red for MFB22-4
const sensorColors = {
  "MFB22-1": "#FFA500", // Orange/Yellow
  "MFB22-2": "#800080", // Dark purple
  "MFB22-3": "#00CED1", // Light blue/Turquoise
  "MFB22-4": "#DC143C"  // Crimson red
};

const WineSummaryGraph = ({ date }) => {
  const [chartData, setChartData] = useState(null);
  const [sensorList, setSensorList] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("MFB22-1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [temperatureStats, setTemperatureStats] = useState({
    avg: 0,
    max: 0,
    min: 0
  });

  // Function to calculate temperature statistics for a specific sensor
  const calculateStats = (datasets, selectedSensor) => {
    let allTemperatures = [];
    
    // Find the specific sensor dataset
    const sensorDataset = datasets.find(d => d.label === selectedSensor);
    
    if (sensorDataset) {
      const validTemps = sensorDataset.data.filter(temp => temp !== null && temp !== undefined);
      allTemperatures = validTemps;
    }
    
    if (allTemperatures.length === 0) {
      return { avg: 0, max: 0, min: 0 };
    }
    
    const avg = allTemperatures.reduce((sum, temp) => sum + temp, 0) / allTemperatures.length;
    const max = Math.max(...allTemperatures);
    const min = Math.min(...allTemperatures);
    
    return {
      avg: parseFloat(avg.toFixed(1)),
      max: parseFloat(max.toFixed(1)),
      min: parseFloat(min.toFixed(1))
    };
  };

  // Function to format time labels (show fewer labels for better readability)
  const formatTimeLabels = (labels) => {
    return labels; // Return all labels, let Chart.js handle the display
  };

  useEffect(() => {
    if (chartData && selectedSensor) {
      const stats = calculateStats(chartData.datasets, selectedSensor);
      setTemperatureStats(stats);
    }
  }, [chartData, selectedSensor]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const formattedDate = date.toISOString().split("T")[0];
        
        const response = await fetch(
          `${process.env.REACT_APP_BE_URL}/proxy/skyspark/coastWine?date=${formattedDate}`,
          { credentials: "include" }
        );
        const rawText = await response.text();
        
        // Skip the first line if it contains version info (starts with "ver:")
        const lines = rawText.split('\n');
        const csvData = lines[0].startsWith('ver:') ? lines.slice(1).join('\n') : rawText;
        
        const parsed = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });

        const sensorsMap = {};
        const allTimes = new Set();

        parsed.data.forEach((row) => {
          // Handle different possible column names
          const ts = row.ts || row.time || row.timestamp;
          const temperature = row.temperature || row.temp || row.value;
          const location = row.location || row.loc;
          const equipment = row.equipment || row.sensor || row.name;

          // Filter for wine cellar data
          if (!location || !location.toLowerCase().includes("wine")) return;

          // Validate required fields
          if (!ts || !equipment || temperature === undefined || temperature === null) return;

          // Parse time from ts field (format: "HH:MM:SS")
          const time = ts;
          
          // Clean equipment name (remove quotes and extra spaces)
          const sensorName = equipment.toString().replace(/"/g, "").trim();
          
          // Filter only MFB22 sensors (MFB22-1, MFB22-2, MFB22-3, MFB22-4)
          if (!sensorName.startsWith("MFB22-")) return;
          
          const temp = parseFloat(temperature);
          
          // Check for valid temperature range (wine cellars typically 0-20°C)
          if (isNaN(temp) || temp < 0 || temp > 30) return;

          allTimes.add(time);
          if (!sensorsMap[sensorName]) sensorsMap[sensorName] = {};
          sensorsMap[sensorName][time] = temp;
        });

        // Sort sensors to ensure consistent order (MFB22-1, MFB22-2, MFB22-3, MFB22-4)
        const allSensorNames = Object.keys(sensorsMap).sort((a, b) => {
          const numA = parseInt(a.split('-')[1]);
          const numB = parseInt(b.split('-')[1]);
          return numA - numB;
        });
        
        setSensorList(allSensorNames);

        // Create datasets for all sensors with updated colors
        const sortedTimes = [...allTimes].sort();
        const datasets = allSensorNames.map((sensorName) => ({
          label: sensorName,
          data: sortedTimes.map((time) => {
            const value = sensorsMap[sensorName][time];
            return value !== undefined ? value : null;
          }),
          borderColor: sensorColors[sensorName] || "#888888",
          backgroundColor: sensorColors[sensorName] || "#888888",
          tension: 0.1,
          spanGaps: true,
          pointRadius: 0, // Hide points for cleaner look like in your image
          pointHoverRadius: 4,
          borderWidth: 2,
          fill: false
        }));

        console.log("Parsed data sample:", parsed.data.slice(0, 5));
        console.log("Sensors found:", allSensorNames);
        console.log("Data points per sensor:", Object.keys(sensorsMap).map(sensor => ({
          sensor,
          points: Object.keys(sensorsMap[sensor]).length
        })));

        const newChartData = {
          labels: sortedTimes,
          datasets
        };

        setChartData(newChartData);
        
        // Calculate initial stats for the first sensor
        const initialSelectedSensor = allSensorNames[0] || "MFB22-1";
        const initialStats = calculateStats(datasets, initialSelectedSensor);
        setTemperatureStats(initialStats);
        setSelectedSensor(initialSelectedSensor);

        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

  const handleSensorChange = (e) => {
    const newSelectedSensor = e.target.value;
    setSelectedSensor(newSelectedSensor);
  };

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'nearest',
      intersect: false,
      callbacks: {
        title: function(tooltipItems) {
          return `Time: ${tooltipItems[0].label}`;
        },
        label: function(context) {
          return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}°C`;
        }
      }
    },
    datalabels: { display: false }   //  ADD THIS LINE
  },
  scales: {
    y: {
      title: {
        display: true,
        text: "Temperature (°C)",
        font: { size: 12, weight: 'normal' }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
        drawBorder: true
      },
      min: 0,
      max: 18,
      ticks: {
        stepSize: 2,
        font: { size: 10 }
      },
      border: {
        display: true,
        color: 'rgba(0, 0, 0, 0.3)'
      }
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
    point: { radius: 0, hoverRadius: 4 }
  }
};


  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h4 className="text-orange-600 text-lg font-semibold mb-4">AJI - Wine Cellar</h4>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading temperature data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h4 className="text-orange-600 text-lg font-semibold mb-4">AJI - Wine Cellar</h4>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-3">
      {/* Header */}
      {/* <div className="flex items-center mb-3">
        <h2 className="text-orange-600 font-bold text-lg">AJI</h2>
         <div className="ml-auto text-sm text-right" style={{display:"flex", alignItems:"end",justifyContent:"start",flexDirection:"column", marginRight: "20px"}}></div>
        <select
          className="border px-2 py-1 rounded ml-4"
          value={selectedSensor}
          onChange={handleSensorChange}
        >
          {sensorList.map((sensor) => (
            <option key={sensor} value={sensor}>
              Wine Cellar {sensor}
            </option>
          ))}
        </select>
        <div className="ml-auto text-sm text-right" style={{display:"flex", alignItems:"end",justifyContent:"start",flexDirection:"column"}}>
          <div>Avg: <span className="text-blue-600 font-semibold">{temperatureStats.avg}°C</span></div>
          <div>Max: <span className="text-red-600 font-semibold">{temperatureStats.max}°C</span></div>
          <div>Min: <span className="text-green-600 font-semibold">{temperatureStats.min}°C</span></div>
        </div>
      </div> */}

      <div className="flex items-center mb-3 "style={{display:"flex",flexDirection:"row",gap:"5%"}}>
  <h2 className="text-orange-600 font-bold text-lg px-2 py-1" style={{color:"orange"}}>AJI</h2>
  
  <select
    className="border-0 px-2 py-1 rounded ml-4"
    value={selectedSensor}
    onChange={handleSensorChange}
  >
    {sensorList.map((sensor) => (
      <option key={sensor} value={sensor}>
        Wine Cellar {sensor}
      </option>
    ))}
  </select>
  
  <div className="ml-auto text-sm flex items-center gap-4" style={{marginLeft:"40%"}} >
    <div>Avg: <span className="text-blue-600 font-semibold">{temperatureStats.avg}°C</span></div>
    <div>Max: <span className="text-red-600 font-semibold">{temperatureStats.max}°C</span></div>
    <div>Min: <span className="text-green-600 font-semibold">{temperatureStats.min}°C</span></div>
  </div>
</div>

      {/* Single Chart Layout */}
      <div style={{ 
        width: '100%',
        padding: '16px'
      }}>
        <div
          style={{
            width: "100%",
            height: "400px",
            backgroundColor: "#fff",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0"
          }}
        >
          {chartData && chartData.datasets.length > 0 ? (
            <div style={{ height: "100%" }}>
              <Line
                data={{
                  labels: formatTimeLabels(chartData.labels),
                  datasets: chartData.datasets // Always show all sensors
                }}
                options={chartOptions}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">No MFB22 sensor data available for the selected date.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WineSummaryGraph;