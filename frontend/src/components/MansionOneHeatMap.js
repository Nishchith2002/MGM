


import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import { Box } from '@mui/material';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import MansionBaseImage from '../assets/Mansion_2FM_Base.jpg';
import MansionOverlayImage from '../assets/Mansion_2FM_Overlay.png';

const BASE_WIDTH = 4000;
const BASE_HEIGHT = 2500;

const MansionOneHeatMap = ({
  zoom,
  selectedDate,
  selectedTime,
  showSensorDots,
  setSelectedSensorData,
  setSensorMap
}) => {
  const canvasRef = useRef();
  const imgRef = useRef();
  const [sensorData, setSensorData] = useState([]);
  const [imgSize, setImgSize] = useState({ width: 1, height: 1 });

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

  const parseManualCSV = (csv) => {
    const lines = csv.trim().split('\n');
    if (lines.length < 1) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const obj = {};
      const values = lines[i].split(',');
      headers.forEach((header, idx) => {
        obj[header] = values[idx]?.trim() || '';
      });
      data.push(obj);
    }
    
    return data;
  };

  const fetchSensorData = async () => {
    console.log(' MANSION ONE: Fetching data');
    
    const dataFile = `/Data/Cotai2F2FM/mansion_temp.csv`;
    const coordFile = `/Data/Cotai2F2FM/mansion_coordinates.csv`;

    try {
      const [resData, resCoord] = await Promise.all([
        fetch(dataFile),
        fetch(coordFile)
      ]);

      if (!resData.ok || !resCoord.ok) {
        console.error('❌ File fetch failed');
        return;
      }

      const dataText = await resData.text();
      const coordText = await resCoord.text();

      // Manual CSV parsing
      const parsedData = parseManualCSV(dataText);
      const coordData = parseManualCSV(coordText);

      console.log('✅ Data records:', parsedData.length);
      console.log('✅ Coordinates:', coordData.length);
      console.log('First data row:', parsedData[0]);
      console.log('First coord row:', coordData[0]);

      // Build coordinate map
      const coordMap = {};
      coordData.forEach(row => {
        const navName = row.navName?.trim();
        const xLoc = parseFloat(row.xLoc);
        const yLoc = parseFloat(row.yLoc);
        
        if (navName && !isNaN(xLoc) && !isNaN(yLoc)) {
          coordMap[navName] = { xLoc, yLoc, location: row.location?.trim() || '' };
        }
      });

      console.log(' Coordinate map:', Object.keys(coordMap).length, 'sensors');

      // Get selected date
      const selectedDateStr = selectedDate.toLocaleDateString('en-CA');
      console.log(' Filtering for date:', selectedDateStr);

      // Process data
      const processedData = parsedData
        .map(row => {
          const equipment = row.equipment?.trim();
          const timeStamp = row.timeStamp?.trim();
          const temperature = parseFloat((row.temperature || '').toString().replace(/[^\d.-]/g, ''));
          const humidity = parseFloat((row.humidity || '').toString().replace(/[^\d.-]/g, ''));

          // Parse timestamp
          let recordDate = '';
          let timeIndex = 0;
          
          if (timeStamp) {
            try {
              const dateObj = new Date(timeStamp.replace('Hong_Kong', '').trim());
              if (!isNaN(dateObj)) {
                recordDate = dateObj.toLocaleDateString('en-CA');
                const hours = dateObj.getHours();
                const minutes = dateObj.getMinutes();
                timeIndex = hours * 4 + Math.floor(minutes / 15);
              }
            } catch (e) {
              console.warn('Date error:', timeStamp);
            }
          }

          const coords = coordMap[equipment] || {};

          return {
            equipment,
            temperature,
            humidity,
            recordDate,
            timeIndex,
            xLoc: coords.xLoc,
            yLoc: coords.yLoc,
            location: coords.location || ''
          };
        })
        .filter(d => {
          const hasCoords = !isNaN(d.xLoc) && !isNaN(d.yLoc);
          const matchesDate = d.recordDate === selectedDateStr;
          return hasCoords && matchesDate;
        });

      console.log('✅ Processed:', processedData.length, 'records');

      setSensorData(processedData);
      setSensorMap(coordMap);

    } catch (err) {
      console.error('❌ Error:', err.message);
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

    const sensorsForTime = sensorData.filter(s => s.timeIndex === selectedTime);

    sensorsForTime.forEach(sensor => {
      const { temperature, xLoc, yLoc } = sensor;
      const temp = parseFloat(temperature);
      const x = parseFloat(xLoc);
      const y = parseFloat(yLoc);

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
    console.log(' Fetching for date:', selectedDate);
    fetchSensorData();
  }, [selectedDate]);

  useEffect(() => {
    drawGradient();
  }, [sensorData, imgSize, selectedTime]);

  return (
    <Box sx={{ marginTop: '150px', width: '90vw', margin: 'auto', position: 'relative' }}>
      <style>
        {`
          @keyframes blink-border {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
          }
        `}
      </style>
      
      <Box sx={{ position: 'relative', transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        <img
          ref={imgRef}
          src={MansionBaseImage}
          alt="Mansion One 2FM"
          onLoad={(e) => {
            setImgSize({ width: e.target.clientWidth, height: e.target.clientHeight });
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
            pointerEvents: 'none'
          }}
        />

        <img
          src={MansionOverlayImage}
          alt="Overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            pointerEvents: 'none'
          }}
        />

        {showSensorDots &&
          sensorData
            .filter(s => s.timeIndex === selectedTime)
            .map((sensor, i) => {
              const { xLoc, yLoc, temperature, humidity, equipment, location } = sensor;
              const x = parseFloat(xLoc);
              const y = parseFloat(yLoc);
              const temp = parseFloat(temperature);

              if (isNaN(x) || isNaN(y)) return null;

              const scaleX = imgSize.width / BASE_WIDTH;
              const scaleY = imgSize.height / BASE_HEIGHT;
              const dotX = x * scaleX;
              const dotY = y * scaleY;

              if (dotX < 0 || dotX > imgSize.width || dotY < 0 || dotY > imgSize.height) {
                return null;
              }

              const tooltipId = `mansion-sensor-${i}`;
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
                    top: `${dotY}px`,
                    left: `${dotX}px`,
                    width: 30,
                    height: 30,
                    transform: 'translate(-50%, -50%)',
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
  );
};

export default MansionOneHeatMap;