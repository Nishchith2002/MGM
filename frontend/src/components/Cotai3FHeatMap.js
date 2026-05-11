import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import { Box } from '@mui/material';
import { Tooltip as ReactTooltip } from 'react-tooltip';

import Cotai3FBase from '../assets/MGM COTAI 3F Mansion.jpg';
import Cotai3FOverlay from '../assets/MGM COTAI 3FM_top.png';

const BASE_WIDTH = 3990;
const BASE_HEIGHT = 2450;

const Cotai3FHeatMap = ({
  zoom,
  selectedDate,
  selectedTime,
  showSensorDots,
  setSelectedSensorData,
  setSensorMap,
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

  const fetchSensorData = async () => {
    const d = new Date(selectedDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dataPath = `/Data/Cotai3F/${yyyy}-${mm}-${dd}.csv`;
    const coordPath = `/Data/Cotai3F/3FCoordinates.csv`;

    try {
      const [csvRaw, coordRaw] = await Promise.all([
        fetch(dataPath).then(r => r.text()),
        fetch(coordPath).then(r => r.text()),
      ]);

      const csv = Papa.parse(csvRaw, { header: true, skipEmptyLines: true }).data;
      const coord = Papa.parse(coordRaw, { header: true, skipEmptyLines: true }).data;

      const sensorMap = {};
      coord.forEach(row => {
        const id = row.sensor?.trim() || row.equipment?.trim();
        const x = parseFloat(row.xLoc);
        const y = parseFloat(row.yLoc);
        if (id && !isNaN(x) && !isNaN(y)) {
          sensorMap[id] = { xLoc: x, yLoc: y, location: row.location || '' };
        }
      });

      const enriched = csv.map(row => {
        const id = row.equipment?.trim() || row.sensor?.trim();
        const meta = sensorMap[id] || {};
        const rawTime = row.timeStamp || row.timestamp || row.time || '';
        const dateObj = new Date(rawTime.replace('Hong_Kong', '').trim());
        const timeIndex = !isNaN(dateObj) ? dateObj.getHours() * 4 + Math.floor(dateObj.getMinutes() / 15) : 0;

        return {
          equipment: id,
          temperature: parseFloat((row.temperature || '').replace(/[^\d.-]/g, '')),
          humidity: parseFloat((row.humidity || '').replace(/[^\d.-]/g, '')),
          location: meta.location,
          xLoc: parseFloat(row.xLoc) || meta.xLoc,
          yLoc: parseFloat(row.yLoc) || meta.yLoc,
          timeIndex,
        };
      }).filter(d => !isNaN(d.xLoc) && !isNaN(d.yLoc));

      setSensorData(enriched);
      setSensorMap(sensorMap);
    } catch (err) {
      console.error('❌ Cotai 3F fetch error:', err);
    }
  };

 const drawGradient = () => {
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d');
  const img = imgRef.current;
  if (!canvas || !ctx || !img) return;

  const width = img.clientWidth;
  const height = img.clientHeight;
  canvas.width = width;
  canvas.height = height;

  // ✅ Step 1: Fill base background with soft green
  ctx.fillStyle = 'rgba(0, 255, 0, 0.08)';  // light transparent green
  ctx.fillRect(0, 0, width, height);

  // ✅ Step 2: Draw radial sensor glow
  sensorData
    .filter((s) => parseInt(s.timeIndex) === selectedTime)
    .forEach((sensor) => {
      const temp = sensor.temperature;
      const x = sensor.xLoc;
      const y = sensor.yLoc;
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


  useEffect(() => { fetchSensorData(); }, [selectedDate]);
  useEffect(() => { drawGradient(); }, [sensorData, imgSize, selectedTime]);

  return (
    <Box sx={{ width: '90vw', margin: 'auto', position: 'relative', marginTop: '150px' }}>
      <Box sx={{ position: 'relative', transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        <img
          ref={imgRef}
          src={Cotai3FBase}
          alt="Cotai 3F"
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
          src={Cotai3FOverlay}
          alt="3F Overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            pointerEvents: 'none',
          }}
        />
        {showSensorDots && sensorData
          .filter((s) => parseInt(s.timeIndex) === selectedTime)
          .map((sensor, i) => {
            const { xLoc, yLoc, temperature, humidity, equipment, location } = sensor;
            if (isNaN(xLoc) || isNaN(yLoc)) return null;

            const dotX = (xLoc / BASE_WIDTH) * imgSize.width;
            const dotY = (yLoc / BASE_HEIGHT) * imgSize.height;
            const tooltipId = `dot-${i}`;

            let borderColor = 'white', borderWidth = 1, isBlinking = false;
            if (!isNaN(temperature)) {
              if (temperature > 24) { borderColor = 'red'; borderWidth = 4; isBlinking = true; }
              else if (temperature < 21) { borderColor = 'blue'; borderWidth = 6; isBlinking = true; }
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
                  zIndex: 5,
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
                  {isNaN(temperature) ? 'NaN' : `${temperature.toFixed(1)}°C`}
                  <ReactTooltip id={tooltipId} place="top" style={{ zIndex: 9999 }}>
                    <div style={{ textAlign: 'left' }}>
                      <strong>Sensor:</strong> {equipment}<br />
                      <strong>Location:</strong> {location}<br />
                      <strong>Temp:</strong> {isNaN(temperature) ? 'NaN' : `${temperature.toFixed(1)}°C`}<br />
                      <strong>Humidity:</strong> {isNaN(humidity) ? 'NaN' : `${humidity.toFixed(1)}%`}
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

export default Cotai3FHeatMap;
