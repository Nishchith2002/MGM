
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  Slider,
  IconButton,
  TextField,
} from '@mui/material';
import CachedIcon from '@mui/icons-material/Cached';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import macauBaseImg from '../assets/mgm_macau_l1.JPG';
import macauTopImg from '../assets/MGM MACAU L1_top.png';
import cotaiBaseImg from '../assets/MGM COTAI GMF & 1F.jpg';
import cotaiTopImg from '../assets/MGM COTAI 1F & GFM_top.png';

const BASE_WIDTH = 3990;
const BASE_HEIGHT = 2450;

const getDotColor = (temp) => {
  if (temp >= 27.5) return '#ff3b04';
  if (temp >= 26.5) return '#ff7204';
  if (temp >= 24.5) return '#ffff00';
  if (temp >= 21.5) return '#98ff54';
  if (temp >= 18.5) return '#6ea9b7';
  return '#3333ff';
};

const sliderMarks = [
  { value: 0, label: '00:00' },
  { value: 24, label: '06:00' },
  { value: 48, label: '12:00' },
  { value: 72, label: '18:00' },
  { value: 95, label: '23:45' },
];

const HeatMapSummary = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    return now.getHours() * 4 + Math.floor(now.getMinutes() / 15);
  });

  const [macauSensors, setMacauSensors] = useState([]);
  const [cotaiSensors, setCotaiSensors] = useState([]);
  const macauCanvasRef = useRef();
  const cotaiCanvasRef = useRef();

  const getCsvFileName = (date, floor) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const folder = floor === 'Grande Praca' ? 'GrandePraca' : floor;
    return `/Data/${folder}/${year}-${month}-${day}.csv`;
  };

  const drawGradient = (canvasRef, sensors, imageEl) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageEl || sensors.length === 0) return;

    canvas.width = imageEl.width;
    canvas.height = imageEl.height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sensors.forEach(sensor => {
      const temp = parseFloat(sensor.temperature);
      const x = (parseFloat(sensor.xLoc) / BASE_WIDTH) * imageEl.width;
      const y = (parseFloat(sensor.yLoc) / BASE_HEIGHT) * imageEl.height;

      const color = getDotColor(temp);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
      gradient.addColorStop(0, `${color}88`);
      gradient.addColorStop(0.5, `${color}33`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 50, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const fetchSensors = async (floor, setSensorState) => {
    const file = getCsvFileName(selectedDate, floor);
    try {
      const res = await fetch(file);
      const text = await res.text();
      Papa.parse(text, {
        header: true,
        complete: (results) => {
          const selectedHour = Math.floor(selectedTime / 4);
          const selectedMinute = (selectedTime % 4) * 15;

          const filtered = results.data.filter(row => {
            const rawTime = row.timeStamp || row.timestamp || row.time || row.date;
            if (!rawTime) return false;

            const ts = new Date(rawTime.replace(' Hong_Kong', '').trim());
            return (
              ts.getHours() === selectedHour &&
              ts.getMinutes() === selectedMinute &&
              !isNaN(parseFloat(row.temperature)) &&
              !isNaN(parseFloat(row.xLoc)) &&
              !isNaN(parseFloat(row.yLoc))
            );
          });

          setSensorState(filtered);
        }
      });
    } catch (err) {
      console.error(`Failed to load CSV for ${floor}:`, err);
    }
  };

  useEffect(() => {
    fetchSensors('L1', setMacauSensors);
    fetchSensors('GrandePraca', setCotaiSensors);
  }, [selectedDate, selectedTime]);

  return (
    <Box sx={{ padding: 10, backgroundColor: '#fff', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4, pt: 2 }}>
        <Typography variant="h6" sx={{ color: '#f26722', fontWeight: 'bold' }}>
          Thermal Comfort Summary Page ({selectedDate.toLocaleDateString('en-GB')} - {(() => {
            const h = Math.floor(selectedTime / 4);
            const m = (selectedTime % 4) * 15;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          })()})
        </Typography>
           <Slider
        value={selectedTime}
        min={0}
        max={95}
        step={1}
        marks={sliderMarks}
        onChange={(e, val) => setSelectedTime(val)}
        sx={{ width: '30%', mx: 'auto', mt: 4 }}
      />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => {
            fetchSensors('L1', setMacauSensors);
            fetchSensors('GrandePraca', setCotaiSensors);
          }}>
            <CachedIcon />
          </IconButton>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              renderInput={(params) => <TextField {...params} size="small" />}
            />
          </LocalizationProvider>
          
        </Box>
      </Box>

   

      <Grid container spacing={0} justifyContent="center" sx={{ mt: 4 }}>
        {[
          {
            label: 'MACAU L1',
            baseImg: macauBaseImg,
            overlayImg: macauTopImg,
            sensors: macauSensors,
            ref: macauCanvasRef,
            floor: 'L1',
          },
          {
            label: 'COTAI GF',
            baseImg: cotaiBaseImg,
            overlayImg: cotaiTopImg,
            sensors: cotaiSensors,
            ref: cotaiCanvasRef,
            floor: 'Grande Praca',
          },
        ].map(({ label, baseImg, overlayImg, ref, sensors, floor }) => (
          <Grid item key={label} sx={{ mx: 4 }}>
            <Card sx={{ width: 500, boxShadow: 'none', borderRadius: 0, backgroundColor: 'transparent' }}>
              <CardActionArea
                sx={{ '&:hover': { backgroundColor: 'transparent' } }}
                onClick={() => {
                  if (floor === 'Grande Praca') {
                    navigate('/HeatMap/cotai');
                  } else {
                    navigate(`/HeatMap/detail?floor=${encodeURIComponent(floor)}`);
                  }
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <img
                    src={baseImg}
                    alt={`${label} base`}
                    style={{ width: '100%', display: 'block' }}
                    onLoad={(e) => drawGradient(ref, sensors, e.target)}
                  />
                  <canvas
                    ref={ref}
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
                    src={overlayImg}
                    alt={`${label} overlay`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                    }}
                  />
                </Box>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#000' }}>
                    {label}
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HeatMapSummary;
