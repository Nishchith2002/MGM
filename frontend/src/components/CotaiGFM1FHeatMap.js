import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import { Box, Slider, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Tooltip as ReactTooltip } from 'react-tooltip';

import GFM1FBase from '../assets/MGM COTAI GMF & 1F.jpg';
import GFM1FOverlay from '../assets/MGM COTAI 1F & GFM_top.png';

const BASE_WIDTH = 3990;
const BASE_HEIGHT = 2450;

const timeMarks = [
  { value: 0, label: '00:00' },
  { value: 24, label: '06:00' },
  { value: 48, label: '12:00' },
  { value: 72, label: '18:00' },
  { value: 95, label: '23:45' },
];

const CotaiGFM1FHeatMap = ({
  zoom,
  selectedDate,
  selectedTime,
  showSensorDots,
  setSelectedSensorData,
  setSensorMap,
  setSelectedDate,
  setSelectedTime,
}) => {
  const canvasRef = useRef();
  const imgRef = useRef();
  const [sensorData, setSensorData] = useState([]);
  const [imgSize, setImgSize] = useState({ width: 1, height: 1 });

  const blinkingStyles = `
    @keyframes blink-border {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.3; }
    }
  `;

  const getDotColor = (temp) => {
    const t = parseFloat(temp);
    if (isNaN(t)) return 'gray';
    if (t >= 27.5) return '#ff3b04';
    if (t >= 26.5) return '#ff7204';
    if (t >= 24.5) return '#ffff00';
    if (t >= 21.5) return '#98ff54';
    if (t >= 18.5) return '#6ea9b7';
    return '#3333ff';
  };

  const filterSensorData = () => {
  return sensorData.filter((sensor) => parseInt(sensor.timeIndex) === selectedTime);
};


  const fetchSensorData = async () => {
    const d = new Date(selectedDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    const file1 = `/Data/CotaiGFM1F/${yyyy}-${mm}-${dd}_1.csv`;
    const file2 = `/Data/CotaiGFM1F/${yyyy}-${mm}-${dd}_2.csv`;
    const file3 = `/Data/CotaiGFM1F/${yyyy}-${mm}-${dd}_3.csv`;
    const coordFile = `/Data/CotaiGFM1F/GFM1FCoordinates.csv`;

    try {
      const [res1, res2, res3, resCoord] = await Promise.all([
        fetch(file1).then((r) => r.text()),
        fetch(file2).then((r) => r.text()),
        fetch(file3).then((r) => r.text()),
        fetch(coordFile).then((r) => r.text()),
      ]);

      const parsed1 = Papa.parse(res1, { header: true, skipEmptyLines: true }).data;
      const parsed2 = Papa.parse(res2, { header: true, skipEmptyLines: true }).data;
      const parsed3 = Papa.parse(res3, { header: true, skipEmptyLines: true }).data;
      const coords = Papa.parse(resCoord, { header: true, skipEmptyLines: true }).data;

      const sensorMap = {};
      coords.forEach((row) => {
        const id = row.sensor?.trim() || row.equipment?.trim();
        if (id) {
          sensorMap[id] = {
            xLoc: parseFloat(row.xLoc),
            yLoc: parseFloat(row.yLoc),
            location: row.location || '',
          };
        }
      });
const mergedData = [...parsed1, ...parsed2, ...parsed3].map((row) => {
  const id = row.equipment?.trim() || row.sensor?.trim();
  const meta = sensorMap[id] || {};

  // 👇 Parse timestamp and compute slider index
  let timeIndex = 0;
  const rawTime = row.timeStamp || row.timestamp || row.TimeStamp || row.time;
  if (rawTime) {
    const dateObj = new Date(rawTime.replace('Hong_Kong', '').trim());
    if (!isNaN(dateObj)) {
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes();
      timeIndex = hours * 4 + Math.floor(minutes / 15);
    }
  }

  return {
    ...row,
    equipment: id,
    xLoc: parseFloat(row.xLoc) || meta.xLoc,
    yLoc: parseFloat(row.yLoc) || meta.yLoc,
    location: meta.location || row.location || '',
    temperature: row.temperature,
    humidity: row.humidity,
    timeIndex: timeIndex, // ✅ Correctly computed time index
  };
}).filter((d) => !isNaN(d.xLoc) && !isNaN(d.yLoc));



      setSensorData(mergedData);
      setSensorMap(sensorMap);
    } catch (err) {
      console.error('Failed to load GFM & 1F sensor data:', err);
    }
  };

  const drawGradient = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !canvas.getContext || !img) return;

    const ctx = canvas.getContext('2d');
    const width = img.clientWidth;
    const height = img.clientHeight;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    filterSensorData().forEach((sensor) => {

      const temp = parseFloat(sensor.temperature);
      const x = parseFloat(sensor.xLoc);
      const y = parseFloat(sensor.yLoc);
      if (isNaN(temp) || isNaN(x) || isNaN(y)) return;

      const dotX = (x / BASE_WIDTH) * width;
      const dotY = (y / BASE_HEIGHT) * height;

      const gradient = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 150);
      const color = getDotColor(temp);
      gradient.addColorStop(0, `${color}55`);
      gradient.addColorStop(0.5, `${color}22`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 50, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  useEffect(() => {
    fetchSensorData();
  }, [selectedDate]);

  useEffect(() => {
    drawGradient();
  }, [sensorData, imgSize]);

  return (
    <Box>
      <style>{blinkingStyles}</style>

     

      <Box sx={{ width: '90vw', margin: 'auto', position: 'relative', marginTop: '150px' }}>
        <Box sx={{ position: 'relative', transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <img
            ref={imgRef}
            src={GFM1FBase}
            alt="GFM1F Floor"
            onLoad={(e) => {
              setImgSize({
                width: e.target.clientWidth,
                height: e.target.clientHeight,
              });
              drawGradient();
            }}
            style={{ width: '100%' }}
          />

          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          />

          <img
            src={GFM1FOverlay}
            alt="GFM1F Overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              pointerEvents: 'none',
            }}
          />

          {showSensorDots &&
  filterSensorData().map((sensor, i) => {

              const x = parseFloat(sensor.xLoc);
              const y = parseFloat(sensor.yLoc);
              const temp = parseFloat(sensor.temperature);
              const humidity = parseFloat(sensor.humidity);
              const equipment = sensor.equipment;
              const location = sensor.location;

              if (isNaN(x) || isNaN(y)) return null;

              const scaleX = imgSize.width / BASE_WIDTH;
              const scaleY = imgSize.height / BASE_HEIGHT;

              const top = y * scaleY;
              const left = x * scaleX;
              const tooltipId = `sensor-${i}`;

              let borderColor = 'white';
              let borderWidth = 1;
              let isBlinking = false;

              if (!isNaN(temp)) {
                if (temp > 24) {
                  borderColor = 'red';
                  borderWidth = 4;
                  isBlinking = true;
                } else if (temp < 21) {
                  borderColor = 'blue';
                  borderWidth = 6;
                  isBlinking = true;
                }
              }

              return (
                <div
                  key={tooltipId}
                  style={{
                    position: 'absolute',
                    top: `${top}px`,
                    left: `${left}px`,
                    transform: 'translate(-50%, -50%)',
                    width: 30,
                    height: 30,
                    zIndex: 4,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedSensorData(sensor)}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: `${borderWidth}px solid ${borderColor}`,
                      animation: isBlinking ? 'blink-border 1s infinite' : 'none',
                      boxSizing: 'border-box',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                  <div
                    data-tooltip-id={tooltipId}
                    style={{
                      width: 26,
                      height: 26,
                      backgroundColor: 'black',
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '8px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'absolute',
                      top: '2px',
                      left: '2px',
                    }}
                  >
                    {isNaN(temp) ? 'NaN' : `${temp.toFixed(1)}°C`}
                    <ReactTooltip id={tooltipId} place="top" style={{ zIndex: 9999 }}>
                      <div style={{ textAlign: 'left' }}>
                        <strong>Sensor:</strong> {equipment}<br />
                        <strong>Location:</strong> {location}<br />
                        <strong>Temp:</strong> {isNaN(temp) ? 'NaN' : `${temp.toFixed(1)}°C`}<br />
                        <strong>Hum:</strong> {isNaN(humidity) ? 'NaN' : `${humidity.toFixed(1)}%`}
                      </div>
                    </ReactTooltip>
                  </div>
                </div>
              );
            })}
        </Box>
      </Box>
    </Box>
  );
};

export default CotaiGFM1FHeatMap;
