
import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import { Box } from '@mui/material';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import BaseImage from '../assets/MGM COTAI 2F & 2FM.jpg';
import OverlayImage from '../assets/MGM COTAI 2F & 2FM_top.png';

const BASE_WIDTH = 4000;
const BASE_HEIGHT = 2450;

const Cotai2F2FMHeatMap = ({
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


// const fetchSensorData = async () => {
//   const d = new Date(selectedDate);
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, '0');
//   const dd = String(d.getDate()).padStart(2, '0');

//   const file1 = `/Data/Cotai2F2FM/${yyyy}-${mm}-${dd}_1.csv`;
//   const file2 = `/Data/Cotai2F2FM/${yyyy}-${mm}-${dd}_2.csv`;
//   const file3 = `/Data/Cotai2F2FM/${yyyy}-${mm}-${dd}_3.csv`;
//   const coordFile = `/Data/Cotai2F2FM/merged_sensor_coordinates.csv`;

//   try {
//     const [res1, res2, res3, coordRes] = await Promise.all([
//       fetch(file1).then(r => r.text()),
//       fetch(file2).then(r => r.text()),
//       fetch(file3).then(r => r.text()),
//       fetch(coordFile).then(r => r.text())
//     ]);

//     const parsed1 = Papa.parse(res1, { header: true, skipEmptyLines: true }).data;
//     const parsed2 = Papa.parse(res2, { header: true, skipEmptyLines: true }).data;
//     const parsed3 = Papa.parse(res3, { header: true, skipEmptyLines: true }).data;
//     const coordData = Papa.parse(coordRes, { header: true, skipEmptyLines: true }).data;

//     const sensorMap = {};
//     coordData.forEach(row => {
//       const id = row.sensor?.trim();
//       const x = parseFloat(row.xLoc);
//       const y = parseFloat(row.yLoc);
//       if (id && !isNaN(x) && !isNaN(y)) {
//         sensorMap[id] = { xLoc: x, yLoc: y, location: row.location || '' };
//       }
//     });

//     const allRows = [...parsed1, ...parsed2, ...parsed3];

//     const mergedData = allRows.map(row => {
//       const id = row.equipment?.trim();
//       const meta = sensorMap[id] || {};

//       let timeIndex = 0;
//       const rawTime = row.timeStamp || row.timestamp || row.TimeStamp || row.time;
//       if (rawTime) {
//         const dateObj = new Date(rawTime.replace('Hong_Kong', '').trim());
//         if (!isNaN(dateObj)) {
//           const hours = dateObj.getHours();
//           const minutes = dateObj.getMinutes();
//           timeIndex = hours * 4 + Math.floor(minutes / 15);
//         }
//       }

//       return {
//         ...row,
//         equipment: id,
//         xLoc: meta.xLoc,
//         yLoc: meta.yLoc,
//         location: meta.location || '',
//         temperature: parseFloat((row.temperature || '').replace(/[^\d.-]/g, '')),
//         humidity: parseFloat((row.humidity || '').replace(/[^\d.-]/g, '')),
//         timeIndex
//       };
//     });

//     const validData = mergedData.filter(d => !isNaN(d.xLoc) && !isNaN(d.yLoc));

//     // 🔍 DEBUG LOGS
//     console.log('✅ SENSOR DATA DEBUG');
//     console.log('Selected Date:', selectedDate);
//     console.log('Selected Time Index:', selectedTime);
//     console.log('Total parsed rows:', mergedData.length);
//     console.log('Valid rows with coordinates:', validData.length);
//     console.log(
//       'Sensors for current time index:',
//       validData.filter(s => s.timeIndex === selectedTime)
//     );

//     setSensorData(validData);
//     setSensorMap(sensorMap);
//   } catch (err) {
//     console.error('❌ Failed to load or parse files:', err);
//   }
// };


const fetchSensorData = async () => {
  const d = new Date(selectedDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  const file1 = `/Data/Cotai2F2FM/${yyyy}-${mm}-${dd}_1.csv`;
  const file2 = `/Data/Cotai2F2FM/${yyyy}-${mm}-${dd}_2.csv`;
  const file3 = `/Data/Cotai2F2FM/${yyyy}-${mm}-${dd}_3.csv`;
  const coordFile = `/Data/Cotai2F2FM/merged_sensor_coordinates.csv`;

  try {
    const [res1, res2, res3, coordRes] = await Promise.all([
      fetch(file1).then(r => r.text()),
      fetch(file2).then(r => r.text()),
      fetch(file3).then(r => r.text()),
      fetch(coordFile).then(r => r.text())
    ]);

    const parsed1 = Papa.parse(res1, { header: true, skipEmptyLines: true }).data;
    const parsed2 = Papa.parse(res2, { header: true, skipEmptyLines: true }).data;
    const parsed3 = Papa.parse(res3, { header: true, skipEmptyLines: true }).data;
    const coordData = Papa.parse(coordRes, { header: true, skipEmptyLines: true }).data;

    const sensorMap = {};
    coordData.forEach(row => {
      const id = row.sensor?.trim();
      const x = parseFloat(row.xLoc);
      const y = parseFloat(row.yLoc);
      if (id && !isNaN(x) && !isNaN(y)) {
        sensorMap[id] = { xLoc: x, yLoc: y, location: row.location || '' };
      }
    });

    const allRows = [...parsed1, ...parsed2, ...parsed3];

    const mergedData = allRows.map(row => {
      const id = row.equipment?.trim();
      const meta = sensorMap[id] || {};

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
        xLoc: meta.xLoc,
        yLoc: meta.yLoc,
        location: meta.location || '',
        temperature: parseFloat((row.temperature || '').replace(/[^\d.-]/g, '')),
        humidity: parseFloat((row.humidity || '').replace(/[^\d.-]/g, '')),
        timeIndex
      };
    });

    const validData = mergedData.filter(d => !isNaN(d.xLoc) && !isNaN(d.yLoc));

    console.log('==== DEBUG LOG ====');
    console.log('Total merged rows:', mergedData.length);
    console.log('Valid rows with coordinates:', validData.length);
    console.log('Time Index selected:', selectedTime);
    console.log(
      'Matching sensors for time:',
      validData.filter(s => s.timeIndex === selectedTime).length
    );

    setSensorData(validData);
    setSensorMap(sensorMap);
  } catch (err) {
    console.error('❌ Failed to load sensor data or coordinates:', err);
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

    sensorData
      .filter(s => parseInt(s.timeIndex) === selectedTime)
      .forEach(sensor => {
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
    <Box sx={{ marginTop: '150px', width: '90vw', margin: 'auto', position: 'relative' }}>
      <Box sx={{ position: 'relative', transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        <img
          ref={imgRef}
          src={BaseImage}
          alt="Cotai 2F & 2FM"
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
          src={OverlayImage}
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
            .filter(s => parseInt(s.timeIndex) === selectedTime)
            .map((sensor, i) => {
              const x = parseFloat(sensor.xLoc);
              const y = parseFloat(sensor.yLoc);
              const temp = parseFloat(sensor.temperature);
              const humidity = parseFloat(sensor.humidity);
              const equipment = sensor.equipment;
              const location = sensor.location;

              if (isNaN(x) || isNaN(y)) return null;

const scaleX = imgSize.width / BASE_WIDTH;
const scaleY = imgSize.height / BASE_HEIGHT;
const dotX = x * scaleX;
const dotY = y * scaleY;

// ✅ FIX: Don’t draw if dot is outside the image
if (
  dotX < 0 || dotX > imgSize.width ||
  dotY < 0 || dotY > imgSize.height
) return null;

              
              const tooltipId = `sensor-dot-${i}`;

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

export default Cotai2F2FMHeatMap;



