import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const TemperatureGraph = ({ selectedSensorData, onClose, selectedDate, floor = "L1", isMansionOne = false }) => {
  const [temperatureData, setTemperatureData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      if (!selectedSensorData) return;
      setLoading(true);

      try {
        const date = new Date(selectedDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

            let csvFiles = [];
     
if (floor === 'CotaiGFM1F') {
  csvFiles = [
    `/Data/CotaiGFM1F/${year}-${month}-${day}_1.csv`,
    `/Data/CotaiGFM1F/${year}-${month}-${day}_2.csv`,
    `/Data/CotaiGFM1F/${year}-${month}-${day}_3.csv`,
  ];
} else if (floor === 'Cotai') {
  csvFiles = [
    `/Data/Cotai/${year}-${month}-${day}_1.csv`,
    `/Data/Cotai/${year}-${month}-${day}_2.csv`,
  ];
} 
else if (floor === 'Cotai2F2FM') {
  // Check if this is Mansion One mode
  if (isMansionOne) {
    csvFiles = [
      `/Data/Cotai2F2FM/mansion_temp.csv`
    ];
  } else {
    csvFiles = [
      `/Data/Cotai2F2FM/${year}-${month}-${day}_1.csv`,
      `/Data/Cotai2F2FM/${year}-${month}-${day}_2.csv`,
      `/Data/Cotai2F2FM/${year}-${month}-${day}_3.csv`,
    ];
  }
}
else if (floor === 'GrandePraca') {
  csvFiles = [`/Data/GrandePraca/${year}-${month}-${day}.csv`];
}
else if (floor === 'Cotai3F') {
  csvFiles = [`/Data/Cotai3F/${year}-${month}-${day}.csv`];
}
 else {
  csvFiles = [`/Data/${floor}/${year}-${month}-${day}.csv`];
}


        const allData = [];
        for (const file of csvFiles) {
          try {
            const response = await fetch(file);
            if (response.ok) {
              const text = await response.text();
              const parsed = Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
              });
              allData.push(...parsed.data);
            } else {
              console.warn(`Could not load ${file}`);
            }
          } catch (err) {
            console.error(`Error loading ${file}`, err);
          }
        }

   const sensorName = String(
  selectedSensorData.equipment || selectedSensorData.sensor || selectedSensorData.navName || selectedSensorData.id
).trim().toLowerCase();



const sensorData = allData.filter(row => {
  const name = String(row.equipment || row.sensor || row.navName || row.id || '').trim().toLowerCase();
  return name === sensorName;
});




console.log(`Found ${sensorData.length} records for sensor: ${sensorName}`);
console.log('Available sensor names in CSV:', [...new Set(allData.map(row => String(row.equipment || row.navName || row.sensor || '').trim()).filter(n => n))]);


        const hourlyData = [];
        for (let hour = 0; hour <= 23; hour++) {
          const hourRecords = sensorData.filter(row => {
            const timestamp = row.timeStamp || row.timestamp || row.date || row.time;
            if (!timestamp) return false;
            const cleanedTimestamp = (timestamp || '').replace(/ Hong_Kong/g, '').trim();
            const rowDate = new Date(cleanedTimestamp);
            return !isNaN(rowDate.getTime()) && rowDate.getHours() === hour;
          });

          let tempValue = null;
          if (hourRecords.length > 0) {
            const temps = hourRecords.map(record => {
              if (typeof record.temperature === 'number') return record.temperature;
              if (typeof record.temperature === 'string') return parseFloat(record.temperature.replace("°C", ""));
              return null;
            }).filter(t => t !== null && !isNaN(t));
if (isNaN(tempValue)) {
  console.warn("Invalid temp for hour", hour, "->", temps);
}

            if (temps.length > 0) {
              tempValue = temps.reduce((sum, t) => sum + t, 0) / temps.length;
            }
          }

          const formattedHour = `${String(hour).padStart(2, '0')}:00`;
          hourlyData.push({ hour: formattedHour, temp: tempValue, displayTime: formattedHour });
        }

        hourlyData.push({ hour: "24:00", temp: hourlyData[0]?.temp, displayTime: "24:00" });
        setTemperatureData(hourlyData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching temperature data:", err);
        setError("Failed to load temperature data");
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [selectedSensorData, selectedDate]);

  if (!selectedSensorData) return null;
  const sensorName =
  selectedSensorData.equipment ||
  selectedSensorData.sensor ||
  selectedSensorData.navName ||
  selectedSensorData.id ||
  'Unknown';

  const grayTheme = {
    background: '#636363',
    text: '#ffffff',
    grid: '#ffffff',
    line: '#e58e00'
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && payload[0].value !== null) {
      const point = payload[0].payload;
      const fullTimestamp = `${selectedDate.toLocaleDateString('en-US')} ${point.hour}:00`;
      return (
        <div style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', color: '#000' }}>
          <div><strong>timeStamp</strong></div>
          <div>{fullTimestamp}</div>
          <div>{point.temp?.toFixed(1)}°C</div>
        </div>
      );
    }
    return null;
  };

  const generateHourTicks = () => {
    const mainTicks = [];
    for (let h = 0; h <= 23; h++) {
      mainTicks.push(`${String(h).padStart(2, '0')}:00`);
    }
    return mainTicks;
  };

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, p: 2 }}>
      <Box sx={{ backgroundColor: grayTheme.background, borderRadius: '0px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)', width: '90%', maxWidth: '1000px', p: 0, position: 'relative', color: grayTheme.text }}>
        <Box sx={{ backgroundColor: '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: '1px solid #444' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Daily Zone Temperature: {sensorName}</Typography>
          <IconButton onClick={onClose} sx={{ color: 'white', p: 0.5 }}><Typography sx={{ fontWeight: 'bold', fontSize: '16px' }}>X</Typography></IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, p: 2 }}>
            <Typography>Loading temperature data...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, p: 2 }}>
            <Typography sx={{ color: 'error.main' }}>{error}</Typography>
          </Box>
        ) : temperatureData.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, p: 2 }}>
            <Typography>No temperature data available for this sensor today.</Typography>
          </Box>
        ) : (
          <Box sx={{ height: 500, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temperatureData} margin={{ top: 20, right: 30, left: 50, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grayTheme.grid} opacity={0.5} />
                <XAxis dataKey="hour" tick={{ fill: 'white', fontSize: 11 }} axisLine={{ stroke: 'white' }} tickLine={{ stroke: 'white' }} ticks={generateHourTicks()} />
                <YAxis domain={[16, 34]} ticks={[16, 18, 20, 22, 24, 26, 28, 30, 32, 34]} label={{ value: 'Temperature °C', angle: -90, position: 'insideLeft', fill: 'white', offset: -35 }} tick={{ fill: 'white', fontSize: 12 }} axisLine={{ stroke: 'white' }} tickLine={{ stroke: 'white' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="temp" stroke={grayTheme.line} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#000000', stroke: grayTheme.line, strokeWidth: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TemperatureGraph;
