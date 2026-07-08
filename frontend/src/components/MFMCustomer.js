



// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import Papa from 'papaparse';
// import { Box, Typography, Select, MenuItem, FormControl } from '@mui/material';
// import baseImage from '../assets/mgm_macau_l1.JPG';

// const BASE_WIDTH  = 4000;
// const BASE_HEIGHT = 2500;

// const LUX_LEVELS = [
//   { label: 'Under 150',    min: 0,   max: 149,      fill: '#FF2233', border: '#CC0011' },
//   { label: '150 - 200',    min: 150, max: 200,      fill: '#FF7700', border: '#CC5500' },
//   { label: '201 - 250',    min: 201, max: 250,      fill: '#FFD000', border: '#CC9900' },
//   { label: '250 or above', min: 251, max: Infinity, fill: '#11CC44', border: '#009933' },
// ];

// const getLuxColor = (lux) =>
//   LUX_LEVELS.find(l => lux >= l.min && lux <= l.max) || LUX_LEVELS[0];

// const getTempColor = (value) => {
//   let r, g, b;
//   if (value <= 23) {
//     const t = Math.max(0, Math.min(1, (value - 20) / (23 - 20)));
//     r = 0;
//     g = Math.round(180 * t + 30);
//     b = Math.round(255 * (1 - t));
//   } else {
//     const t = Math.max(0, Math.min(1, (value - 23) / (26 - 23)));
//     r = Math.round(255 * t);
//     g = Math.round(210 * (1 - t));
//     b = 0;
//   }
//   return { fill: `rgb(${r},${g},${b})`, border: '#333' };
// };

// const getColorByMetric = (value, selectedMetric) => {
//   if (selectedMetric === 'lux')         return getLuxColor(value);
//   if (selectedMetric === 'temperature') return getTempColor(value);
//   if (selectedMetric === 'air') {
//     return value >= 4
//       ? { fill: '#5cd65c', border: '#2eb82e' }
//       : { fill: '#ff8080', border: '#cc0000' };
//   }
//   return { fill: '#999', border: '#666' };
// };

// const VALID_ZONES = new Set([
//   'Pit 5','Pit 7','Pit 13','Pit 15','Pit 16','Pit 17','Pit 18',
//   'Pit 19','Pit 20','Pit 21','Pit 22','Pit 30','Pit 31',
//   'Section 3','Section 4','Section 5','Section 6',
//   'Section 9','Section 10','Section 11','Section 12','Section 88',
// ]);

// const ZOOM_MIN  = 1;
// const ZOOM_MAX  = 5;
// const ZOOM_STEP = 0.25;

// const MONTHS = [
//   'January','February','March','April','May','June',
//   'July','August','September','October','November','December',
// ];

// const YEARS = ['2023','2024','2025','2026'];

// const MONTH_NUMBER = {
//   January:'01', February:'02', March:'03',    April:'04',
//   May:'05',     June:'06',     July:'07',     August:'08',
//   September:'09', October:'10', November:'11', December:'12',
// };

// const BACKEND = `${process.env.REACT_APP_BE_URL}`;

// const pointInPolygon = (px, py, points) => {
//   let inside = false;
//   for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
//     const xi = points[i][0], yi = points[i][1];
//     const xj = points[j][0], yj = points[j][1];
//     if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
//       inside = !inside;
//   }
//   return inside;
// };

// const drawPolygons = (canvas, displayWidth, displayHeight, sections, hoveredName = null, selectedMetric) => {
//   canvas.width  = displayWidth;
//   canvas.height = displayHeight;
//   const ctx = canvas.getContext('2d');
//   ctx.clearRect(0, 0, displayWidth, displayHeight);
//   const scaleX = displayWidth  / BASE_WIDTH;
//   const scaleY = displayHeight / BASE_HEIGHT;

//   sections.forEach((section) => {
//     if (!section.points || section.points.length < 3) return;
//     const scaled    = section.points.map(([x, y]) => [x * scaleX, y * scaleY]);
//     const isHovered = hoveredName === section.name;

//     const drawPath = () => {
//       ctx.beginPath();
//       ctx.moveTo(scaled[0][0], scaled[0][1]);
//       scaled.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
//       ctx.closePath();
//     };

//     drawPath();
//     ctx.globalAlpha = isHovered ? 0.8 : 0.6;
//     ctx.fillStyle = section.fill;
//     ctx.fill();
//     ctx.globalAlpha = 1;
//     drawPath();
//     ctx.strokeStyle = section.border;
//     ctx.lineWidth   = isHovered ? 4 : 2.5;
//     ctx.stroke();

//     let area = 0, cx = 0, cy = 0;
//     for (let i = 0, j = scaled.length - 1; i < scaled.length; j = i++) {
//       const cross = scaled[j][0] * scaled[i][1] - scaled[i][0] * scaled[j][1];
//       area += cross;
//       cx += (scaled[j][0] + scaled[i][0]) * cross;
//       cy += (scaled[j][1] + scaled[i][1]) * cross;
//     }
//     area /= 2;

//     if (Math.abs(area) < 1) {
//       const xs = scaled.map(p => p[0]);
//       const ys = scaled.map(p => p[1]);
//       section._cx = (Math.min(...xs) + Math.max(...xs)) / 2;
//       section._cy = (Math.min(...ys) + Math.max(...ys)) / 2;
//     } else {
//       section._cx = cx / (6 * area);
//       section._cy = cy / (6 * area);
//     }
//   });

//   const MIN_DIST = 24;
//   const labelPositions = sections
//     .filter(s => s.value !== undefined && s._cx !== undefined)
//     .map(s => ({ name: s.name, x: s._cx, y: s._cy }));

//   for (let iter = 0; iter < 40; iter++) {
//     let moved = false;
//     for (let i = 0; i < labelPositions.length; i++) {
//       for (let j = i + 1; j < labelPositions.length; j++) {
//         const a = labelPositions[i];
//         const b = labelPositions[j];
//         const dx = b.x - a.x; const dy = b.y - a.y;
//         const dist = Math.sqrt(dx * dx + dy * dy);
//         if (dist < MIN_DIST && dist > 0.01) {
//           const push = (MIN_DIST - dist) / 2;
//           const nx = dx / dist; const ny = dy / dist;
//           a.x -= nx * push; a.y -= ny * push;
//           b.x += nx * push; b.y += ny * push;
//           moved = true;
//         }
//       }
//     }
//     if (!moved) break;
//   }

//   sections.forEach((section) => {
//     if (section.value === undefined) return;
//     const pos = labelPositions.find(p => p.name === section.name);
//     if (!pos) return;

//     const isHovered = hoveredName === section.name;
//     ctx.save();
//     const fontSize = isHovered ? 18 : 11;
//     ctx.font = `900 ${fontSize}px Arial, sans-serif`;
//     ctx.textAlign    = 'center';
//     ctx.textBaseline = 'middle';
//     ctx.strokeStyle  = '#000000';
//     ctx.lineWidth    = 5;
//     ctx.lineJoin     = 'round';
//     ctx.fillStyle    = '#ffffff';

//     const displayValue = selectedMetric === 'lux'
//       ? String(Math.round(section.value))
//       : selectedMetric === 'temperature'
//         ? section.value.toFixed(1) + '°C'
//         : section.value.toFixed(1) + ' ACH';

//     ctx.strokeText(displayValue, pos.x, pos.y);
//     ctx.fillText(displayValue, pos.x, pos.y);
//     ctx.restore();
//   });
// };

// const MGMFloorPlanIntegrated = () => {
//   const [polyMap, setPolyMap]               = useState({});
//   const [luxData, setLuxData]               = useState({});
//   const [csvData, setCsvData]               = useState({});
//   const [achData, setAchData]               = useState({});
//   const [selectedMonth, setSelectedMonth]   = useState(MONTHS[new Date().getMonth()]);
//   const [selectedYear, setSelectedYear]     = useState('2025');
//   const [sections, setSections]             = useState([]);
//   const [tooltip, setTooltip]               = useState({ visible: false, name: '', x: 0, y: 0, color: '', value: null });
//   const [hoveredName, setHoveredName]       = useState(null);
//   const [zoom, setZoom]                     = useState(1);
//   const [pan, setPan]                       = useState({ x: 0, y: 0 });
//   const [selectedMetric, setSelectedMetric] = useState('lux');
//   const [loadingLux, setLoadingLux]         = useState(false);
//   const [luxError, setLuxError]             = useState(null);
//   const [loadingAch, setLoadingAch]         = useState(false);
//   const [achError, setAchError]             = useState(null);

//   const baseImgRef       = useRef();
//   const polygonCanvasRef = useRef();
//   const viewportRef      = useRef();
//   const sectionsRef      = useRef([]);
//   const zoomRef          = useRef(zoom);
//   const panRef           = useRef(pan);

//   useEffect(() => { sectionsRef.current = sections; }, [sections]);
//   useEffect(() => { zoomRef.current = zoom; },         [zoom]);
//   useEffect(() => { panRef.current = pan; },           [pan]);

//   // ── FIX 2: Clear tooltip & hover when month, year or metric changes ──────
//   useEffect(() => {
//     setHoveredName(null);
//     setTooltip(t => ({ ...t, visible: false }));
//   }, [selectedMonth, selectedYear, selectedMetric]);

//   // ── Load polygon CSV ─────────────────────────────────────────────────────
//   useEffect(() => {
//     Papa.parse('/Data/MGM_test_loc.csv', {
//       download: true, header: false, skipEmptyLines: true,
//       complete: (results) => {
//         const map = {};
//         results.data.forEach((row, i) => {
//           if (i === 0) return;
//           let name, x, y;
//           if (row.length >= 3) {
//             name = String(row[0]).replace(/^"+|"+$/g, '').trim();
//             x = parseFloat(row[1]); y = parseFloat(row[2]);
//           } else {
//             const raw   = String(row[0]).replace(/^"+|"+$/g, '').trim();
//             const parts = raw.split(',');
//             if (parts.length < 3) return;
//             y = parseFloat(parts.pop()); x = parseFloat(parts.pop());
//             name = parts.join(',').trim();
//           }
//           if (!name || isNaN(x) || isNaN(y)) return;
//           if (!VALID_ZONES.has(name)) return;
//           if (!map[name]) map[name] = [];
//           map[name].push([x, y]);
//         });
//         setPolyMap(map);
//       },
//     });
//   }, []);

//   // ── Load temperature from CSV ────────────────────────────────────────────
//   useEffect(() => {
//     Papa.parse('/Data/MGM_lux_data.csv', {
//       download: true, header: true, skipEmptyLines: true,
//       complete: (results) => {
//         const byLoc = {};
//         results.data.forEach((row) => {
//           const loc = (row.Location || '').trim();
//           if (!loc || !VALID_ZONES.has(loc)) return;
//           byLoc[loc] = {
//             temperature: parseFloat(row.Temperature),
//           };
//         });
//         setCsvData(byLoc);
//       },
//     });
//   }, []);

//   // ── Fetch lux from backend proxy when year or month changes ─────────────
//   useEffect(() => {
//     if (!selectedYear || !selectedMonth) return;

//     const monthNum = MONTH_NUMBER[selectedMonth];
//     const cacheKey = `${selectedYear}-${monthNum}`;

//     if (luxData[cacheKey]) return;

//     setLoadingLux(true);
//     setLuxError(null);

//     fetch(
//       `${BACKEND}/api/lux-level?year=${selectedYear}&month=${monthNum}`,
//       { credentials: 'include' }
//     )
//       .then((res) => {
//         if (res.status === 401) throw new Error('Not authenticated — please log in again.');
//         if (!res.ok)            throw new Error(`Server error: ${res.status}`);
//         return res.text();
//       })
//       .then((rawText) => {
//         const byLoc = {};
//         const lines = rawText.trim().split('\n');
//         const firstLine = lines[0] || '';
//         const startIdx  = firstLine.toLowerCase().includes('location') ? 1 : 0;

//         lines.slice(startIdx).forEach((line) => {
//           if (!line.trim()) return;
//           const cols = line.match(/("([^"]*)")|([^,]+)/g) || [];
//           const clean = cols.map(c => c.replace(/^"|"$/g, '').trim());
//           if (clean.length < 4) return;
//           const location = clean[2];
//           const luxVal   = parseFloat(clean[3]);
//           if (!location || isNaN(luxVal)) return;
//           if (!VALID_ZONES.has(location)) return;
//           byLoc[location] = luxVal;
//         });

//         setLuxData(prev => ({ ...prev, [cacheKey]: byLoc }));
//       })
//       .catch((err) => {
//         console.error('Lux API fetch failed:', err);
//         setLuxError(err.message);
//       })
//       .finally(() => setLoadingLux(false));

//   }, [selectedYear, selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ── Fetch ACH from backend proxy when year or month changes ─────────────
//   useEffect(() => {
//     if (!selectedYear || !selectedMonth) return;

//     const monthNum = MONTH_NUMBER[selectedMonth];
//     const cacheKey = `${selectedYear}-${monthNum}`;

//     if (achData[cacheKey]) return;

//     setLoadingAch(true);
//     setAchError(null);

//     fetch(
//       `${BACKEND}/api/ach-level?year=${selectedYear}&month=${monthNum}`,
//       { credentials: 'include' }
//     )
//       .then((res) => {
//         if (res.status === 401) throw new Error('Not authenticated — please log in again.');
//         if (!res.ok)            throw new Error(`Server error: ${res.status}`);
//         return res.text();
//       })
//       .then((rawText) => {
//         const byLoc = {};
//         const lines = rawText.trim().split('\n');
//         const firstLine = lines[0] || '';
//         const startIdx  = firstLine.toLowerCase().includes('location') ? 1 : 0;

//         lines.slice(startIdx).forEach((line) => {
//           if (!line.trim()) return;
//           const cols  = line.match(/("([^"]*)")|([^,]+)/g) || [];
//           const clean = cols.map(c => c.replace(/^"|"$/g, '').trim());
//           if (clean.length < 2) return;

//           const rawLoc = clean[0];
//           const achVal = parseFloat(clean[1]);
//           if (isNaN(achVal)) return;

//           // Normalize: "pit13" → "Pit 13", "section3" → "Section 3"
//           const normalized = rawLoc
//             .replace(/^pit(\d+)$/i,     (_, n) => `Pit ${n}`)
//             .replace(/^section(\d+)$/i, (_, n) => `Section ${n}`);

//           if (!VALID_ZONES.has(normalized)) return;
//           byLoc[normalized] = achVal;
//         });

//         setAchData(prev => ({ ...prev, [cacheKey]: byLoc }));
//       })
//       .catch((err) => {
//         console.error('ACH API fetch failed:', err);
//         setAchError(err.message);
//       })
//       .finally(() => setLoadingAch(false));

//   }, [selectedYear, selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ── FIX 1: achData added to dependency array ─────────────────────────────
//   useEffect(() => {
//     if (Object.keys(polyMap).length === 0) return;

//     const monthNum = MONTH_NUMBER[selectedMonth];
//     const cacheKey = `${selectedYear}-${monthNum}`;
//     const monthLux = luxData[cacheKey];
//     const monthAch = achData[cacheKey];

//     const built = Object.entries(polyMap)
//       .filter(([name]) => {
//         if (selectedMetric === 'lux')         return monthLux && monthLux[name] !== undefined;
//         if (selectedMetric === 'temperature') return csvData[name]?.temperature !== undefined;
//         if (selectedMetric === 'air')         return monthAch && monthAch[name] !== undefined;
//         return false;
//       })
//       .map(([name, points]) => {
//         let value;
//         if      (selectedMetric === 'lux')         value = monthLux[name];
//         else if (selectedMetric === 'temperature') value = csvData[name].temperature;
//         else                                       value = monthAch[name];

//         const colors = getColorByMetric(value, selectedMetric);
//         return { name, points, value, fill: colors.fill, border: colors.border };
//       });

//     setSections(built);
//   }, [selectedMonth, selectedYear, polyMap, luxData, achData, csvData, selectedMetric]); // FIX 1: achData in deps

//   // ── Draw ─────────────────────────────────────────────────────────────────
//   const drawAll = useCallback((hovered = null) => {
//     const img    = baseImgRef.current;
//     const canvas = polygonCanvasRef.current;
//     if (!img || !canvas || sectionsRef.current.length === 0) return;
//     drawPolygons(canvas, img.clientWidth, img.clientHeight, sectionsRef.current, hovered, selectedMetric);
//   }, [selectedMetric]);

//   useEffect(() => { drawAll(hoveredName); }, [sections, hoveredName, drawAll]);
//   useEffect(() => {
//     const onResize = () => drawAll(null);
//     window.addEventListener('resize', onResize);
//     return () => window.removeEventListener('resize', onResize);
//   }, [drawAll]);

//   // ── Wheel zoom ────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const vp = viewportRef.current;
//     if (!vp) return;
//     const onWheel = (e) => {
//       e.preventDefault();
//       const currentZoom = zoomRef.current;
//       const currentPan  = panRef.current;
//       const delta   = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
//       const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(currentZoom + delta).toFixed(2)));
//       if (newZoom === currentZoom) return;
//       const rect   = vp.getBoundingClientRect();
//       const mouseX = e.clientX - rect.left;
//       const mouseY = e.clientY - rect.top;
//       const imgX   = (mouseX - currentPan.x) / currentZoom;
//       const imgY   = (mouseY - currentPan.y) / currentZoom;
//       const newPanX = Math.min(0, Math.max(mouseX - imgX * newZoom, rect.width  - rect.width  * newZoom));
//       const newPanY = Math.min(0, Math.max(mouseY - imgY * newZoom, rect.height - rect.height * newZoom));
//       setZoom(newZoom);
//       setPan({ x: newPanX, y: newPanY });
//     };
//     vp.addEventListener('wheel', onWheel, { passive: false });
//     return () => vp.removeEventListener('wheel', onWheel);
//   }, []);

//   // ── FIX 3: Block tooltip while data is loading ───────────────────────────
//   const handleMouseMove = (e) => {
//     // Don't show tooltip while data is still loading for current metric
//     if (
//       (selectedMetric === 'lux' && loadingLux) ||
//       (selectedMetric === 'air' && loadingAch)
//     ) return;

//     const img = baseImgRef.current;
//     const vp  = viewportRef.current;
//     if (!img || !vp) return;
//     const vpRect   = vp.getBoundingClientRect();
//     const mouseVpX = e.clientX - vpRect.left;
//     const mouseVpY = e.clientY - vpRect.top;
//     const imgX = ((mouseVpX - pan.x) / zoom) * (BASE_WIDTH  / img.clientWidth);
//     const imgY = ((mouseVpY - pan.y) / zoom) * (BASE_HEIGHT / img.clientHeight);
//     let found = null;
//     for (const section of sectionsRef.current) {
//       if (!section.points || section.points.length < 3) continue;
//       if (pointInPolygon(imgX, imgY, section.points)) { found = section; break; }
//     }
//     if (found) {
//       setHoveredName(found.name);
//       setTooltip({ visible: true, name: found.name, color: found.fill, value: found.value, x: mouseVpX + 14, y: mouseVpY - 10 });
//     } else {
//       setHoveredName(null);
//       setTooltip(t => ({ ...t, visible: false }));
//     }
//   };

//   const handleMouseLeave = () => {
//     setHoveredName(null);
//     setTooltip(t => ({ ...t, visible: false }));
//   };

//   const METRIC_BUTTONS = [
//     { key: 'lux',         label: 'Lux Level' },
//     { key: 'temperature', label: 'Temperature' },
//     { key: 'air',         label: 'Air Change Rate' },
//   ];

//   const hasLuxForMonth = (monthName) => {
//     const key = `${selectedYear}-${MONTH_NUMBER[monthName]}`;
//     return !!luxData[key];
//   };

//   return (
//     <Box sx={{
//       width: '100%', height: '100vh',
//       display: 'flex', flexDirection: 'column',
//       overflow: 'hidden', backgroundColor: 'transparent',
//       margin: '130px 0px 0px 80px',
//     }}>
//       <Box
//         ref={viewportRef}
//         onMouseMove={handleMouseMove}
//         onMouseLeave={handleMouseLeave}
//         sx={{ position: 'relative', flex: 1, overflow: 'hidden', cursor: hoveredName ? 'pointer' : 'default', userSelect: 'none' }}
//       >
//         {/* Zoom + pan layer */}
//         <Box sx={{
//           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
//           transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
//           transformOrigin: '0 0', willChange: 'transform',
//         }}>
//           <img
//             ref={baseImgRef} src={baseImage} onLoad={() => drawAll()}
//             style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0, pointerEvents: 'none' }}
//             alt="Base Floor Plan"
//           />
//           <canvas
//             ref={polygonCanvasRef}
//             style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}
//           />
//         </Box>

//         {/* ── Metric Toggle Buttons ── */}
//         <Box sx={{
//           position: 'absolute', top: 20, left: 550, zIndex: 400,
//           display: 'flex', gap: 0.5,
//           backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
//           border: '1px solid rgba(200,168,0,0.35)', borderRadius: '10px',
//           p: '4px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
//         }}>
//           {METRIC_BUTTONS.map(({ key, label }) => {
//             const isActive = selectedMetric === key;
//             return (
//               <Box key={key} onClick={() => setSelectedMetric(key)} sx={{
//                 px: 2.2, py: 0.65, borderRadius: '7px',
//                 fontSize: '0.76rem', fontWeight: isActive ? 700 : 500,
//                 letterSpacing: 0.3, cursor: 'pointer', transition: 'all 0.18s ease',
//                 background: isActive ? 'linear-gradient(135deg, #C8A800 0%, #8B6B00 100%)' : 'transparent',
//                 color: isActive ? '#fff' : '#555',
//                 boxShadow: isActive ? '0 2px 8px rgba(180,130,0,0.45), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
//                 border: isActive ? 'none' : '1px solid transparent',
//                 '&:hover': { backgroundColor: isActive ? undefined : 'rgba(200,168,0,0.12)', color: isActive ? '#fff' : '#8B6B00' },
//                 userSelect: 'none',
//               }}>
//                 {label}
//               </Box>
//             );
//           })}
//         </Box>

//         {/* ── Top bar: Year + Month + status ── */}
//         <Box sx={{
//           display: 'flex', alignItems: 'center', gap: 1,
//           px: 1.5, py: 0.75, flexShrink: 0,
//           backgroundColor: 'rgba(255,255,255,0.9)',
//           borderBottom: '1px solid #ddd',
//         }}>
//           <Box sx={{ width: '1px', height: 24, backgroundColor: '#ddd', mx: 1, ml: 180 }} />

//           <Typography sx={{ color: '#555', fontSize: '0.75rem', fontWeight: 'bold', mr: 0.5 }}>Year:</Typography>
//           <FormControl size="small" sx={{ minWidth: 100 }}>
//             <Select
//               value={selectedYear}
//               onChange={(e) => setSelectedYear(e.target.value)}
//               sx={{
//                 fontSize: '0.78rem', height: 32, backgroundColor: '#fff',
//                 '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
//                 '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
//               }}
//             >
//               {YEARS.map((y) => <MenuItem key={y} value={y} sx={{ fontSize: '0.78rem' }}>{y}</MenuItem>)}
//             </Select>
//           </FormControl>

//           <Typography sx={{ color: '#555', fontSize: '0.75rem', fontWeight: 'bold', mr: 0.5 }}>Month:</Typography>
//           <FormControl size="small" sx={{ minWidth: 130 }}>
//             <Select
//               value={selectedMonth}
//               onChange={(e) => setSelectedMonth(e.target.value)}
//               sx={{
//                 fontSize: '0.78rem', height: 32, backgroundColor: '#fff',
//                 '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
//                 '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
//               }}
//             >
//               {MONTHS.map((m) => (
//                 <MenuItem key={m} value={m} sx={{ fontSize: '0.78rem', color: hasLuxForMonth(m) ? '#111' : '#aaa' }}>
//                   {m}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           {/* Loading / error status */}
//           {loadingLux && selectedMetric === 'lux' && (
//             <Typography sx={{ color: '#C8A800', fontSize: '0.72rem', ml: 1, fontStyle: 'italic' }}>
//               Loading lux data…
//             </Typography>
//           )}
//           {luxError && !loadingLux && selectedMetric === 'lux' && (
//             <Typography sx={{ color: '#d32f2f', fontSize: '0.72rem', ml: 1 }}>
//               {luxError}
//             </Typography>
//           )}
//           {loadingAch && selectedMetric === 'air' && (
//             <Typography sx={{ color: '#C8A800', fontSize: '0.72rem', ml: 1, fontStyle: 'italic' }}>
//               Loading ACH data…
//             </Typography>
//           )}
//           {achError && !loadingAch && selectedMetric === 'air' && (
//             <Typography sx={{ color: '#d32f2f', fontSize: '0.72rem', ml: 1 }}>
//               {achError}
//             </Typography>
//           )}
//         </Box>

//         {/* ── Legend ── */}
//         <Box sx={{
//           position: 'absolute', top: 16, left: 16, zIndex: 300,
//           backgroundColor: 'rgba(255, 245, 200, 0.95)',
//           border: '2px solid #C8A800', borderRadius: '6px',
//           px: 1.5, py: 1, boxShadow: '0 2px 12px rgba(0,0,0,0.3)', minWidth: 500,
//         }}>
//           <Typography sx={{ color: '#8B6800', fontWeight: 'bold', fontSize: '0.72rem', mb: 0.75, letterSpacing: 0.5, textDecoration: 'underline' }}>
//             {selectedMetric === 'lux'         && 'Lux Level Legend'}
//             {selectedMetric === 'temperature' && 'Temperature Legend'}
//             {selectedMetric === 'air'         && 'ACH Legend'}
//           </Typography>
//           <Box sx={{ display: 'flex', gap: 0.75, width: '100%' }}>
//             {selectedMetric === 'lux' && LUX_LEVELS.map((l) => (
//               <Box key={l.label} sx={{
//                 flex: 1, textAlign: 'center', backgroundColor: l.fill,
//                 border: '2px solid rgba(0,0,0,0.2)', borderRadius: '4px', py: 0.5,
//               }}>
//                 <Typography sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 'bold' }}>{l.label}</Typography>
//               </Box>
//             ))}
//             {selectedMetric === 'temperature' && (
//               <Box sx={{ width: '100%', position: 'relative', px: 1, pt: 3, pb: 0.5 }}>
//                 {[{ label: '26°C', left: '0%' }, { label: '23°C', left: '50%' }, { label: '20°C', left: '100%' }].map((item) => (
//                   <Box key={item.label} sx={{ position: 'absolute', top: 0, left: item.left, transform: 'translateX(-50%)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#444', lineHeight: 1.2 }}>{item.label}</Typography>
//                     <Box sx={{ height: 8, width: '2px', backgroundColor: '#555', mt: '2px' }} />
//                   </Box>
//                 ))}
//                 <Box sx={{ height: 18, borderRadius: '4px', background: 'linear-gradient(to right, #FF2200, #FF8800, #FFDD00, #00CC44, #00CCCC, #0044FF)', border: '1px solid #999' }} />
//               </Box>
//             )}
//             {selectedMetric === 'air' && (
//               <>
//                 <Box sx={{ flex: 1, textAlign: 'center', backgroundColor: '#ff8080', borderRadius: '4px', py: 0.5, fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>Less than 4 ACH</Box>
//                 <Box sx={{ flex: 1, textAlign: 'center', backgroundColor: '#5cd65c', borderRadius: '4px', py: 0.5, fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>Greater than 4 ACH</Box>
//               </>
//             )}
//           </Box>
//         </Box>

//         {/* ── Tooltip ── */}
//         {tooltip.visible && (
//           <Box sx={{
//             position: 'absolute', left: tooltip.x, top: tooltip.y,
//             zIndex: 400, pointerEvents: 'none', backgroundColor: '#ffffff',
//             border: `2px solid ${tooltip.color}`, borderRadius: '8px', px: 1.5, py: 1,
//             boxShadow: '0 4px 16px rgba(0,0,0,0.15)', minWidth: 160,
//           }}>
//             <Typography sx={{ color: '#111', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: 0.3 }}>
//               {tooltip.name}
//             </Typography>
//             {tooltip.value !== null && (
//               <Typography sx={{ fontSize: '0.82rem', color: '#333' }}>
//                 {selectedMetric === 'lux'         && Math.round(tooltip.value) + ' lux'}
//                 {selectedMetric === 'temperature' && tooltip.value.toFixed(1) + ' °C'}
//                 {selectedMetric === 'air'         && tooltip.value.toFixed(1) + ' ACH'}
//               </Typography>
//             )}
//             <Typography sx={{ color: '#999', fontSize: '0.68rem', mt: 0.3 }}>
//               {selectedMonth} {selectedYear}
//             </Typography>
//           </Box>
//         )}
//       </Box>
//     </Box>
//   );
// };

// export default MGMFloorPlanIntegrated;



import React, { useEffect, useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { Box, Typography, Select, MenuItem, FormControl } from '@mui/material';
import baseImage from '../assets/mgm_macau_l1.JPG';

const BASE_WIDTH  = 4000;
const BASE_HEIGHT = 2500;

const LUX_LEVELS = [
  { label: 'Under 150',    min: 0,   max: 149,      fill: '#FF2233', border: '#CC0011' },
  { label: '150 - 200',    min: 150, max: 200,      fill: '#FF7700', border: '#CC5500' },
  { label: '201 - 250',    min: 201, max: 250,      fill: '#FFD000', border: '#CC9900' },
  { label: '250 or above', min: 251, max: Infinity, fill: '#11CC44', border: '#009933' },
];

const getLuxColor = (lux) =>
  LUX_LEVELS.find(l => lux >= l.min && lux <= l.max) || LUX_LEVELS[0];

const getTempColor = (value) => {
  let r, g, b;
  if (value <= 23) {
    const t = Math.max(0, Math.min(1, (value - 20) / (23 - 20)));
    r = 0;
    g = Math.round(180 * t + 30);
    b = Math.round(255 * (1 - t));
  } else {
    const t = Math.max(0, Math.min(1, (value - 23) / (26 - 23)));
    r = Math.round(255 * t);
    g = Math.round(210 * (1 - t));
    b = 0;
  }
  return { fill: `rgb(${r},${g},${b})`, border: '#333' };
};

const getColorByMetric = (value, selectedMetric) => {
  if (selectedMetric === 'lux')         return getLuxColor(value);
  if (selectedMetric === 'temperature') return getTempColor(value);
  if (selectedMetric === 'air') {
    return value >= 4
      ? { fill: '#5cd65c', border: '#2eb82e' }
      : { fill: '#ff8080', border: '#cc0000' };
  }
  return { fill: '#999', border: '#666' };
};

const VALID_ZONES = new Set([
  'Pit 5','Pit 7','Pit 13','Pit 15','Pit 16','Pit 17','Pit 18','Pit 13 & Pit 15',
  'Pit 19','Pit 20','Pit 21','Pit 22','Pit 30','Pit 31',
  'Section 3','Section 4','Section 5','Section 6',
  'Section 9','Section 10','Section 11','Section 12','Section 88',
]);

const ZOOM_MIN  = 1;
const ZOOM_MAX  = 5;
const ZOOM_STEP = 0.25;

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const YEARS = ['2023','2024','2025','2026'];

const MONTH_NUMBER = {
  January:'01', February:'02', March:'03',    April:'04',
  May:'05',     June:'06',     July:'07',     August:'08',
  September:'09', October:'10', November:'11', December:'12',
};

const BACKEND = `${process.env.REACT_APP_BE_URL}`;

const pointInPolygon = (px, py, points) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0], yi = points[i][1];
    const xj = points[j][0], yj = points[j][1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
};

const drawPolygons = (canvas, displayWidth, displayHeight, sections, hoveredName = null, selectedMetric) => {
  canvas.width  = displayWidth;
  canvas.height = displayHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  const scaleX = displayWidth  / BASE_WIDTH;
  const scaleY = displayHeight / BASE_HEIGHT;

  sections.forEach((section) => {
    if (!section.points || section.points.length < 3) return;
    const scaled    = section.points.map(([x, y]) => [x * scaleX, y * scaleY]);
    const isHovered = hoveredName === section.name;

    const drawPath = () => {
      ctx.beginPath();
      ctx.moveTo(scaled[0][0], scaled[0][1]);
      scaled.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.closePath();
    };

    drawPath();
    ctx.globalAlpha = isHovered ? 0.8 : 0.6;
    ctx.fillStyle = section.fill;
    ctx.fill();
    ctx.globalAlpha = 1;
    drawPath();
    ctx.strokeStyle = section.border;
    ctx.lineWidth   = isHovered ? 4 : 2.5;
    ctx.stroke();

    let area = 0, cx = 0, cy = 0;
    for (let i = 0, j = scaled.length - 1; i < scaled.length; j = i++) {
      const cross = scaled[j][0] * scaled[i][1] - scaled[i][0] * scaled[j][1];
      area += cross;
      cx += (scaled[j][0] + scaled[i][0]) * cross;
      cy += (scaled[j][1] + scaled[i][1]) * cross;
    }
    area /= 2;

    if (Math.abs(area) < 1) {
      const xs = scaled.map(p => p[0]);
      const ys = scaled.map(p => p[1]);
      section._cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      section._cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    } else {
      section._cx = cx / (6 * area);
      section._cy = cy / (6 * area);
    }
  });

  const MIN_DIST = 24;
  const labelPositions = sections
    .filter(s => s.value !== undefined && s._cx !== undefined)
    .map(s => ({ name: s.name, x: s._cx, y: s._cy }));

  for (let iter = 0; iter < 40; iter++) {
    let moved = false;
    for (let i = 0; i < labelPositions.length; i++) {
      for (let j = i + 1; j < labelPositions.length; j++) {
        const a = labelPositions[i];
        const b = labelPositions[j];
        const dx = b.x - a.x; const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MIN_DIST && dist > 0.01) {
          const push = (MIN_DIST - dist) / 2;
          const nx = dx / dist; const ny = dy / dist;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  sections.forEach((section) => {
    if (section.value === undefined) return;
    const pos = labelPositions.find(p => p.name === section.name);
    if (!pos) return;

    const isHovered = hoveredName === section.name;
    ctx.save();
    const fontSize = isHovered ? 18 : 11;
    ctx.font = `900 ${fontSize}px Arial, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle  = '#000000';
    ctx.lineWidth    = 5;
    ctx.lineJoin     = 'round';
    ctx.fillStyle    = '#ffffff';

    const displayValue = selectedMetric === 'lux'
      ? String(Math.round(section.value))
      : selectedMetric === 'temperature'
        ? section.value.toFixed(1) + '°C'
        : section.value.toFixed(1) + ' ACH';

    ctx.strokeText(displayValue, pos.x, pos.y);
    ctx.fillText(displayValue, pos.x, pos.y);
    ctx.restore();
  });
};

const MGMFloorPlanIntegrated = () => {
  const [polyMap, setPolyMap]               = useState({});
  const [luxData, setLuxData]               = useState({});
  const [tempData, setTempData]             = useState({});  // replaces static csvData
  const [achData, setAchData]               = useState({});
  const [selectedMonth, setSelectedMonth]   = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear]     = useState('2025');
  const [sections, setSections]             = useState([]);
  const [tooltip, setTooltip]               = useState({ visible: false, name: '', x: 0, y: 0, color: '', value: null });
  const [hoveredName, setHoveredName]       = useState(null);
  const [zoom, setZoom]                     = useState(1);
  const [pan, setPan]                       = useState({ x: 0, y: 0 });
  const [selectedMetric, setSelectedMetric] = useState('lux');
  const [loadingLux, setLoadingLux]         = useState(false);
  const [luxError, setLuxError]             = useState(null);
  const [loadingTemp, setLoadingTemp]       = useState(false);
  const [tempError, setTempError]           = useState(null);
  const [loadingAch, setLoadingAch]         = useState(false);
  const [achError, setAchError]             = useState(null);

  const baseImgRef       = useRef();
  const polygonCanvasRef = useRef();
  const viewportRef      = useRef();
  const sectionsRef      = useRef([]);
  const zoomRef          = useRef(zoom);
  const panRef           = useRef(pan);

  useEffect(() => { sectionsRef.current = sections; }, [sections]);
  useEffect(() => { zoomRef.current = zoom; },         [zoom]);
  useEffect(() => { panRef.current = pan; },           [pan]);

  // Clear tooltip & hover when month, year or metric changes
  useEffect(() => {
    setHoveredName(null);
    setTooltip(t => ({ ...t, visible: false }));
  }, [selectedMonth, selectedYear, selectedMetric]);

  // ── Load polygon CSV ─────────────────────────────────────────────────────
  useEffect(() => {
    Papa.parse('/Data/MGM_test_loc.csv', {
      download: true, header: false, skipEmptyLines: true,
      complete: (results) => {
        const map = {};
        results.data.forEach((row, i) => {
          if (i === 0) return;
          let name, x, y;
          if (row.length >= 3) {
            name = String(row[0]).replace(/^"+|"+$/g, '').trim();
            x = parseFloat(row[1]); y = parseFloat(row[2]);
          } else {
            const raw   = String(row[0]).replace(/^"+|"+$/g, '').trim();
            const parts = raw.split(',');
            if (parts.length < 3) return;
            y = parseFloat(parts.pop()); x = parseFloat(parts.pop());
            name = parts.join(',').trim();
          }
          if (!name || isNaN(x) || isNaN(y)) return;
          if (!VALID_ZONES.has(name)) return;
          if (!map[name]) map[name] = [];
          map[name].push([x, y]);
        });
        setPolyMap(map);
      },
    });
  }, []);

  // ── Fetch lux from backend when year or month changes ───────────────────
  useEffect(() => {
    if (!selectedYear || !selectedMonth) return;

    const monthNum = MONTH_NUMBER[selectedMonth];
    const cacheKey = `${selectedYear}-${monthNum}`;

    if (luxData[cacheKey]) return;

    setLoadingLux(true);
    setLuxError(null);

    fetch(
      `${BACKEND}/api/lux-level?year=${selectedYear}&month=${monthNum}`,
      { credentials: 'include' }
    )
      .then((res) => {
        if (res.status === 401) throw new Error('Not authenticated — please log in again.');
        if (!res.ok)            throw new Error(`Server error: ${res.status}`);
        return res.text();
      })
      .then((rawText) => {
        const byLoc = {};
        const lines = rawText.trim().split('\n');
        const firstLine = lines[0] || '';
        const startIdx  = firstLine.toLowerCase().includes('location') ? 1 : 0;

        lines.slice(startIdx).forEach((line) => {
          if (!line.trim()) return;
          const cols = line.match(/("([^"]*)")|([^,]+)/g) || [];
          const clean = cols.map(c => c.replace(/^"|"$/g, '').trim());
          if (clean.length < 4) return;
          const location = clean[2];
          const luxVal   = parseFloat(clean[3]);
          if (!location || isNaN(luxVal)) return;
          if (!VALID_ZONES.has(location)) return;
          byLoc[location] = luxVal;
        });

        setLuxData(prev => ({ ...prev, [cacheKey]: byLoc }));
      })
      .catch((err) => {
        console.error('Lux API fetch failed:', err);
        setLuxError(err.message);
      })
      .finally(() => setLoadingLux(false));

  }, [selectedYear, selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch temperature from backend when year or month changes ────────────
  useEffect(() => {
    if (!selectedYear || !selectedMonth) return;

    const monthNum = MONTH_NUMBER[selectedMonth];
    const cacheKey = `${selectedYear}-${monthNum}`;

    if (tempData[cacheKey]) return;

    setLoadingTemp(true);
    setTempError(null);

    fetch(
      `${BACKEND}/api/temperature-level?year=${selectedYear}&month=${monthNum}`,
      { credentials: 'include' }
    )
      .then((res) => {
        if (res.status === 401) throw new Error('Not authenticated — please log in again.');
        if (!res.ok)            throw new Error(`Server error: ${res.status}`);
        return res.text();
      })
      .then((rawText) => {
        const byLoc = {};
        const lines = rawText.trim().split('\n');
        const firstLine = lines[0] || '';
        const startIdx  = firstLine.toLowerCase().includes('location') ? 1 : 0;

        // Row format: 2025-01-01,"Pit 13 & Pit 15","L1",24.52°C
        // Columns:    [0]=date  [1]=location        [2]=floor [3]=avg_temperature
        lines.slice(startIdx).forEach((line) => {
          if (!line.trim()) return;
          const cols  = line.match(/("([^"]*)")|([^,]+)/g) || [];
          const clean = cols.map(c => c.replace(/^"|"$/g, '').trim());
          if (clean.length < 4) return;

      const location = clean[1];
const tempVal = parseFloat(clean[3]);

if (!location || isNaN(tempVal)) return;

const locations = location.split('&').map(loc => loc.trim());

locations.forEach((loc) => {
  if (!VALID_ZONES.has(loc)) return;

  byLoc[loc] = tempVal;
});

          // Keep the average if the same location appears more than once in the month
          if (byLoc[location] !== undefined) {
            byLoc[location] = (byLoc[location] + tempVal) / 2;
          } else {
          location.split('&').forEach(loc => {
   const cleanLoc = loc.trim();

   if (VALID_ZONES.has(cleanLoc)) {
      byLoc[cleanLoc] = tempVal;
   }
});
          }
        });

        setTempData(prev => ({ ...prev, [cacheKey]: byLoc }));
      })
      .catch((err) => {
        console.error('Temperature API fetch failed:', err);
        setTempError(err.message);
      })
      .finally(() => setLoadingTemp(false));

  }, [selectedYear, selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch ACH from backend when year or month changes ───────────────────
  useEffect(() => {
    if (!selectedYear || !selectedMonth) return;

    const monthNum = MONTH_NUMBER[selectedMonth];
    const cacheKey = `${selectedYear}-${monthNum}`;

    if (achData[cacheKey]) return;

    setLoadingAch(true);
    setAchError(null);

    fetch(
      `${BACKEND}/api/ach-level?year=${selectedYear}&month=${monthNum}`,
      { credentials: 'include' }
    )
      .then((res) => {
        if (res.status === 401) throw new Error('Not authenticated — please log in again.');
        if (!res.ok)            throw new Error(`Server error: ${res.status}`);
        return res.text();
      })
      .then((rawText) => {
        const byLoc = {};
        const lines = rawText.trim().split('\n');
        const firstLine = lines[0] || '';
        const startIdx  = firstLine.toLowerCase().includes('location') ? 1 : 0;

        lines.slice(startIdx).forEach((line) => {
          if (!line.trim()) return;
          const cols  = line.match(/("([^"]*)")|([^,]+)/g) || [];
          const clean = cols.map(c => c.replace(/^"|"$/g, '').trim());
          if (clean.length < 2) return;

          const rawLoc = clean[0];
          const achVal = parseFloat(clean[1]);
          if (isNaN(achVal)) return;

          const normalized = rawLoc
            .replace(/^pit(\d+)$/i,     (_, n) => `Pit ${n}`)
            .replace(/^section(\d+)$/i, (_, n) => `Section ${n}`);

          if (!VALID_ZONES.has(normalized)) return;
          byLoc[normalized] = achVal;
        });

        setAchData(prev => ({ ...prev, [cacheKey]: byLoc }));
      })
      .catch((err) => {
        console.error('ACH API fetch failed:', err);
        setAchError(err.message);
      })
      .finally(() => setLoadingAch(false));

  }, [selectedYear, selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build sections whenever data or metric changes ───────────────────────
  useEffect(() => {
    if (Object.keys(polyMap).length === 0) return;

    const monthNum = MONTH_NUMBER[selectedMonth];
    const cacheKey = `${selectedYear}-${monthNum}`;
    const monthLux  = luxData[cacheKey];
    const monthTemp = tempData[cacheKey];
    const monthAch  = achData[cacheKey];

    const built = Object.entries(polyMap)
      .filter(([name]) => {
        if (selectedMetric === 'lux')         return monthLux  && monthLux[name]  !== undefined;
        if (selectedMetric === 'temperature') return monthTemp && monthTemp[name] !== undefined;
        if (selectedMetric === 'air')         return monthAch  && monthAch[name]  !== undefined;
        return false;
      })
      .map(([name, points]) => {
        let value;
        if      (selectedMetric === 'lux')         value = monthLux[name];
        else if (selectedMetric === 'temperature') value = monthTemp[name];
        else                                       value = monthAch[name];

        const colors = getColorByMetric(value, selectedMetric);
        return { name, points, value, fill: colors.fill, border: colors.border };
      });

    setSections(built);
  }, [selectedMonth, selectedYear, polyMap, luxData, tempData, achData, selectedMetric]);

  // ── Draw ─────────────────────────────────────────────────────────────────
  const drawAll = useCallback((hovered = null) => {
    const img    = baseImgRef.current;
    const canvas = polygonCanvasRef.current;
    if (!img || !canvas || sectionsRef.current.length === 0) return;
    drawPolygons(canvas, img.clientWidth, img.clientHeight, sectionsRef.current, hovered, selectedMetric);
  }, [selectedMetric]);

  useEffect(() => { drawAll(hoveredName); }, [sections, hoveredName, drawAll]);
  useEffect(() => {
    const onResize = () => drawAll(null);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [drawAll]);

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e) => {
      e.preventDefault();
      const currentZoom = zoomRef.current;
      const currentPan  = panRef.current;
      const delta   = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(currentZoom + delta).toFixed(2)));
      if (newZoom === currentZoom) return;
      const rect   = vp.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const imgX   = (mouseX - currentPan.x) / currentZoom;
      const imgY   = (mouseY - currentPan.y) / currentZoom;
      const newPanX = Math.min(0, Math.max(mouseX - imgX * newZoom, rect.width  - rect.width  * newZoom));
      const newPanY = Math.min(0, Math.max(mouseY - imgY * newZoom, rect.height - rect.height * newZoom));
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, []);

  // ── Mouse move — tooltip & hover ─────────────────────────────────────────
  const handleMouseMove = (e) => {
    // Block tooltip while data is still loading for the active metric
    if (
      (selectedMetric === 'lux'         && loadingLux)  ||
      (selectedMetric === 'temperature' && loadingTemp) ||
      (selectedMetric === 'air'         && loadingAch)
    ) return;

    const img = baseImgRef.current;
    const vp  = viewportRef.current;
    if (!img || !vp) return;
    const vpRect   = vp.getBoundingClientRect();
    const mouseVpX = e.clientX - vpRect.left;
    const mouseVpY = e.clientY - vpRect.top;
    const imgX = ((mouseVpX - pan.x) / zoom) * (BASE_WIDTH  / img.clientWidth);
    const imgY = ((mouseVpY - pan.y) / zoom) * (BASE_HEIGHT / img.clientHeight);
    let found = null;
    for (const section of sectionsRef.current) {
      if (!section.points || section.points.length < 3) continue;
      if (pointInPolygon(imgX, imgY, section.points)) { found = section; break; }
    }
    if (found) {
      setHoveredName(found.name);
      setTooltip({ visible: true, name: found.name, color: found.fill, value: found.value, x: mouseVpX + 14, y: mouseVpY - 10 });
    } else {
      setHoveredName(null);
      setTooltip(t => ({ ...t, visible: false }));
    }
  };

  const handleMouseLeave = () => {
    setHoveredName(null);
    setTooltip(t => ({ ...t, visible: false }));
  };

  const METRIC_BUTTONS = [
    { key: 'lux',         label: 'Lux Level' },
    { key: 'temperature', label: 'Temperature' },
    { key: 'air',         label: 'Air Change Rate' },
  ];

  const hasLuxForMonth = (monthName) => {
    const key = `${selectedYear}-${MONTH_NUMBER[monthName]}`;
    return !!luxData[key];
  };

  return (
    <Box sx={{
      width: '100%', height: '100vh',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', backgroundColor: 'transparent',
      margin: '130px 0px 0px 80px',
    }}>
      <Box
        ref={viewportRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        sx={{ position: 'relative', flex: 1, overflow: 'hidden', cursor: hoveredName ? 'pointer' : 'default', userSelect: 'none' }}
      >
        {/* Zoom + pan layer */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0', willChange: 'transform',
        }}>
          <img
            ref={baseImgRef} src={baseImage} onLoad={() => drawAll()}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0, pointerEvents: 'none' }}
            alt="Base Floor Plan"
          />
          <canvas
            ref={polygonCanvasRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}
          />
        </Box>

        {/* ── Metric Toggle Buttons ── */}
        <Box sx={{
          position: 'absolute', top: 20, left: 550, zIndex: 400,
          display: 'flex', gap: 0.5,
          backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
          border: '1px solid rgba(200,168,0,0.35)', borderRadius: '10px',
          p: '4px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}>
          {METRIC_BUTTONS.map(({ key, label }) => {
            const isActive = selectedMetric === key;
            return (
              <Box key={key} onClick={() => setSelectedMetric(key)} sx={{
                px: 2.2, py: 0.65, borderRadius: '7px',
                fontSize: '0.76rem', fontWeight: isActive ? 700 : 500,
                letterSpacing: 0.3, cursor: 'pointer', transition: 'all 0.18s ease',
                background: isActive ? 'linear-gradient(135deg, #C8A800 0%, #8B6B00 100%)' : 'transparent',
                color: isActive ? '#fff' : '#555',
                boxShadow: isActive ? '0 2px 8px rgba(180,130,0,0.45), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                border: isActive ? 'none' : '1px solid transparent',
                '&:hover': { backgroundColor: isActive ? undefined : 'rgba(200,168,0,0.12)', color: isActive ? '#fff' : '#8B6B00' },
                userSelect: 'none',
              }}>
                {label}
              </Box>
            );
          })}
        </Box>

        {/* ── Top bar: Year + Month + status ── */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 1.5, py: 0.75, flexShrink: 0,
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderBottom: '1px solid #ddd',
        }}>
          <Box sx={{ width: '1px', height: 24, backgroundColor: '#ddd', mx: 1, ml: 180 }} />

          <Typography sx={{ color: '#555', fontSize: '0.75rem', fontWeight: 'bold', mr: 0.5 }}>Year:</Typography>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              sx={{
                fontSize: '0.78rem', height: 32, backgroundColor: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
              }}
            >
              {YEARS.map((y) => <MenuItem key={y} value={y} sx={{ fontSize: '0.78rem' }}>{y}</MenuItem>)}
            </Select>
          </FormControl>

          <Typography sx={{ color: '#555', fontSize: '0.75rem', fontWeight: 'bold', mr: 0.5 }}>Month:</Typography>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              sx={{
                fontSize: '0.78rem', height: 32, backgroundColor: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
              }}
            >
              {MONTHS.map((m) => (
                <MenuItem key={m} value={m} sx={{ fontSize: '0.78rem', color: hasLuxForMonth(m) ? '#111' : '#aaa' }}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Loading / error status */}
          {loadingLux && selectedMetric === 'lux' && (
            <Typography sx={{ color: '#C8A800', fontSize: '0.72rem', ml: 1, fontStyle: 'italic' }}>
              Loading lux data…
            </Typography>
          )}
          {luxError && !loadingLux && selectedMetric === 'lux' && (
            <Typography sx={{ color: '#d32f2f', fontSize: '0.72rem', ml: 1 }}>
              {luxError}
            </Typography>
          )}
          {loadingTemp && selectedMetric === 'temperature' && (
            <Typography sx={{ color: '#C8A800', fontSize: '0.72rem', ml: 1, fontStyle: 'italic' }}>
              Loading temperature data…
            </Typography>
          )}
          {tempError && !loadingTemp && selectedMetric === 'temperature' && (
            <Typography sx={{ color: '#d32f2f', fontSize: '0.72rem', ml: 1 }}>
              {tempError}
            </Typography>
          )}
          {loadingAch && selectedMetric === 'air' && (
            <Typography sx={{ color: '#C8A800', fontSize: '0.72rem', ml: 1, fontStyle: 'italic' }}>
              Loading ACH data…
            </Typography>
          )}
          {achError && !loadingAch && selectedMetric === 'air' && (
            <Typography sx={{ color: '#d32f2f', fontSize: '0.72rem', ml: 1 }}>
              {achError}
            </Typography>
          )}
        </Box>

        {/* ── Legend ── */}
        <Box sx={{
          position: 'absolute', top: 16, left: 16, zIndex: 300,
          backgroundColor: 'rgba(255, 245, 200, 0.95)',
          border: '2px solid #C8A800', borderRadius: '6px',
          px: 1.5, py: 1, boxShadow: '0 2px 12px rgba(0,0,0,0.3)', minWidth: 500,
        }}>
          <Typography sx={{ color: '#8B6800', fontWeight: 'bold', fontSize: '0.72rem', mb: 0.75, letterSpacing: 0.5, textDecoration: 'underline' }}>
            {selectedMetric === 'lux'         && 'Lux Level Legend'}
            {selectedMetric === 'temperature' && 'Temperature Legend'}
            {selectedMetric === 'air'         && 'ACH Legend'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, width: '100%' }}>
            {selectedMetric === 'lux' && LUX_LEVELS.map((l) => (
              <Box key={l.label} sx={{
                flex: 1, textAlign: 'center', backgroundColor: l.fill,
                border: '2px solid rgba(0,0,0,0.2)', borderRadius: '4px', py: 0.5,
              }}>
                <Typography sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 'bold' }}>{l.label}</Typography>
              </Box>
            ))}
           {selectedMetric === 'temperature' && (
  <Box sx={{ width: '100%', position: 'relative', px: 1, pb: 0.5 }}>
    {/* Labels + tick marks above the bar */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: '2px' }}>
      {[{ label: '26°C' }, { label: '23°C' }, { label: '20°C' }].map((item) => (
        <Box key={item.label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#444', lineHeight: 1.2 }}>
            {item.label}
          </Typography>
          <Box sx={{ height: 6, width: '1.5px', backgroundColor: '#555' }} />
        </Box>
      ))}
    </Box>
    {/* Gradient bar */}
    <Box sx={{
      height: 18, borderRadius: '4px',
      background: 'linear-gradient(to right, #FF2200, #FF8800, #FFDD00, #00CC44, #00CCCC, #0044FF)',
      border: '1px solid #999'
    }} />
  </Box>
)}
            {selectedMetric === 'air' && (
              <>
                <Box sx={{ flex: 1, textAlign: 'center', backgroundColor: '#ff8080', borderRadius: '4px', py: 0.5, fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>Less than 4 ACH</Box>
                <Box sx={{ flex: 1, textAlign: 'center', backgroundColor: '#5cd65c', borderRadius: '4px', py: 0.5, fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>Greater than 4 ACH</Box>
              </>
            )}
          </Box>
        </Box>

        {/* ── Tooltip ── */}
        {tooltip.visible && (
          <Box sx={{
            position: 'absolute', left: tooltip.x, top: tooltip.y,
            zIndex: 400, pointerEvents: 'none', backgroundColor: '#ffffff',
            border: `2px solid ${tooltip.color}`, borderRadius: '8px', px: 1.5, py: 1,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)', minWidth: 160,
          }}>
            <Typography sx={{ color: '#111', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: 0.3 }}>
              {tooltip.name}
            </Typography>
            {tooltip.value !== null && (
              <Typography sx={{ fontSize: '0.82rem', color: '#333' }}>
                {selectedMetric === 'lux'         && Math.round(tooltip.value) + ' lux'}
                {selectedMetric === 'temperature' && tooltip.value.toFixed(1) + ' °C'}
                {selectedMetric === 'air'         && tooltip.value.toFixed(1) + ' ACH'}
              </Typography>
            )}
            <Typography sx={{ color: '#999', fontSize: '0.68rem', mt: 0.3 }}>
              {selectedMonth} {selectedYear}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MGMFloorPlanIntegrated;