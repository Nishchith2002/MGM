import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registering the necessary components for chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const SensorGraph = ({ sensorData }) => {
  const { timestamps, temperatures } = sensorData;

  const graphData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperatures,
        borderColor: '#ff7204',
        backgroundColor: 'rgba(255, 114, 4, 0.2)',
        fill: false,
        pointRadius: 3,
        pointBackgroundColor: '#ff7204',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Sensor Temperature Data',
      },
      tooltip: {
        backgroundColor: '#333',
        titleColor: '#fff',
        bodyColor: '#fff',
      },
    },
    scales: {
      x: {
        type: 'category',
        labels: graphData.labels,
        grid: {
          color: '#ccc',
          lineWidth: 1,
        },
        ticks: {
          color: '#333',
          font: {
            size: 12,
            family: "'Arial', sans-serif",
          },
        },
      },
      y: {
        grid: {
          color: '#ccc',
          lineWidth: 1,
        },
        ticks: {
          color: '#333',
          font: {
            size: 12,
            family: "'Arial', sans-serif",
          },
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '400px', marginTop: '20px' }}>
      <Line data={graphData} options={options} />
    </div>
  );
};

export default SensorGraph;
