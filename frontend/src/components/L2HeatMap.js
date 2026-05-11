import React, { useEffect, useState, useRef } from 'react';
import { Box } from '@mui/material';
import Papa from 'papaparse';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import floorplanL2 from '../assets/floorplan2.jpg';
import floorplanOverlay from '../assets/floorplantop.png';
import TemperatureGraph from '../pages/TemperatureGraph';

const BASE_WIDTH = 3990;
const BASE_HEIGHT = 2450;

const convertIndexToTime = (index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  return { hour, minute };
};

const L2HeatMap = ({
  zoom,
  selectedDate,
  selectedTime,
  showSensorDots = true,
  setSelectedSensorData,
  setSensorMap, // 👈 ADD THIS PROP
}) => {

  const canvasRef = useRef();
  const imgRef = useRef();
  const [sensorMeta, setSensorMeta] = useState({});
  const [sensorData, setSensorData] = useState([]);
  const [originalSensorData, setOriginalSensorData] = useState([]);
  const [imgSize, setImgSize] = useState({ width: 1, height: 1 });
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

 const loadSensorMap = () => {
    const path = '/Data/L2/sensorMap.csv';
    Papa.parse(path, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const map = {};
        results.data.forEach((row) => {
          const id = row.sensor?.trim() || row.navName?.trim() || row.equipment?.trim();
          const x = parseFloat(row.xLoc || row.x);
          const y = parseFloat(row.yLoc || row.y);
          if (!id || isNaN(x) || isNaN(y)) return;
          map[id] = {
            xLoc: x,
            yLoc: y,
            location: row.location || '',
            remarks: row.remarks || '',
            status: row.status || 'Active',
          };
        });
        setSensorMeta(map);
        if (setSensorMap) setSensorMap(map); // ✅ Send to parent
      },
      error: (err) => {
        console.error('❌ Failed to load sensor map:', err);
        setSensorMeta({});
        if (setSensorMap) setSensorMap({});
      },
    });
  };

  const getCsvFileName = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `/Data/L2/${year}-${month}-${day}.csv`;
  };

 const loadSensorData = (dateParam = selectedDate, timeIndex = selectedTime) => {
    if (Object.keys(sensorMeta).length === 0) return;

    const file = getCsvFileName(dateParam);
    const date = new Date(dateParam);
    const selectedDateStr = date.toLocaleDateString('en-CA');

    Papa.parse(file, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data;
        const { hour, minute } = convertIndexToTime(timeIndex);
        const filtered = rawData.filter((row) => {
          const ts = row.timeStamp || row.timestamp || row.time || row.date;
          const parsed = new Date((ts || '').replace(' Hong_Kong', '').trim());
          return (
            !isNaN(parsed.getTime()) &&
            parsed.getHours() === hour &&
            parsed.getMinutes() === minute &&
            parsed.toLocaleDateString('en-CA') === selectedDateStr
          );
        });

        const enriched = filtered.map((row) => {
          const equip = row.equipment?.trim();
          const meta = sensorMeta[equip];
          const x = parseFloat(row.xLoc || meta?.xLoc);
          const y = parseFloat(row.yLoc || meta?.yLoc);
          const temp = parseFloat((row.temperature || '').replace('°C', ''));
          const humidity = parseFloat((row.humidity || '').replace('%RH', ''));
          return {
            ...row,
            navName: equip,
            xLoc: x,
            yLoc: y,
            temp,
            humidity,
            location: row.location || meta?.location || '',
            remarks: row.remarks || meta?.remarks || '',
            status: row.status || meta?.status || '',
          };
        }).filter(d => !isNaN(d.xLoc) && !isNaN(d.yLoc));

        setSensorData(enriched);
        setOriginalSensorData(enriched);
      },
    });
  };

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

  const drawGradient = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;

    if (!canvas || !canvas.getContext || !img) return;

    const ctx = canvas.getContext('2d');
    const width = img.clientWidth;
    const height = img.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sensorData.forEach((sensor) => {
      const temp = parseFloat(sensor.temp);
      if (isNaN(temp)) return;

      const x = (sensor.xLoc / BASE_WIDTH) * width;
      const y = (sensor.yLoc / BASE_HEIGHT) * height;

      let intenseColor = getDotColor(temp);

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 150);
      gradient.addColorStop(0, `${intenseColor}55`);
      gradient.addColorStop(0.5, `${intenseColor}22`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 50, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const drawSensorDots = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;

    if (!canvas || !canvas.getContext || !img || !showSensorDots) return;

    const ctx = canvas.getContext('2d');
    const width = img.clientWidth;
    const height = img.clientHeight;

    sensorData.forEach((sensor) => {
      const { xLoc, yLoc, temp } = sensor;
      if (!xLoc || !yLoc || isNaN(xLoc) || isNaN(yLoc)) return;

      const left = (xLoc / BASE_WIDTH) * width;
      const top = (yLoc / BASE_HEIGHT) * height;

      let borderColor = 'white';
      let borderWidth = 1;

      const t = parseFloat(temp);
      if (!isNaN(t)) {
        if (t > 24) {
          borderColor = 'red';
          borderWidth = 4;
        } else if (t < 21) {
          borderColor = 'blue';
          borderWidth = 6;
        }
      }

      ctx.beginPath();
      ctx.arc(left, top, 10, 0, 2 * Math.PI);
      ctx.fillStyle = borderColor;
      ctx.fill();
    });
  };

  const drawHeatmap = () => {
    drawGradient();
    if (showSensorDots) {
      drawSensorDots();
    }
  };

  const handleSensorClick = (sensor) => {
    console.log('L2 Sensor clicked:', sensor);
    const sensorWithDate = {
      ...sensor,
      selectedDate: selectedDate,
    };
    
    if (setSelectedSensorData) {
      setSelectedSensorData(sensorWithDate);
    } else {
      setSelectedSensor(sensorWithDate);
    }
    
    setTimeout(() => {
      drawHeatmap();
    }, 50);
  };

  const handleCloseGraph = () => {
    setSelectedSensor(null);
    setTimeout(() => {
      drawHeatmap();
    }, 50);
  };

  // Load sensor map on component mount
  useEffect(() => {
    loadSensorMap();
  }, []);

  // Load sensor data when map is ready or parameters change
  useEffect(() => {
    if (Object.keys(sensorMeta).length > 0 && selectedDate && selectedTime !== undefined) {
      loadSensorData(selectedDate, selectedTime);
    }
  }, [sensorMeta, selectedDate, selectedTime]);

  // Redraw heatmap when data or settings change
  useEffect(() => {
    drawHeatmap();
  }, [sensorData, imgSize, showSensorDots]);

  // Handle image resize
  useEffect(() => {
    if (imgRef.current && canvasRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (imgRef.current) {
          setImgSize({
            width: imgRef.current.clientWidth,
            height: imgRef.current.clientHeight,
          });
          
          if (canvasRef.current) {
            canvasRef.current.width = imgRef.current.clientWidth;
            canvasRef.current.height = imgRef.current.clientHeight;
          }
          
          drawHeatmap();
        }
      });
      
      resizeObserver.observe(imgRef.current);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [imgRef.current]);

  // Add blinking animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes blink-border {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.2;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(!!window.isFullscreen);

useEffect(() => {
  const syncFullscreen = () => {
    setIsFullscreen(!!window.isFullscreen);
  };

  document.addEventListener('fullscreenchange', syncFullscreen);
  return () => document.removeEventListener('fullscreenchange', syncFullscreen);
}, []);


  return (
    <>
     <Box
  sx={{
    position: 'relative',
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
    width: 'fit-content',
    marginTop: isFullscreen ? "170" : '170px', // ✅ FIXED
  }}
>


        {/* Loading indicator */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: 20,
              zIndex: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            Loading L2 data...
          </Box>
        )}

        {/* Base floorplan image */}
        <img
          ref={imgRef}
          src={floorplanL2}
          alt="L2 Base Plan"
          onLoad={(e) => {
            setImgSize({ 
              width: e.target.clientWidth, 
              height: e.target.clientHeight 
            });
            if (canvasRef.current) {
              canvasRef.current.width = e.target.clientWidth;
              canvasRef.current.height = e.target.clientHeight;
              drawHeatmap();
            }
          }}
          style={{
            maxWidth: '90%',
            height: 'auto',
            display: 'block',
            position: 'relative',
            zIndex: 0,
            //   backgroundColor: "white"
          }}
        />

        {/* Heatmap canvas overlay */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* 3D overlay image */}
        <img
          src={floorplanOverlay}
          alt="L2 Overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            maxWidth: '90%',
            height: 'auto',
            zIndex: 2,
            opacity: 1,
            pointerEvents: 'none',
          }}
        />

        {/* Interactive sensor dots */}
        {showSensorDots && sensorData.map((sensor, index) => {
          const { xLoc, yLoc, temp, humidity, navName, location } = sensor;
          if (!xLoc || !yLoc || isNaN(xLoc) || isNaN(yLoc)) return null;

          const top = (yLoc / BASE_HEIGHT) * imgSize.height;
          const left = (xLoc / BASE_WIDTH) * imgSize.width;
          const tooltipId = `l2-sensor-${index}`;

          let borderColor = 'white';
          let borderWidth = 1;
          let isBlinking = false;

          const t = parseFloat(temp);
          if (!isNaN(t)) {
            if (t > 24) {
              borderColor = 'red';
              borderWidth = 4;
              isBlinking = true;
            } else if (t < 21) {
              borderColor = 'blue';
              borderWidth = 6;
              isBlinking = true;
            }
          }

          return (
            <div
              key={tooltipId}
              onClick={() => handleSensorClick(sensor)}
              style={{
                position: 'absolute',
                top,
                left,
                width: 30,
                height: 30,
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
            >
              {/* Blinking border */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: `${borderWidth}px solid ${borderColor}`,
                  animation: isBlinking ? 'blink-border 1s infinite' : 'none',
                  boxSizing: 'border-box',
                }}
              />
              {/* Sensor dot */}
              <div
                data-tooltip-id={tooltipId}
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  width: '26px',
                  height: '26px',
                  backgroundColor: 'black',
                  borderRadius: '50%',
                  color: 'white',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 4,
                }}
              >
                {isNaN(temp) || temp === null ? 'NaN' : `${parseFloat(temp).toFixed(1)}°C`}
                <ReactTooltip
                  id={tooltipId}
                  place="top"
                  style={{ zIndex: 9999 }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <strong>Sensor:</strong> {navName || 'Unknown'}
                    <br />
                    <strong>Location:</strong> {location || 'Unknown'}
                    <br />
                    <strong>Temp:</strong>{' '}
                    {isNaN(temp) || temp === null ? 'NaN' : `${parseFloat(temp).toFixed(1)}°C`}
                    <br />
                    <strong>Hum:</strong>{' '}
                    {isNaN(humidity) || humidity === null ? 'NaN' : `${humidity}%`}
                  </div>
                </ReactTooltip>
              </div>
            </div>
          );
        })}

        {/* Debug info */}
        {sensorData.length === 0 && !isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 60,
              left: 20,
              zIndex: 10,
              backgroundColor: 'rgba(255, 255, 0, 0.9)',
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: 'bold',
              maxWidth: '300px',
            }}
          >
         
          </Box>
        )}
      </Box>

      {/* Temperature Graph Modal - only show if using local state */}
      {selectedSensor && !setSelectedSensorData && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
          }}
        >
          <Box 
            onClick={(e) => e.stopPropagation()}
            sx={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              width: '80%',
              maxWidth: '1000px'
            }}
          >
            <TemperatureGraph
              selectedSensorData={selectedSensor}
              onClose={handleCloseGraph}
              selectedDate={selectedDate}
            />
          </Box>
        </Box>
      )}
    </>
  );
};

export default L2HeatMap;