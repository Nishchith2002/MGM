  import React, { useEffect, useRef, useState } from 'react';
  import Papa from 'papaparse';
  import { Box } from '@mui/material';
  import { Tooltip as ReactTooltip } from 'react-tooltip';
  import baseImage from '../assets/MGM Macau Grand Praca_Base.png';
  import topOverlay from '../assets/MGM Macau Grand Praca_Top.png';
  import TemperatureGraph from '../pages/TemperatureGraph';

  const BASE_WIDTH = 2599;
  const BASE_HEIGHT = 1619;

  const convertIndexToTime = (index) => {
    const hour = Math.floor(index / 4);
    const minute = (index % 4) * 15;
    return { hour, minute };
  };

  const GrandePracaHeatMap = ({ 
    zoom, 
    selectedDate, 
    selectedTime, 
    showSensorDots = true, 
    onSensorClick,
    setSelectedSensorData 
  }) => {
    const imgRef = useRef();
    const canvasRef = useRef();
    const [imgSize, setImgSize] = useState({ width: 1, height: 1 });
    const [sensorCoords, setSensorCoords] = useState({});
    const [sensorData, setSensorData] = useState([]);
    const [originalSensorData, setOriginalSensorData] = useState([]);
    const [selectedSensor, setSelectedSensor] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(!!window.isFullscreen);

    // Load coordinates from CSV file with fallback paths
    const loadSensorMap = () => {
      console.log('🔄 Loading Grande Praca sensor map...');
      
      const possiblePaths = [
        '/Data/GrandePraca/sensorMap.csv',
        '/Data/GrandePraca/Grande Praca heatmap.csv',
        '/Data/GrandePraca/heatmap.csv'
      ];

      const tryLoadPath = (pathIndex = 0) => {
        if (pathIndex >= possiblePaths.length) {
          console.error('❌ Failed to load Grande Praca sensor map from all attempted paths');
          setSensorCoords({});
          return;
        }

        const currentPath = possiblePaths[pathIndex];
        console.log(`📁 Attempting to load Grande Praca sensor map from: ${currentPath}`);

        Papa.parse(currentPath, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log(`📊 Raw Grande Praca sensor map data:`, results.data);
            
            if (results.errors.length > 0) {
              console.warn('⚠️ Parse errors:', results.errors);
            }

            const map = {};
            let validCount = 0;

            results.data.forEach((row, index) => {
              // Try different possible column names
              const id = row.sensor?.trim() || row.navName?.trim() || row.equipment?.trim() || row.id?.trim();
              const x = parseFloat(row.xLoc || row.x || row.X);
              const y = parseFloat(row.yLoc || row.y || row.Y);

              console.log(`Row ${index}:`, { id, x, y, row });

              if (!id) {
                console.warn(`⚠️ Row ${index} missing sensor ID:`, row);
                return;
              }

              if (isNaN(x) || isNaN(y)) {
                console.warn(`⚠️ Row ${index} invalid coordinates for sensor ${id}:`, { x, y });
                return;
              }

              map[id] = {
                xLoc: x,
                yLoc: y,
                location: row.location || row.Location || 'Unknown',
                remarks: row.remarks || row.Remarks || '',
                status: row.status || row.Status || 'Active',
              };
              validCount++;
            });

            console.log(`✅ Loaded ${validCount} valid Grande Praca sensors from ${currentPath}`);
            
            if (validCount === 0) {
              console.warn(`⚠️ No valid sensors found in ${currentPath}, trying next path...`);
              tryLoadPath(pathIndex + 1);
            } else {
              setSensorCoords(map);
              console.log('📍 Grande Praca Sensor map loaded successfully:', Object.keys(map));
            }
          },
          error: (err) => {
            console.error(`❌ Error loading ${currentPath}:`, err);
            console.log(`🔄 Trying next path...`);
            tryLoadPath(pathIndex + 1);
          },
        });
      };

      tryLoadPath(0);
    };

    const getCsvFileName = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `/Data/GrandePraca/${year}-${month}-${day}.csv`;
    };

    const loadSensorData = (dateParam = selectedDate, timeIndex = selectedTime) => {
      if (Object.keys(sensorCoords).length === 0) {
        console.log('⏳ Sensor map not loaded yet, skipping data load');
        return;
      }

      setIsLoading(true);
      const date = new Date(dateParam);
      const file = getCsvFileName(date);
      const selectedDateStr = date.toLocaleDateString('en-CA');

      console.log("🔄 Loading Grande Praca sensor data from:", file);
      console.log("📅 Target date:", selectedDateStr, "Time index:", timeIndex);

      Papa.parse(file, {
        download: true,
        header: true,
        encoding: 'latin1',
        skipEmptyLines: true,
        complete: (results) => {
          setIsLoading(false);
          console.log(`📊 Raw Grande Praca CSV data loaded: ${results.data.length} rows`);
          
          if (results.errors.length > 0) {
            console.warn('⚠️ CSV Parse errors:', results.errors);
          }

          if (results.data.length === 0) {
            console.warn('❌ No data found in CSV file');
            setSensorData([]);
            setOriginalSensorData([]);
            return;
          }

          console.log('📋 First 3 rows of data:', results.data.slice(0, 3));

          const rawData = results.data;
          const { hour, minute } = convertIndexToTime(timeIndex);
          
          console.log(`🎯 Looking for data at ${hour}:${String(minute).padStart(2, '0')}`);

          // Filter data by selected date and time
          const filteredData = rawData.filter((row, index) => {
            const timestampStr = row.timeStamp || row.timestamp || row.date || row.time || row.Time;
            
            if (!timestampStr) {
              if (index < 5) console.log(`Row ${index} missing timestamp:`, row);
              return false;
            }

            const cleanedTimestamp = timestampStr.replace(' Hong_Kong', '').trim();
            const rowDate = new Date(cleanedTimestamp);

            if (isNaN(rowDate.getTime())) {
              if (index < 5) console.log(`Row ${index} invalid timestamp:`, timestampStr);
              return false;
            }

            const matchesDate = rowDate.toLocaleDateString('en-CA') === selectedDateStr;
            const matchesTime = rowDate.getHours() === hour && rowDate.getMinutes() === minute;
            
            if (index < 5) {
              console.log(`Row ${index}:`, {
                timestamp: timestampStr,
                rowDate: rowDate.toISOString(),
                matchesDate,
                matchesTime,
                equipment: row.equipment || row.navName || row.sensor
              });
            }

            return matchesDate && matchesTime;
          });

          console.log(`🔍 Filtered to ${filteredData.length} rows for target time`);

          // If no exact time match, try to find any data for the selected date
          if (filteredData.length === 0) {
            console.warn('⚠️ No exact time match, looking for any data on selected date...');
            
            const dateOnlyFiltered = rawData.filter((row) => {
              const timestampStr = row.timeStamp || row.timestamp || row.date || row.time || row.Time;
              if (!timestampStr) return false;
              
              const cleanedTimestamp = timestampStr.replace(' Hong_Kong', '').trim();
              const rowDate = new Date(cleanedTimestamp);
              
              return !isNaN(rowDate.getTime()) && 
                    rowDate.toLocaleDateString('en-CA') === selectedDateStr;
            });

            console.log(`📊 Found ${dateOnlyFiltered.length} rows for selected date`);
            
            if (dateOnlyFiltered.length > 0) {
              console.log('📝 Using latest available data for the date');
              const latest = {};
              dateOnlyFiltered.forEach((row) => {
                const equip = (row.equipment || row.navName || row.sensor)?.trim();
                const timestamp = row.timeStamp || row.timestamp || row.date || row.time || row.Time || '';
                const parsed = new Date(timestamp.replace(' Hong_Kong', '').trim());
                
                if (!equip || isNaN(parsed.getTime())) return;
                
                if (!latest[equip] || parsed > new Date((latest[equip].timestamp || '').replace(' Hong_Kong', '').trim())) {
                  latest[equip] = { ...row, timestamp };
                }
              });
              
              filteredData.push(...Object.values(latest));
            }
          }

          if (filteredData.length === 0) {
            console.warn('❌ No valid Grande Praca sensor data found for any time on:', selectedDateStr);
            setSensorData([]);
            setOriginalSensorData([]);
            return;
          }

          // Process filtered data
          console.log('🔄 Processing filtered data...');
          const latest = {};

          filteredData.forEach((row) => {
            const equip = (row.equipment || row.navName || row.sensor)?.trim();
            const timestamp = row.timeStamp || row.timestamp || row.date || row.time || row.Time || '';
            const parsed = new Date(timestamp.replace(' Hong_Kong', '').trim());

            if (!equip) {
              console.log('⚠️ Row missing equipment name:', row);
              return;
            }
            
            if (isNaN(parsed.getTime())) {
              console.log('⚠️ Row invalid timestamp:', timestamp);
              return;
            }

            // Enrich with metadata from sensor map
            const meta = sensorCoords[equip];
            if (meta) {
              row.xLoc = row.xLoc || meta.xLoc;
              row.yLoc = row.yLoc || meta.yLoc;
              row.location = row.location || meta.location;
              row.remarks = row.remarks || meta.remarks;
              row.status = row.status || meta.status;
            } else {
              console.log(`⚠️ No metadata found for sensor: ${equip}`);
            }

            if (!latest[equip] || parsed > new Date((latest[equip].timestamp || '').replace(' Hong_Kong', '').trim())) {
              latest[equip] = { ...row, timestamp };
            }
          });

          const enriched = Object.values(latest)
            .filter((sensor) => {
              const hasEquipment = sensor.equipment || sensor.navName || sensor.sensor;
              const hasCoords = !isNaN(parseFloat(sensor.xLoc)) && !isNaN(parseFloat(sensor.yLoc));
              
              if (!hasEquipment) console.log('⚠️ Sensor missing equipment name:', sensor);
              if (!hasCoords) console.log('⚠️ Sensor missing coordinates:', sensor.equipment || sensor.navName || sensor.sensor, sensor.xLoc, sensor.yLoc);
              
              return hasEquipment && hasCoords;
            })
            .map((sensor) => {
              const temp = parseFloat((sensor.temperature || sensor.temp || '').toString().replace('°C', ''));
              const humidity = parseFloat((sensor.humidity || '').toString().replace('%RH', ''));
              const xLoc = parseFloat(sensor.xLoc);
              const yLoc = parseFloat(sensor.yLoc);

              return {
                ...sensor,
                navName: (sensor.equipment || sensor.navName || sensor.sensor)?.trim(),
                temp: isNaN(temp) ? null : temp,
                humidity: isNaN(humidity) ? null : humidity,
                xLoc: isNaN(xLoc) ? null : xLoc,
                yLoc: isNaN(yLoc) ? null : yLoc,
              };
            });

          console.log(`✅ Final enriched Grande Praca data: ${enriched.length} sensors`);
          console.log('📋 Sample enriched data:', enriched.slice(0, 3));

          if (enriched.length === 0) {
            console.warn('❌ No valid Grande Praca sensor data after enrichment');
            setSensorData([]);
            setOriginalSensorData([]);
          } else {
            setSensorData(enriched);
            setOriginalSensorData(enriched);
            console.log(`✅ Successfully loaded ${enriched.length} Grande Praca sensors with data`);
          }
        },
        error: (err) => {
          setIsLoading(false);
          console.error('❌ Grande Praca CSV Load Error:', err);
          setSensorData([]);
          setOriginalSensorData([]);
        },
      });
    };

    const getDotColor = (temp) => {
      const t = parseFloat(temp);
      if (isNaN(t)) return '#808080';
      if (t >= 27.5) return '#ff3b04';
      if (t >= 26.5) return '#ff7204';
      if (t >= 24.5) return '#ffff00';
      if (t >= 21.5) return '#98ff54';
      if (t >= 18.5) return '#6ea9b7';
      return '#3333ff';
    };

  const drawHeatmap = () => {
  const canvas = canvasRef.current;
  const img = imgRef.current;
  if (!canvas || !canvas.getContext || !img) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw a translucent base color fill using average temperature
  const validTemps = sensorData.map(s => parseFloat(s.temp)).filter(t => !isNaN(t));
  const avgTemp = validTemps.length ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length : null;
  if (avgTemp !== null) {
    const baseColor = getDotColor(avgTemp);
    ctx.fillStyle = `${baseColor}22`; // very light translucent fill
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw larger, denser radial gradients to ensure full coverage
  sensorData.forEach((sensor) => {
    const temp = parseFloat(sensor.temp || sensor.temperature);
    const xLoc = parseFloat(sensor.xLoc);
    const yLoc = parseFloat(sensor.yLoc);
    if (isNaN(temp) || isNaN(xLoc) || isNaN(yLoc)) return;

    const x = (xLoc / BASE_WIDTH) * imgSize.width;
    const y = (yLoc / BASE_HEIGHT) * imgSize.height;
    const color = getDotColor(temp);

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 350); // increase radius
    gradient.addColorStop(0, `${color}80`);   // center: more opaque
    gradient.addColorStop(0.3, `${color}50`);
    gradient.addColorStop(0.6, `${color}30`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 200, 0, 2 * Math.PI); // larger blob size
    ctx.fill();
  });
};


    const handleSensorClick = (sensor) => {
      console.log('Grande Praca Sensor clicked:', sensor);
      const sensorWithDate = {
        ...sensor,
        selectedDate: selectedDate,
      };
      
      if (setSelectedSensorData) {
        setSelectedSensorData(sensorWithDate);
      } else if (onSensorClick) {
        onSensorClick(sensorWithDate);
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
      if (Object.keys(sensorCoords).length > 0 && selectedDate && selectedTime !== undefined) {
        loadSensorData(selectedDate, selectedTime);
      }
    }, [sensorCoords, selectedDate, selectedTime]);

    useEffect(() => {
      if (imgRef.current && canvasRef.current) {
        const observer = new ResizeObserver(() => {
          const width = imgRef.current.clientWidth;
          const height = imgRef.current.clientHeight;
          setImgSize({ width, height });
          canvasRef.current.width = width;
          canvasRef.current.height = height;
          drawHeatmap();
        });
        observer.observe(imgRef.current);
        return () => observer.disconnect();
      }
    }, []);

    useEffect(() => {
      drawHeatmap();
    }, [sensorData, sensorCoords]);

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

    // Track fullscreen state
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
            marginTop: isFullscreen ? '150px' : '150px',
            marginLeft: '30px',
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
              Loading Grande Praca data...
            </Box>
          )}

          {/* Base image */}
          <img
            ref={imgRef}
            src={baseImage}
            alt="Grande Praca Base"
            onLoad={(e) => {
              const width = e.target.clientWidth;
              const height = e.target.clientHeight;
              setImgSize({ width, height });
              canvasRef.current.width = width;
              canvasRef.current.height = height;
              drawHeatmap();
            }}
            style={{ maxWidth: '90%', display: 'block' }}
          />

          {/* Heatmap canvas */}
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
          />

          {/* Top overlay */}
          <img
            src={topOverlay}
            alt="Grande Praca Overlay"
            style={{
              maxWidth: '90%',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 2,
              opacity: 0.8,
            }}
          />

          {/* Interactive sensor dots with tooltips and alerts */}
          {showSensorDots &&
            sensorData.map((sensor, index) => {
              const temp = parseFloat(sensor.temp || sensor.temperature);
              const humidity = parseFloat(sensor.humidity);
              const id = sensor.navName || sensor.equipment || sensor.sensor;
              const location = sensor.location || 'Unknown';
              const x = (parseFloat(sensor.xLoc) / BASE_WIDTH) * imgSize.width;
              const y = (parseFloat(sensor.yLoc) / BASE_HEIGHT) * imgSize.height;
              const tooltipId = `grande-praca-sensor-${index}`;

              if (isNaN(x) || isNaN(y)) return null;

              // Alert system
              let borderColor = 'white';
              let borderWidth = 2;
              let isBlinking = false;

              if (!isNaN(temp)) {
                if (temp > 27) {
                  borderColor = 'red';
                  borderWidth = 4;
                  isBlinking = true;
                } else if (temp < 21) {
                  borderColor = 'blue';
                  borderWidth = 4;
                  isBlinking = true;
                }
              }

              return (
                <div
                  key={tooltipId}
                  onClick={() => handleSensorClick(sensor)}
                  style={{
                    position: 'absolute',
                    top: y,
                    left: x,
                    width: 30,
                    height: 30,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 5,
                    cursor: 'pointer',
                  }}
                >
                  {/* Blinking border for alerts */}
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
                  <Box
                    data-tooltip-id={tooltipId}
                    sx={{
                      position: 'absolute',
                      top: '2px',
                      left: '2px',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#000',
                      color: '#fff',
                      fontSize: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      zIndex: 4,
                    }}
                  >
                    {isNaN(temp) ? 'N/A' : `${temp.toFixed(1)}°`}
                    
                    {/* Enhanced Tooltip */}
                    <ReactTooltip
                      id={tooltipId}
                      place="top"
                      style={{ zIndex: 9999 }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <strong>Sensor:</strong> {id || 'Unknown'}
                        <br />
                        <strong>Location:</strong> {location}
                        <br />
                        <strong>Temperature:</strong>{' '}
                        {isNaN(temp) ? 'N/A' : `${temp.toFixed(1)}°C`}
                        <br />
                        <strong>Humidity:</strong>{' '}
                        {isNaN(humidity) ? 'N/A' : `${humidity.toFixed(1)}%`}
                        <br />
                        <strong>Status:</strong> {sensor.status || 'Active'}
                        {sensor.remarks && (
                          <>
                            <br />
                            <strong>Remarks:</strong> {sensor.remarks}
                          </>
                        )}
                      </div>
                    </ReactTooltip>
                  </Box>
                </div>
              );
            })}

          {/* No data indicator */}
          {/* {sensorData.length === 0 && !isLoading && (
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
              No sensor data available for the selected date and time
            </Box>
          )} */}
        </Box>

        {/* Temperature Graph Modal */}
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
  floor="GrandePraca"
/>
            </Box>
          </Box>
        )}
      </>
    );
  };

  export default GrandePracaHeatMap;