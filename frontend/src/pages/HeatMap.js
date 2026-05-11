
import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import CachedIcon from '@mui/icons-material/Cached';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import floorplan from '../assets/mgm_macau_l1.JPG';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import TextField from '@mui/material/TextField';
import TemperatureGraph from './TemperatureGraph'; 
import floorplan2 from '../assets/MGM MACAU L1_top.png';
import L2HeatMap from '../components/L2HeatMap';
import GrandePracaHeatMap from '../components/GrandePracaHeatMap';
import { useSearchParams } from 'react-router-dom';

const BASE_WIDTH = 3990;
const BASE_HEIGHT = 2450;

const timeMarks = [
  { value: 0, label: '00:00' },
  { value: 24, label: '06:00' },
  { value: 48, label: '12:00' },
  { value: 72, label: '18:00' },
  { value: 95, label: '23:45' },
];

const convertIndexToTime = (index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  return { hour, minute };
};

const HeatMap = () => {
  const [sensors, setSensors] = useState([]);
  const [originalSensors, setOriginalSensors] = useState([]);
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef();
  const [imgSize, setImgSize] = useState({ width: 1, height: 1 });
  const [selectedSensorData, setSelectedSensorData] = useState(null);
  const [showSensorDots, setShowSensorDots] = useState(true); 
  const [showSensors, setShowSensors] = useState(true);
  const [activeLegend, setActiveLegend] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [highlightArea, setHighlightArea] = useState(null);
  const [showAreaControls, setShowAreaControls] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [availableAreas, setAvailableAreas] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [areaImages, setAreaImages] = useState([]);
  const [floor, setFloor] = useState('Summary');  // Start with Summary
  const [searchParams] = useSearchParams();
  const floorFromQuery = searchParams.get('floor');
  const [clickedSensor, setClickedSensor] = useState(null);

  useEffect(() => {
    if (floorFromQuery) {
      setFloor(floorFromQuery);
    }
  }, [floorFromQuery]);

  const getUniqueAreas = (data) => {
    const areas = new Set();
    data.forEach(row => {
      if (row.location && row.location.trim() !== '') {
        const cleanLocation = row.location.trim();
        if (cleanLocation !== 'TBC' && cleanLocation !== '') {
          areas.add(cleanLocation);
        }
      }
    });
    return Array.from(areas).sort();
  };

  const canvasRef = useRef(null);
  const [sensorMap, setSensorMap] = useState({});
  const getCurrentTimeIndex = () => {
    const now = new Date();
    return now.getHours() * 4 + Math.floor(now.getMinutes() / 15);
  };

  const [selectedTime, setSelectedTime] = useState(getCurrentTimeIndex()); 
  const [hideNavSidebar, setHideNavSidebar] = useState(false);

  const hideNavAndSidebar = (hide) => {
    setHideNavSidebar(hide);
  };

  useEffect(() => {
    window.hideNavAndSidebar = hideNavAndSidebar;
    return () => {
      delete window.hideNavAndSidebar;
    };
  }, []);

  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const response = await fetch('Data/L1/heatmap.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('CSV data loaded:', results.data);
            setSensorData(results.data);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          }
        });
      } catch (error) {
        console.error('Error loading CSV file:', error);
      }
    };

    loadCSVData();
  }, []);

  useEffect(() => {
    if (sensorData && sensorData.length > 0) {
      const uniqueAreas = getUniqueAreas(sensorData);
      setAvailableAreas(uniqueAreas);
      console.log('Available areas:', uniqueAreas);
    }
  }, [sensorData]);

  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: '#f7f7f7',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const getCsvFileName = (date, floor) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const folder = floor === 'Grande Praca' ? 'GrandePraca' : floor;
    return `/Data/${folder}/${year}-${month}-${day}.csv`;
  };

  useEffect(() => {
    let heatmapPath = '';

    if (floor === 'L2') {
      heatmapPath = '/Data/L2/sensorMap.csv';
    } else if (floor === 'Grande Praca') {
      heatmapPath = '/Data/GrandePraca/sensorMap.csv';
    } else if (floor === 'L1') {
      heatmapPath = '/Data/L1/heatmap.csv';
    }

    if (heatmapPath && floor !== 'Summary') {
      Papa.parse(heatmapPath, {
        download: true,
        header: true,
        complete: (results) => {
          const map = {};
          results.data.forEach((row) => {
            const name = row.navName?.trim() || row.sensor?.trim() || row.equipment?.trim();
            if (name) {
              map[name] = {
                xLoc: parseFloat(row.xLoc),
                yLoc: parseFloat(row.yLoc),
                location: row.location || row.remarks || '',
                remarks: row.remarks,
                status: row.status,
              };
            }
          });
          setSensorMap(map);
          console.log(` Sensor map loaded for ${floor}:`, Object.keys(map).length);

          if (results.data.length > 0) {
            const unique = new Set();
            results.data.forEach((row) => {
              const loc = (row.location || row.remarks || '').trim();
              if (loc && loc !== 'TBC') unique.add(loc);
            });
            const sortedAreas = Array.from(unique).sort();
            setAvailableAreas(sortedAreas);
          }
        },
        error: (err) => console.error(`❌ Failed to load ${heatmapPath}`, err),
      });
    }
  }, [floor]);

  const fetchSensorData = (dateParam = selectedDate, timeIndex = selectedTime, floorParam = floor) => {
    if (floorParam === 'Summary') return;

    const date = new Date(dateParam);
    const file = getCsvFileName(date, floorParam);

    console.log("Loading data from:", file);

    Papa.parse(file, {
      download: true,
      header: true,
      encoding: 'latin1',
      complete: (results) => {
        const rawData = results.data;
        const latest = {};
        const selectedDateStr = date.toLocaleDateString('en-CA');

        const filteredData = rawData.filter((row) => {
          const timestampStr = row.timeStamp || row.timestamp || row.date || row.time;
          if (!timestampStr) return false;

          const cleanedTimestamp = timestampStr.replace(' Hong_Kong', '').trim();
          const rowDate = new Date(cleanedTimestamp);
          const { hour, minute } = convertIndexToTime(timeIndex);

          return (
            !isNaN(rowDate.getTime()) &&
            rowDate.toLocaleDateString('en-CA') === selectedDateStr &&
            rowDate.getHours() === hour &&
            rowDate.getMinutes() === minute
          );
        });

        if (filteredData.length === 0) {
          console.warn(`⚠️ No sensor data at index ${timeIndex}`);
          const fallbackRow = rawData.find((row) => {
            const ts = row.timeStamp || row.timestamp || row.date || row.time;
            const d = new Date((ts || '').replace(' Hong_Kong', '').trim());
            return !isNaN(d.getTime());
          });

          if (fallbackRow) {
            const ts = fallbackRow.timeStamp || fallbackRow.timestamp || fallbackRow.date || fallbackRow.time;
            const fallbackDate = new Date((ts || '').replace(' Hong_Kong', '').trim());
            if (!isNaN(fallbackDate.getTime())) {
              const fallbackIndex = fallbackDate.getHours() * 4 + Math.floor(fallbackDate.getMinutes() / 15);
              setSelectedTime(fallbackIndex);
              fetchSensorData(dateParam, fallbackIndex, floorParam);
              return;
            }
          }
        }

        filteredData.forEach((row) => {
          const equip = row.equipment?.trim();
          const timestamp = row.timestamp || row.date || row.time || '';
          const parsed = new Date(timestamp);

          if (!equip || isNaN(parsed.getTime())) return;

          const meta = sensorMap[equip];
          if (meta) {
            if (!row.xLoc || isNaN(parseFloat(row.xLoc))) row.xLoc = meta.xLoc;
            if (!row.yLoc || isNaN(parseFloat(row.yLoc))) row.yLoc = meta.yLoc;
            if (!row.location) row.location = meta.location;
            if (!row.remarks) row.remarks = meta.remarks;
            if (!row.status) row.status = meta.status;
          }

          if (!latest[equip] || parsed > new Date(latest[equip].timestamp)) {
            latest[equip] = { ...row, timestamp };
          }
        });

        const enriched = Object.values(latest)
          .filter((sensor) => sensor.equipment && !isNaN(sensor.xLoc) && !isNaN(sensor.yLoc))
          .map((sensor) => {
            const temp = parseFloat(sensor.temperature?.replace('°C', ''));
            const humidity = parseFloat(sensor.humidity?.replace('%RH', ''));
            const xLoc = parseFloat(sensor.xLoc);
            const yLoc = parseFloat(sensor.yLoc);
            return {
              ...sensor,
              navName: sensor.equipment?.trim(),
              temp,
              humidity,
              xLoc: isNaN(xLoc) ? null : xLoc,
              yLoc: isNaN(yLoc) ? null : yLoc,
            };
          });

        if (enriched.length === 0) {
          console.warn('❌ No valid sensor data');
          setSensors([]);
          setOriginalSensors([]);
        } else {
          setSensors(enriched);
          setOriginalSensors(enriched);
        }
      },
      error: (err) => console.error('CSV Load Error', err),
    });
  };

  useEffect(() => {
    if (floor !== 'Summary') {
      fetchSensorData(selectedDate, selectedTime, floor);
    }
  }, [selectedDate, selectedTime, floor]);

  useEffect(() => {
    if (showAreaControls && selectedAreas.length > 0 && (floor === 'L1' || floor === 'L2') && Object.keys(sensorMap).length > 0) {
      const updatedImagesWithCoords = selectedAreas.map((locationName) => {
        const matchingSensors = Object.values(sensorMap).filter((s) => s.location?.trim() === locationName.trim() && !isNaN(s.xLoc) && !isNaN(s.yLoc));

        if (matchingSensors.length === 0) return null;

        const avgX = matchingSensors.reduce((sum, s) => sum + parseFloat(s.xLoc), 0) / matchingSensors.length;
        const avgY = matchingSensors.reduce((sum, s) => sum + parseFloat(s.yLoc), 0) / matchingSensors.length;

        return {
          name: locationName,
          img: `/Positions/${encodeURIComponent(locationName)}.png`,
          xLoc: avgX,
          yLoc: avgY,
        };
      }).filter(Boolean);

      setAreaImages(updatedImagesWithCoords);
    }
  }, [sensorMap, selectedAreas, showAreaControls, floor]);

useEffect(() => {
  if (floor !== 'Summary') {  // ✅ Only fetch if NOT Summary
    fetchSensorData(selectedDate, selectedTime, floor);
    const interval = setInterval(() => {
      fetchSensorData(selectedDate, selectedTime, floor);
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }
}, [selectedDate, selectedTime, floor]);  // ✅ Added 'floor' to dependencies

  const handleSliderChange = (e, newValue) => {
    setSelectedTime(newValue);
    if (floor !== 'Summary') {
      fetchSensorData(selectedDate, newValue, floor);
    }
  };

  const handleDownloadCSV = () => {
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
    const csvFileName = `${year}-${month}-${day}.csv`; 
    const csv = Papa.unparse(sensors); 
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', csvFileName); 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes blink-border {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.2; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleLegendClick = (range) => {
    setActiveLegend(range);
    if (range === 'all') {
      setSensors(originalSensors);
    } else {
      const filtered = originalSensors.filter((sensor) => {
        const t = parseFloat(sensor.temp);
        if (range === 'high') return t > 24.5;
        if (range === 'mid') return t >= 19.5 && t <= 24.5;
        if (range === 'low') return t < 19.5;
        return true;
      });
      setSensors(filtered);
    }
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

  const handleRefreshClick = (event) => {
    event.preventDefault();
    setZoom(1);
    setActiveLegend('all');
    if (floor !== 'Summary') {
      fetchSensorData(selectedDate, selectedTime, floor);
    }
  };

  const drawGradient = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !canvas.getContext || !img) return;

    const ctx = canvas.getContext('2d');
    const width = img.clientWidth;
    const height = img.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sensors.forEach((sensor) => {
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

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const elem = document.documentElement;
    
    if (!document.fullscreenElement) {
      if (window.toggleLayoutFullscreen) {
        window.toggleLayoutFullscreen(true);
      }
      
      elem.requestFullscreen?.().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error entering fullscreen:', err);
        if (window.toggleLayoutFullscreen) {
          window.toggleLayoutFullscreen(false);
        }
      });
    } else {
      if (window.toggleLayoutFullscreen) {
        window.toggleLayoutFullscreen(false);
      }
      
      document.exitFullscreen?.().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        if (window.toggleLayoutFullscreen) {
          window.toggleLayoutFullscreen(false);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => { document.removeEventListener('fullscreenchange', handleFullscreenChange); };
  }, []);

  const drawSensorDots = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !canvas.getContext || !img || !showSensorDots) return;

    const ctx = canvas.getContext('2d');
    const width = img.clientWidth;
    const height = img.clientHeight;

    sensors.forEach((sensor) => {
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

  useEffect(() => {
    drawHeatmap();
  }, [sensors, imgSize, zoom]);

  const handleSensorClick = (sensor) => {
    console.log('Sensor clicked:', sensor);
    setSelectedSensorData({
      ...sensor,
      selectedDate: selectedDate, 
    });
    
    setTimeout(() => {
      drawHeatmap();
    }, 50);
  };

  const handleCloseGraph = () => {
    setSelectedSensorData(null);
    setTimeout(() => {
      drawHeatmap();
    }, 50);
  };

  const handleSensorToggle = () => {
    setShowSensorDots(!showSensorDots); 
  };

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

  const sliderStyle = { width: '300px', ml: 2, color: '#555' };
  const zoomControlStyle = { position: 'absolute', top: 275, right: 20, width: 40, height: 150, backgroundColor: '#e1e1e1', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 };
  const zoomButton = { width: 24, height: 24, backgroundColor: '#fff', borderRadius: '50%', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer', fontSize: '18px' };
  const zoomLine = { flex: 1, width: '4px', backgroundColor: '#888', margin: '10px 0' };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100vh', overflow: 'auto' }}>
      
      {/* Header */}
      <Box sx={{ position: 'fixed', top: 95, left: 80, width: 'calc(100% - 80px)', backgroundColor: '#fff', borderBottom: '1px solid #ddd', padding: '10px 30px', zIndex: 999 }}>
        
        {/* Floor Selection Tabs */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>Floor Selection</Typography>
          {['Summary', 'L1', 'L2', 'Grande Praca'].map((label) => (
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

        {/* Title + Date */}
        <Box sx={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ color: '#f26722', fontWeight: 700 }}>
              Thermal Comfort - {floor} ({selectedDate.toLocaleDateString('en-GB')} {(() => {
                const { hour, minute } = convertIndexToTime(selectedTime);
                return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
              })()})
            </Typography>
            <IconButton onClick={handleRefreshClick} disableRipple>
              <CachedIcon sx={{ fontSize: 20, color: '#888' }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Reporting</Typography>
            <Typography variant="body2">
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
            </LocalizationProvider>
            
            {floor !== 'Summary' && (
              <Slider
                value={selectedTime}
                min={0}
                max={95}
                step={1}
                marks={timeMarks}
                onChange={handleSliderChange}
                sx={sliderStyle}
              />
            )}
          </Box>
        </Box>

        {/* Control Buttons */}
        {floor !== 'Summary' && (
          <Box sx={{ marginTop: '12px', marginLeft: '5px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={handleSensorToggle} style={buttonStyle}>
              {showSensorDots ? 'Hide Sensors' : 'Show Sensors'}
            </button>
            <button onClick={toggleFullscreen} style={buttonStyle}>
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            <button onClick={handleDownloadCSV} style={buttonStyle}>Download CSV</button>
          </Box>
        )}
      </Box>

      {/* Color Bar - Only show when NOT on Summary */}
      {floor !== 'Summary' && (
        <Box sx={{ position: 'absolute', top: 450, right: 20, width: 20, height: 300, background: 'linear-gradient(to top, blue, cyan, green, yellow, orange, red)', borderRadius: '10px', border: '1px solid #aaa', zIndex: 10 }} />
      )}
      {floor !== 'Summary' && (
        <Box sx={{ position: 'absolute', top: 450, right: 55, height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', color: '#333', zIndex: 10 }}>
          <Box sx={{ textAlign: 'right' }}>28°C<br />Uncomfortable</Box>
          <Box sx={{ textAlign: 'right' }}>24.5°C<br />Comfortable</Box>
          <Box sx={{ textAlign: 'right' }}>19.5°C<br />Uncomfortable</Box>
          <Box sx={{ textAlign: 'right' }}>18°C</Box>
        </Box>
      )}

      {/* Legend - Only show when NOT on Summary */}
      {floor !== 'Summary' && (
        <Box sx={{ position: 'absolute', top: 'calc(50% + 390px)', right: 20, backgroundColor: '#fff', padding: '8px 10px', border: '1px solid #aaa', borderRadius: 2, fontSize: '12px', boxShadow: '0 0 4px rgba(0,0,0,0.1)', zIndex: 10 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: 'black', border: '3px solid red', marginRight: 1 }} />
            {'> 24 °C'}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: 'black', border: '3px solid blue', marginRight: 1 }} />
            {'< 21 °C'}
          </Box>
        </Box>
      )}

      {/* Zoom Controls - Only show when NOT on Summary */}
      {floor !== 'Summary' && (
        <Box sx={zoomControlStyle}>
          <Box onClick={() => setZoom((z) => Math.min(z + 0.1, 2))} sx={zoomButton}>+</Box>
          <Box sx={zoomLine} />
          <Box onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))} sx={zoomButton}>−</Box>
        </Box>
      )}

      {/* ===== SUMMARY PAGE - 3 HEATMAPS (EQUAL SIZE) ===== */}
      {floor === 'Summary' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', margin: 'auto', marginTop: '200px', marginBottom: '50px', width: '90vw', padding: '20px', maxWidth: '1400px' }}>
          
          {/* L1 Card - FIXED */}
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '600px',width:"450px" }} onClick={() => setFloor('L1')} style={{ cursor: 'pointer' }}>
            <Box sx={{ padding: '10px', fontWeight: 'bold', }}> L1 - Level 1</Box>
            <Box sx={{ flex: 1, width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',  }}>
              <img src={floorplan} style={{ width: '85%', height: '55%', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
            </Box>
          </Box>

          {/* L2 Card */}
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '600px',width:"450px", }} onClick={() => setFloor('L2')} style={{ cursor: 'pointer' }}>
            <Box sx={{ fontWeight: 'bold',  }}> L2 - Level 2</Box>
            <Box sx={{ flex: 1, width: '100%', overflow: 'hidden', }}>
              <L2HeatMap zoom={1} selectedDate={selectedDate} selectedTime={selectedTime} showSensorDots={false} setSelectedSensorData={setSelectedSensorData} setSensorMap={setSensorMap} />
            </Box>
          </Box>

          {/* Grande Praca Card */}
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '600px',width:"450px",  }} onClick={() => setFloor('Grande Praca')} style={{ cursor: 'pointer' }}>
            <Box sx={{ padding: '10px', fontWeight: 'bold',  }}> Grande Praca</Box>
            <Box sx={{ flex: 1, width: '100%', overflow: 'hidden',  }}>
              <GrandePracaHeatMap zoom={1} selectedDate={selectedDate} selectedTime={selectedTime} showSensorDots={false} setSelectedSensorData={setSelectedSensorData} setSensorMap={setSensorMap} />
            </Box>
          </Box>
        </Box>
      )}

      {/* L2 Floor Display - FIXED */}
      {floor === 'L2' && (
        <Box sx={{ width: isFullscreen ? '100vw' : '85vw', height: 'auto', overflow: 'visible', margin: 'auto', marginTop: isFullscreen ? '120px' : '180px', marginBottom: '50px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fdfdfd', position: 'relative' }}>
          <L2HeatMap zoom={zoom} selectedDate={selectedDate} selectedTime={selectedTime} showSensorDots={showSensorDots} setSelectedSensorData={setSelectedSensorData} setSensorMap={setSensorMap} />
        </Box>
      )}

      {/* Grande Praca Floor Display - FIXED */}
      {floor === 'Grande Praca' && (
        <Box sx={{ width: isFullscreen ? '100vw' : '85vw', height: 'auto', overflow: 'visible', margin: 'auto', marginTop: isFullscreen ? '120px' : '180px', marginBottom: '50px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fdfdfd', position: 'relative' }}>
          <GrandePracaHeatMap zoom={zoom} selectedDate={selectedDate} selectedTime={selectedTime} showSensorDots={showSensorDots} setSelectedSensorData={setSelectedSensorData} setSensorMap={setSensorMap} />
        </Box>
      )}

      {/* L1 Floor Display - FIXED */}
      {floor === 'L1' && (
        <Box sx={{ width: isFullscreen ? '100vw' : '85vw', height: 'auto', overflow: 'visible', margin: 'auto', marginTop: isFullscreen ? '120px' : '180px', marginBottom: '50px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fdfdfd', position: 'relative' }}>
          <Box sx={{ position: 'relative', transform: `scale(${zoom})`, transformOrigin: 'top left', width: 'fit-content', height: 'fit-content', margin: 0 }}>
            <img src={floorplan} ref={imgRef} onLoad={(e) => { setImgSize({ width: e.target.clientWidth, height: e.target.clientHeight }); if (canvasRef.current) { canvasRef.current.width = e.target.clientWidth; canvasRef.current.height = e.target.clientHeight; drawHeatmap(); } }} style={{ maxWidth: '100%', height: 'auto', display: 'block', position: 'relative', zIndex: 0, objectFit: 'contain' }} />
            <canvas id="heatmap-canvas" ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} />
            <img src={floorplan2} style={{ position: 'absolute', top: 0, left: 0, maxWidth: '100%', height: 'auto', zIndex: 2, opacity: 1, pointerEvents: 'none', objectFit: 'contain' }} />

            {showSensorDots && sensors.map((sensor, index) => {
              const { xLoc, yLoc, temp, humidity, navName, location } = sensor;
              if (!xLoc || !yLoc || isNaN(xLoc) || isNaN(yLoc)) return null;

              const top = (yLoc / BASE_HEIGHT) * imgSize.height;
              const left = (xLoc / BASE_WIDTH) * imgSize.width;
              const tooltipId = `sensor-${index}`;

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
                <div key={tooltipId} onClick={() => handleSensorClick(sensor)} style={{ position: 'absolute', top, left, width: 30, height: 30, transform: 'translate(-50%, -50%)', zIndex: 3, pointerEvents: 'auto', cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderRadius: '50%', border: `${borderWidth}px solid ${borderColor}`, animation: isBlinking ? 'blink-border 1s infinite' : 'none', boxSizing: 'border-box' }} />
                  <div data-tooltip-id={tooltipId} style={{ position: 'absolute', top: '2px', left: '2px', width: '26px', height: '26px', backgroundColor: 'black', borderRadius: '50%', color: 'white', fontSize: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4 }}>
                    {isNaN(temp) ? 'NaN' : `${parseFloat(temp).toFixed(1)}°C`}
                    <ReactTooltip id={tooltipId} place="top" style={{ zIndex: 9999 }}>
                      <div style={{ textAlign: 'left' }}>
                        <strong>Sensor:</strong> {navName}<br />
                        <strong>Location:</strong> {location}<br />
                        <strong>Temp:</strong> {isNaN(temp) ? 'NaN' : `${parseFloat(temp).toFixed(1)}°C`}<br />
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

      {/* Temperature Graph Modal */}
      {selectedSensorData && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)', zIndex: 1000 }}>
          <Box onClick={(e) => e.stopPropagation()} sx={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)', position: 'relative', width: '80%', maxWidth: '1000px' }}>
            <TemperatureGraph selectedSensorData={selectedSensorData} onClose={handleCloseGraph} selectedDate={selectedDate} floor={floor === 'Grande Praca' ? 'GrandePraca' : floor} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default HeatMap;