




import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  Box,
  Slider,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import CachedIcon from '@mui/icons-material/Cached';
import floorplan from '../assets/MGM COTAI GMF & 1F.jpg';
import overlayImg from '../assets/MGM COTAI 1F & GFM_top.png';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TextField from '@mui/material/TextField';
import GFBase from "../assets/MGM COTAI GF_v2.jpg"
import GFTop from "../assets/MGM COTAI GF_top.png"
import { Tooltip as ReactTooltip } from 'react-tooltip';
import TemperatureGraph from './TemperatureGraph';
import CotaiGFM1FHeatMap from '../components/CotaiGFM1FHeatMap';
import Cotai2F2FMHeatMap from '../components/Cotai2F2FMHeatMap';
import Cotai3FHeatMap from '../components/Cotai3FHeatMap';
import MansionOneHeatMap from '../components/MansionOneHeatMap';

const BASE_WIDTH = 3990;
const BASE_HEIGHT = 2450;

const timeMarks = [
  { value: 0, label: '00:00' },
  { value: 24, label: '06:00' },
  { value: 48, label: '12:00' },
  { value: 72, label: '18:00' },
  { value: 95, label: '23:45' },
];

const CotaiHeatMap = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [sensorData, setSensorData] = useState([]);
  const [allSensorData, setAllSensorData] = useState([]);
  const [selectedTime, setSelectedTime] = useState(0);
  const [showSensorDots, setShowSensorDots] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [availableAreas, setAvailableAreas] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [showAreaControls, setShowAreaControls] = useState(true);
  const [floor, setFloor] = useState("Summary");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sensorMap, setSensorMap] = useState({});
  const [areaImages, setAreaImages] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [activeLegend, setActiveLegend] = useState('all');
  const [imgSize, setImgSize] = useState({ width: 1, height: 1 });
  const [selectedSensorData, setSelectedSensorData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [clickedSensor, setClickedSensor] = useState(null);
  const [mansionOneMode, setMansionOneMode] = useState(false);


  const blinkingStyles = `
    @keyframes blink-border {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.3; }
    }
  `;

  const convertIndexToTime = (index) => {
    const hour = Math.floor(index / 4);
    const minute = (index % 4) * 15;
    return { hour, minute };
  };

  const formatTimeDisplay = (index) => {
    const { hour, minute } = convertIndexToTime(index);
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const parseDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    let cleanString = dateTimeString.replace(/\s*Hong_Kong\s*$/, '').trim();
    let parsedDate = null;
    
    parsedDate = new Date(cleanString);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
    
    const dateTimeMatch = cleanString.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (dateTimeMatch) {
      const [, year, month, day, hour, minute, second] = dateTimeMatch;
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/,
      /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
    ];
    
    for (const format of formats) {
      const match = cleanString.match(format);
      if (match) {
        if (format === formats[0]) {
          const [, month, day, year, hour, minute, second] = match;
          parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
        } else {
          const [, year, month, day, hour, minute, second] = match;
          parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
        }
        
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
    
    console.warn('Could not parse date string:', dateTimeString);
    return null;
  };

  const filterSensorData = () => {
    const { hour, minute } = convertIndexToTime(selectedTime);
    const selectedDateStr = selectedDate.toLocaleDateString('en-CA');
    
    console.log(`\n=== FILTERING SENSOR DATA ===`);
    console.log(`Selected Date: ${selectedDateStr}`);
    console.log(`Selected Time: ${hour}:${minute} (slider index: ${selectedTime})`);
    console.log(`Total sensor data records: ${allSensorData.length}`);
    
    if (allSensorData.length === 0) {
      console.log('No sensor data to filter');
      setSensorData([]);
      return;
    }

    console.log('\nSample timestamps from data:');
    allSensorData.slice(0, 5).forEach((d, i) => {
      console.log(`${i + 1}. Raw: "${d.timeStamp}" | Parsed: ${parseDateTime(d.timeStamp)}`);
    });

    const filtered = allSensorData.filter((d, index) => {
      const parsedDate = parseDateTime(d.timeStamp);
      
      if (!parsedDate) {
        if (index < 3) console.log(`Skipping record ${index}: Invalid timestamp "${d.timeStamp}"`);
        return false;
      }

      const recordDateStr = parsedDate.toLocaleDateString('en-CA');
      const recordHour = parsedDate.getHours();
      const recordMinute = parsedDate.getMinutes();
      
      const matches = (
        recordDateStr === selectedDateStr &&
        recordHour === hour &&
        recordMinute === minute
      );

      if (index < 3 || matches) {
        console.log(`Record ${index}: ${recordDateStr} ${recordHour}:${recordMinute} | Match: ${matches}`);
      }

      return matches;
    });

    console.log(`\nFiltered results: ${filtered.length} records found`);
    setSensorData(filtered);
    const uniqueAreas = [...new Set(filtered.map((d) => d.remarks || '').filter(Boolean))];
    setAvailableAreas(uniqueAreas);
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
    
    if (!canvas || !canvas.getContext || !img) {
      console.log('Canvas or image not ready for gradient');
      return;
    }

    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.log('Image has no dimensions yet, retrying...');
      setTimeout(() => drawGradient(), 100);
      return;
    }

    const ctx = canvas.getContext('2d');
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    const scaleX = displayWidth / BASE_WIDTH;
    const scaleY = displayHeight / BASE_HEIGHT;

    console.log(`Drawing gradient: ${displayWidth}x${displayHeight}, scale: ${scaleX}x${scaleY}`);

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    if (sensorData.length === 0) {
      console.log('No sensor data available for gradient');
      return;
    }

    sensorData.forEach((sensor, idx) => {
      const temp = parseFloat(sensor.temperature);
      const xRaw = parseFloat(sensor.xLoc);
      const yRaw = parseFloat(sensor.yLoc);
      
      if (isNaN(temp) || isNaN(xRaw) || isNaN(yRaw)) return;

      const x = xRaw * scaleX;
      const y = yRaw * scaleY;

      const intenseColor = getDotColor(temp);
      const radius = 150;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `${intenseColor}55`);
      gradient.addColorStop(0.5, `${intenseColor}22`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });

    console.log('✅ Gradient drawn successfully');
  };

  useEffect(() => {
    if (!showSensorDots && sensorData.length > 0) {
      drawGradient();
    }
  }, [showSensorDots]);

  useEffect(() => {
    if (typeof window.toggleLayoutFullscreen === 'function') {
      window.toggleLayoutFullscreen(isFullscreen);
    }
  }, [isFullscreen]);

  const handleImageLoad = (e) => {
    const displayWidth = e.target.clientWidth;
    const displayHeight = e.target.clientHeight;
    
    console.log(`Image loaded: ${displayWidth}x${displayHeight}`);
    
    setImgSize({
      width: displayWidth,
      height: displayHeight,
    });
    
    setTimeout(() => drawGradient(), 100);
    setTimeout(() => drawGradient(), 300);
  };

  const fetchSensorData = async () => {
    console.log('\n=== FETCHING SENSOR DATA ===');
    console.log('Selected date:', selectedDate);
    
    setDataLoading(true);
    
    const date = new Date(selectedDate);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    const basePath = `/Data/Cotai/${yyyy}-${mm}-${dd}`;
    const file1 = `${basePath}_1.csv`;
    const file2 = `${basePath}_2.csv`;
    const coordFile = `/Data/Cotai/GFCoordinates.csv`;

    console.log('Loading files:', { file1, file2, coordFile });

    try {
      const [file1Response, file2Response, coordResponse] = await Promise.all([
        fetch(file1).catch((err) => {
          console.warn('Failed to load file1:', err.message);
          return { ok: false, text: () => Promise.resolve('') };
        }),
        fetch(file2).catch((err) => {
          console.warn('Failed to load file2:', err.message);
          return { ok: false, text: () => Promise.resolve('') };
        }),
        fetch(coordFile).catch((err) => {
          console.warn('Failed to load coordinates:', err.message);
          return { ok: false, text: () => Promise.resolve('') };
        }),
      ]);

      const [file1Data, file2Data, coordData] = await Promise.all([
        file1Response.ok ? file1Response.text() : '',
        file2Response.ok ? file2Response.text() : '',
        coordResponse.ok ? coordResponse.text() : '',
      ]);

      console.log('File sizes:', {
        file1: file1Data.length,
        file2: file2Data.length,  
        coord: coordData.length
      });

      const parseCSV = (data, filename) => {
        if (!data.trim()) {
          console.warn(`${filename} is empty`);
          return [];
        }
        
        const result = Papa.parse(data, { 
          header: true, 
          skipEmptyLines: true,
          dynamicTyping: false,
          transformHeader: (header) => header.trim()
        });
        
        if (result.errors.length > 0) {
          console.warn(`Parsing errors in ${filename}:`, result.errors);
        }
        
        console.log(`${filename} parsed: ${result.data.length} records`);
        return result.data;
      };

      const parsed1 = parseCSV(file1Data, 'file1');
      const parsed2 = parseCSV(file2Data, 'file2');
      const coords = parseCSV(coordData, 'coordinates');

      const newSensorMap = {};
      coords.forEach((row, idx) => {
        const name = (row.equipment || row.sensor || row.navName || '').trim();
        if (name) {
          const xLoc = parseFloat(row.xLoc);
          const yLoc = parseFloat(row.yLoc);
          
          if (!isNaN(xLoc) && !isNaN(yLoc)) {
            newSensorMap[name] = {
              xLoc,
              yLoc,
              remarks: (row.remarks || '').trim(),
              location: (row.location || '').trim(),
            };
          }
        }
      });

      console.log('Sensor map created with', Object.keys(newSensorMap).length, 'sensors');

      const rawMerged = [...parsed1, ...parsed2].map((d, idx) => {
        const equip = (
          d.equipment || 
          d.sensor || 
          d.navName || 
          d.Equipment || 
          d.Sensor || 
          d.NavName || 
          ''
        ).toString().trim();

        const meta = newSensorMap[equip];
        
        const temperature = parseFloat(
          d.temperature || 
          d.Temperature || 
          d.temp || 
          d.Temp || 
          0
        );
        
        const humidity = parseFloat(
          d.humidity || 
          d.Humidity || 
          d.hum || 
          d.Hum || 
          0
        );

        const xLoc = parseFloat(d.xLoc) || meta?.xLoc;
        const yLoc = parseFloat(d.yLoc) || meta?.yLoc;

        const merged = {
          ...d,
          navName: equip,
          equipment: equip,
          xLoc,
          yLoc,
          remarks: d.remarks || meta?.remarks || '',
          location: d.location || meta?.location || '',
          temperature,
          humidity,
          timeStamp: d.timeStamp || d.timestamp || d.TimeStamp || d.Timestamp || '',
        };

        return merged;
      });

      const validData = rawMerged.filter(d => {
        const hasValidCoords = !isNaN(d.xLoc) && !isNaN(d.yLoc);
        const hasEquipment = d.equipment && d.equipment.length > 0;
        const hasTimestamp = d.timeStamp && d.timeStamp.length > 0;
        
        return hasValidCoords && hasEquipment && hasTimestamp;
      });
      
      console.log(`\nData processing complete:`);
      console.log(`- Raw merged: ${rawMerged.length} records`);
      console.log(`- Valid data: ${validData.length} records`);
      
      setSensorMap(newSensorMap);
      setAllSensorData(validData);
      
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      setAllSensorData([]);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        if (imgRef.current) {
          const rect = imgRef.current.getBoundingClientRect();
          setImgSize({ width: rect.width, height: rect.height });
          setTimeout(() => drawGradient(), 100);
        }
      }, 300);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const sliderIndex = hour * 4 + Math.floor(minute / 15);
    setSelectedTime(sliderIndex);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSensorData();
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedTime, selectedDate]);

  useEffect(() => {
    fetchSensorData();
  }, [selectedDate]);

  useEffect(() => {
    filterSensorData();
  }, [allSensorData, selectedTime, selectedDate]);

  useEffect(() => {
    if (sensorData.length > 0 && imgSize.width > 1 && imgSize.height > 1) {
      setTimeout(() => {
        drawGradient();
      }, 50);
    }
  }, [sensorData, imgSize, selectedTime]);

  useEffect(() => {
    const handleResize = () => {
      if (imgRef.current) {
        const newWidth = imgRef.current.clientWidth;
        const newHeight = imgRef.current.clientHeight;
        
        setImgSize({
          width: newWidth,
          height: newHeight,
        });
        
        setTimeout(() => {
          drawGradient();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let resizeTimeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (imgRef.current) {
          const rect = imgRef.current.getBoundingClientRect();
          setImgSize({
            width: rect.width,
            height: rect.height,
          });
          
          setTimeout(() => {
            drawGradient();
          }, 100);
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const handleRefreshClick = (event) => {
    event.preventDefault();
    setZoom(1);
    setActiveLegend('all');
    fetchSensorData();
  };

  const handleSensorToggle = () => setShowSensorDots((prev) => !prev);

  const toggleFullscreen = () => {
    const elem = document.documentElement;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => {
        console.log('Entered fullscreen');
        setTimeout(() => {
          if (imgRef.current) {
            const rect = imgRef.current.getBoundingClientRect();
            setImgSize({ width: rect.width, height: rect.height });
            drawGradient();
          }
        }, 400);
      }).catch((err) => console.error('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => {
        console.log('Exited fullscreen');
        setTimeout(() => {
          if (imgRef.current) {
            const rect = imgRef.current.getBoundingClientRect();
            setImgSize({ width: rect.width, height: rect.height });
            drawGradient();
          }
        }, 400);
      }).catch((err) => console.error('Exit fullscreen error:', err));
    }
  };

  const handleDownloadCSV = () => {
    const date = new Date(selectedDate);
    const filename = `${date.toISOString().slice(0, 10)}_cotai.csv`;
    const csv = Papa.unparse(sensorData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSensorClick = (sensor) => {
    console.log('Sensor clicked:', sensor);
    setClickedSensor(sensor);
    setSelectedSensorData(sensor);
  };

  const sliderStyle = { width: '300px', ml: 2, color: '#555' };

  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    background: '#f7f7f7',
    fontSize: '14px',
    cursor: 'pointer',
  };

  const zoomControlStyle = {
    position: 'absolute',
    top: 265,
    right: 20,
    width: 40,
    height: 150,
    backgroundColor: '#e1e1e1',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  };

  const zoomButton = {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: '50%',
    textAlign: 'center',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '18px',
  };

  const zoomLine = {
    flex: 1,
    width: '4px',
    backgroundColor: '#888',
    margin: '10px 0',
  };

  const getFormattedTime = (index) => {
    const hour = Math.floor(index / 4);
    const minute = (index % 4) * 15;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'auto',
      }}
    >
      <style>{blinkingStyles}</style>
      
      <Box
        sx={{
          position: 'fixed',
          top: 95,
          left: 80,
          width: 'calc(100% - 80px)',
          backgroundColor: '#fff',
          borderBottom: '1px solid #ddd',
          padding: '10px 30px',
          zIndex: 999,
        }}
      >
        {/* Floor Selection Tabs */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>Floor Selection</Typography>
          {['Summary', 'GF', 'GFM & 1F', '2F & 2FM', '3F'].map((label) => (
            <Box
              key={label}
              onClick={() => setFloor(label)}
              sx={{
                padding: '6px 16px',
                borderRadius: '20px',
                backgroundColor: floor === label ? '#eee' : 'transparent',
                border: floor === label ? '2px solid #aaa' : '1px solid transparent',
                fontWeight: floor === label ? 600 : 500,
                color: floor === label ? '#000' : '#666',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s',
                '&:hover': { backgroundColor: '#e0e0e0' },
              }}
            >
              {label}
            </Box>
          ))}
        </Box>

        {/* Header with Title and Controls */}
        <Box
          sx={{
            marginTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Left: Thermal Comfort + Time Display */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ color: '#f26722', fontWeight: 700 }}>
              Thermal Comfort - {floor} ({selectedDate.toLocaleDateString('en-GB')} {getFormattedTime(selectedTime)})
            </Typography>

            <IconButton onClick={handleRefreshClick} disableRipple>
              <CachedIcon sx={{ fontSize: 20, color: '#888' }} />
            </IconButton>
            {dataLoading && (
              <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                Loading...
              </Typography>
            )}
          </Box>

          {/* Right: Reporting + Date + Time Slider */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Reporting</Typography>
            <Typography variant="body2">
              {new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
            </LocalizationProvider>
            <Slider
              value={selectedTime}
              min={0}
              max={95}
              step={1}
              marks={timeMarks}
              valueLabelFormat={(val) => getFormattedTime(val)}
              onChange={(e, val) => setSelectedTime(val)}
              sx={sliderStyle}
            />
          </Box>
        </Box>

{/* Control Buttons */}
<Box sx={{ marginTop: '12px', marginLeft: '5px', display: 'flex', gap: '10px', alignItems: 'center' }}>
  <button onClick={handleSensorToggle} style={buttonStyle}>
    {showSensorDots ? 'Hide Sensors' : 'Show Sensors'}
  </button>
  <button onClick={toggleFullscreen} style={buttonStyle}>
    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
  </button>
  <button onClick={handleDownloadCSV} style={buttonStyle}>
    Download CSV
  </button>

  {/* Mansion One Button - Only shows on 2F & 2FM floor */}
  {floor === '2F & 2FM' && (
    <button 
      onClick={() => setMansionOneMode(!mansionOneMode)} 
      style={{
        ...buttonStyle,
        backgroundColor: mansionOneMode ? '#f26722' : '#f7f7f7',
        color: mansionOneMode ? 'white' : 'black',
        fontWeight: mansionOneMode ? 'bold' : 'normal',
        border: mansionOneMode ? '2px solid #d84315' : '1px solid #ccc',
      }}
    >
      {mansionOneMode ? '✓ Mansion One' : 'Mansion One'}
    </button>
  )}
</Box>
      </Box>

      {/* Temperature Scale */}
      <Box
        sx={{
          position: 'absolute',
          top: 450,
          right: 20,
          width: 20,
          height: 300,
          background: 'linear-gradient(to top, blue, cyan, green, yellow, orange, red)',
          borderRadius: '10px',
          border: '1px solid #aaa',
          zIndex: 10,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 450,
          right: 55,
          height: 300,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#333',
          zIndex: 10,
        }}
      >
        <Box sx={{ textAlign: 'right' }}>28°C<br />Uncomfortable</Box>
        <Box sx={{ textAlign: 'right' }}>24.5°C<br />Comfortable</Box>
        <Box sx={{ textAlign: 'right' }}>19.5°C<br />Uncomfortable</Box>
        <Box sx={{ textAlign: 'right' }}>18°C</Box>
      </Box>

      {/* Legend */}
      <Box
        sx={{
          position: 'absolute',
          top: 'calc(50% + 390px)',
          right: 20,
          backgroundColor: '#fff',
          padding: '8px 10px',
          border: '1px solid #aaa',
          borderRadius: 2,
          fontSize: '12px',
          boxShadow: '0 0 4px rgba(0,0,0,0.1)',
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: 'black', border: '3px solid red', marginRight: 1 }} />
          {'> 24 °C'}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: 'black', border: '3px solid blue', marginRight: 1 }} />
          {'< 21 °C'}
        </Box>
      </Box>

      {/* Zoom Controls */}
      <Box sx={zoomControlStyle}>
        <Box onClick={() => setZoom((z) => Math.min(z + 0.1, 2))} sx={zoomButton}>+</Box>
        <Box sx={zoomLine} />
        <Box onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))} sx={zoomButton}>−</Box>
      </Box>

      {/* ===== SUMMARY PAGE - Display All 4 Floors in Grid ===== */}
      {floor === 'Summary' && (
        <Box
          sx={{
            width: isFullscreen ? '100vw' : '95vw',
            height: 'auto',
            overflow: 'auto',
            margin: 'auto',
            marginTop: isFullscreen ? '250px' : '250px',
            marginBottom: '50px',
            padding: '20px',
            borderRadius: '8px',
            backgroundColor: '#fdfdfd',
            position: 'relative',
          }}
        >
          {/* 2x2 Grid Layout */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px',
              width: '100%',
            }}
          >
            {/* GF Heatmap - UPDATED */}
            <Box
              sx={{
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => setFloor('GF')}
            >
              <Box sx={{ textAlign: 'center', padding: '10px', fontWeight: 'bold', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                 GF - Ground Floor
              </Box>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '500px',
                  overflow: 'hidden',
                  backgroundColor: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={GFBase}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            </Box>

            {/* GFM & 1F Heatmap - UPDATED */}
            <Box
              sx={{
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => setFloor('GFM & 1F')}
            >
               <Box sx={{ textAlign: 'center', padding: '10px', fontWeight: 'bold', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                 GFM & 1F
              </Box>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '500px',
                  overflow: 'hidden',
                  backgroundColor: '#fafafa',
                }}
              >
                <CotaiGFM1FHeatMap
                  zoom={0.35}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  showSensorDots={false}
                  setSelectedSensorData={setClickedSensor}
                  setSensorMap={setSensorMap}
                  setSelectedDate={setSelectedDate}
                  setSelectedTime={setSelectedTime}
                />
              </Box>
            </Box>

            {/* 2F & 2FM Heatmap - UPDATED */}
            <Box
              sx={{
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => setFloor('2F & 2FM')}
            >
              <Box sx={{ textAlign: 'center', padding: '10px', fontWeight: 'bold', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                 2F & 2FM
              </Box>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '500px',
                  overflow: 'hidden',
                  backgroundColor: '#fafafa',
                }}
              >
                <Cotai2F2FMHeatMap
                  zoom={0.35}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  showSensorDots={false}
                  setSelectedSensorData={setClickedSensor}
                  setSensorMap={setSensorMap}
                />
              </Box>
            </Box>

            {/* 3F Heatmap - UPDATED */}
            <Box
              sx={{
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => setFloor('3F')}
            >
              <Box sx={{ textAlign: 'center', padding: '10px', fontWeight: 'bold', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                 3F - Mansion
              </Box>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '500px',
                  overflow: 'hidden',
                  backgroundColor: '#fafafa',
                }}
              >
                <Cotai3FHeatMap
                  zoom={0.35}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  showSensorDots={false}
                  setSelectedSensorData={setClickedSensor}
                  setSensorMap={setSensorMap}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* GF Floor Display */}
      {floor === 'GF' && (
        <Box
          sx={{
            width: isFullscreen ? '100vw' : '80vw',
            height: isFullscreen ? '100vh' : '80vh',
            overflow: 'auto',
            margin: 'auto',
            marginTop: isFullscreen ? '150px' : '200px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#fdfdfd',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: 'fit-content',
              height: 'fit-content',
              margin: 0,
            }}
          >
            <img
              src={GFBase}
              ref={imgRef}
              onLoad={handleImageLoad}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                position: 'relative',
                zIndex: 0,
              }}
            />

            <canvas
              id="heatmap-canvas"
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />

            <img
              src={GFTop}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                maxWidth: '100%',
                height: 'auto',
                zIndex: 2,
                opacity: 1,
                pointerEvents: 'none',
              }}
            />

            {/* Sensor Dots */}
            {showSensorDots && sensorData.map((sensor, index) => {
              const { xLoc, yLoc, temperature, humidity, equipment, location } = sensor;
              const xRaw = parseFloat(xLoc);
              const yRaw = parseFloat(yLoc);
              
              if (isNaN(xRaw) || isNaN(yRaw)) {
                return null;
              }

              const scaleX = imgSize.width / BASE_WIDTH;
              const scaleY = imgSize.height / BASE_HEIGHT;
              
              const top = yRaw * scaleY;
              const left = xRaw * scaleX;
              const tooltipId = `sensor-${index}`;

              let borderColor = 'white';
              let borderWidth = 1;
              let isBlinking = false;

              const temp = parseFloat(temperature);
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSensorClick(sensor);
                  }}
                  style={{
                    position: 'absolute',
                    top: `${top}px`,
                    left: `${left}px`,
                    width: 30,
                    height: 30,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 3,
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                  }}
                >
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
                    {isNaN(temp) ? 'NaN' : `${temp.toFixed(1)}°C`}
                    <ReactTooltip id={tooltipId} place="top" style={{ zIndex: 9999 }}>
                      <div style={{ textAlign: 'left' }}>
                        <strong>Sensor:</strong> {equipment}<br />
                        <strong>Location:</strong> {location}<br />
                        <strong>Temp:</strong> {isNaN(temp) ? 'NaN' : `${temp.toFixed(1)}°C`}<br />
                        <strong>Hum:</strong> {isNaN(parseFloat(humidity)) ? 'NaN' : `${parseFloat(humidity).toFixed(1)}%`}
                      </div>
                    </ReactTooltip>
                  </div>
                </div>
              );
            })}
          </Box>
        </Box>
      )}

      {floor === 'GFM & 1F' && (
        <Box
          sx={{
            width: isFullscreen ? '100vw' : '80vw',
            height: isFullscreen ? '100vh' : '80vh',
            overflow: 'auto',
            margin: 'auto',
            marginTop: isFullscreen ? '150px' : '200px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#fdfdfd',
            position: 'relative',
          }}
        >
          <CotaiGFM1FHeatMap
            zoom={zoom}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            showSensorDots={showSensorDots}
            setSelectedSensorData={setClickedSensor}
            setSensorMap={setSensorMap}
            setSelectedDate={setSelectedDate}
            setSelectedTime={setSelectedTime}
          />
        </Box>
      )}

  {floor === '2F & 2FM' && (
  <Box
    sx={{
      width: isFullscreen ? '100vw' : '80vw',
      height: isFullscreen ? '100vh' : '80vh',
      overflow: 'auto',
      margin: 'auto',
      marginTop: isFullscreen ? '150px' : '200px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      backgroundColor: '#fdfdfd',
      position: 'relative',
    }}
  >
    {!mansionOneMode ? (
      <Cotai2F2FMHeatMap
        zoom={zoom}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        showSensorDots={showSensorDots}
        setSelectedSensorData={setClickedSensor}
        setSensorMap={setSensorMap}
      />
    ) : (
      <MansionOneHeatMap
        zoom={zoom}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        showSensorDots={showSensorDots}
        setSelectedSensorData={setClickedSensor}
        setSensorMap={setSensorMap}
      />
    )}
  </Box>
)}

      {floor === '3F' && (
        <Box
          sx={{
            width: isFullscreen ? '100vw' : '80vw',
            height: isFullscreen ? '100vh' : '80vh',
            overflow: 'auto',
            margin: 'auto',
            marginTop: isFullscreen ? '150px' : '200px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#fdfdfd',
            position: 'relative',
          }}
        >
          <Cotai3FHeatMap
            zoom={zoom}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            showSensorDots={showSensorDots}
            setSelectedSensorData={setClickedSensor}
            setSensorMap={setSensorMap}
          />
        </Box>
      )}

   {clickedSensor && (
  <TemperatureGraph
    selectedSensorData={clickedSensor}
    selectedDate={selectedDate}
    floor={floor === '2F & 2FM' ? 'Cotai2F2FM' : floor === 'GFM & 1F' ? 'CotaiGFM1F' : floor === '3F' ? 'Cotai3F' : 'Cotai'}
    isMansionOne={mansionOneMode}
    onClose={() => setClickedSensor(null)}
  />
)}
    </Box>
  );
};

export default CotaiHeatMap;