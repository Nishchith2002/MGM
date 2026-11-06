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
//   'Pit 5','Pit 7','Pit 13','Pit 15','Pit 16','Pit 17','Pit 18','Pit 13 & Pit 15',
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
//   const [tempData, setTempData]             = useState({});  // replaces static csvData
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
//   const [loadingTemp, setLoadingTemp]       = useState(false);
//   const [tempError, setTempError]           = useState(null);
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

//   // Clear tooltip & hover when month, year or metric changes
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

//   // ── Fetch lux from backend when year or month changes ───────────────────
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

//   // ── Fetch temperature from backend when year or month changes ────────────
//   useEffect(() => {
//     if (!selectedYear || !selectedMonth) return;

//     const monthNum = MONTH_NUMBER[selectedMonth];
//     const cacheKey = `${selectedYear}-${monthNum}`;

//     if (tempData[cacheKey]) return;

//     setLoadingTemp(true);
//     setTempError(null);

//     fetch(
//       `${BACKEND}/api/temperature-level?year=${selectedYear}&month=${monthNum}`,
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

//         // Row format: 2025-01-01,"Pit 13 & Pit 15","L1",24.52°C
//         // Columns:    [0]=date  [1]=location        [2]=floor [3]=avg_temperature
//         lines.slice(startIdx).forEach((line) => {
//           if (!line.trim()) return;
//           const cols  = line.match(/("([^"]*)")|([^,]+)/g) || [];
//           const clean = cols.map(c => c.replace(/^"|"$/g, '').trim());
//           if (clean.length < 4) return;

//       const location = clean[1];
// const tempVal = parseFloat(clean[3]);

// if (!location || isNaN(tempVal)) return;

// const locations = location.split('&').map(loc => loc.trim());

// locations.forEach((loc) => {
//   if (!VALID_ZONES.has(loc)) return;

//   byLoc[loc] = tempVal;
// });

//           // Keep the average if the same location appears more than once in the month
//           if (byLoc[location] !== undefined) {
//             byLoc[location] = (byLoc[location] + tempVal) / 2;
//           } else {
//           location.split('&').forEach(loc => {
//    const cleanLoc = loc.trim();

//    if (VALID_ZONES.has(cleanLoc)) {
//       byLoc[cleanLoc] = tempVal;
//    }
// });
//           }
//         });

//         setTempData(prev => ({ ...prev, [cacheKey]: byLoc }));
//       })
//       .catch((err) => {
//         console.error('Temperature API fetch failed:', err);
//         setTempError(err.message);
//       })
//       .finally(() => setLoadingTemp(false));

//   }, [selectedYear, selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ── Fetch ACH from backend when year or month changes ───────────────────
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

//   // ── Build sections whenever data or metric changes ───────────────────────
//   useEffect(() => {
//     if (Object.keys(polyMap).length === 0) return;

//     const monthNum = MONTH_NUMBER[selectedMonth];
//     const cacheKey = `${selectedYear}-${monthNum}`;
//     const monthLux  = luxData[cacheKey];
//     const monthTemp = tempData[cacheKey];
//     const monthAch  = achData[cacheKey];

//     const built = Object.entries(polyMap)
//       .filter(([name]) => {
//         if (selectedMetric === 'lux')         return monthLux  && monthLux[name]  !== undefined;
//         if (selectedMetric === 'temperature') return monthTemp && monthTemp[name] !== undefined;
//         if (selectedMetric === 'air')         return monthAch  && monthAch[name]  !== undefined;
//         return false;
//       })
//       .map(([name, points]) => {
//         let value;
//         if      (selectedMetric === 'lux')         value = monthLux[name];
//         else if (selectedMetric === 'temperature') value = monthTemp[name];
//         else                                       value = monthAch[name];

//         const colors = getColorByMetric(value, selectedMetric);
//         return { name, points, value, fill: colors.fill, border: colors.border };
//       });

//     setSections(built);
//   }, [selectedMonth, selectedYear, polyMap, luxData, tempData, achData, selectedMetric]);

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

//   // ── Mouse move — tooltip & hover ─────────────────────────────────────────
//   const handleMouseMove = (e) => {
//     // Block tooltip while data is still loading for the active metric
//     if (
//       (selectedMetric === 'lux'         && loadingLux)  ||
//       (selectedMetric === 'temperature' && loadingTemp) ||
//       (selectedMetric === 'air'         && loadingAch)
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
//           {loadingTemp && selectedMetric === 'temperature' && (
//             <Typography sx={{ color: '#C8A800', fontSize: '0.72rem', ml: 1, fontStyle: 'italic' }}>
//               Loading temperature data…
//             </Typography>
//           )}
//           {tempError && !loadingTemp && selectedMetric === 'temperature' && (
//             <Typography sx={{ color: '#d32f2f', fontSize: '0.72rem', ml: 1 }}>
//               {tempError}
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
//            {selectedMetric === 'temperature' && (
//   <Box sx={{ width: '100%', position: 'relative', px: 1, pb: 0.5 }}>
//     {/* Labels + tick marks above the bar */}
//     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: '2px' }}>
//       {[{ label: '26°C' }, { label: '23°C' }, { label: '20°C' }].map((item) => (
//         <Box key={item.label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//           <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#444', lineHeight: 1.2 }}>
//             {item.label}
//           </Typography>
//           <Box sx={{ height: 6, width: '1.5px', backgroundColor: '#555' }} />
//         </Box>
//       ))}
//     </Box>
//     {/* Gradient bar */}
//     <Box sx={{
//       height: 18, borderRadius: '4px',
//       background: 'linear-gradient(to right, #FF2200, #FF8800, #FFDD00, #00CC44, #00CCCC, #0044FF)',
//       border: '1px solid #999'
//     }} />
//   </Box>
// )}
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

// const getColorByMetric = (value, metric) => {
//   if (metric === 'lux')         return getLuxColor(value);
//   if (metric === 'temperature') return getTempColor(value);
//   if (metric === 'air') {
//     return value >= 4
//       ? { fill: '#5cd65c', border: '#2eb82e' }
//       : { fill: '#ff8080', border: '#cc0000' };
//   }
//   return { fill: '#999', border: '#666' };
// };

// const VALID_ZONES = new Set([
//   'Pit 5','Pit 7','Pit 13','Pit 15','Pit 16','Pit 17','Pit 18','Pit 13 & Pit 15',
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

// // ── Metric config ───────────────────────────────────────────────────────────
// const METRICS = ['lux', 'temperature', 'air'];

// const METRIC_LABEL = { lux: 'Lux Level', temperature: 'Temperature', air: 'Air Change Rate' };
// const METRIC_SHORT = { lux: 'Lux', temperature: 'Temperature', air: 'ACH' };
// const ENDPOINT     = { lux: 'lux-level', temperature: 'temperature-level', air: 'ach-level' };

// const splitCsvLine = (line) =>
//   (line.match(/("([^"]*)")|([^,]+)/g) || []).map(c => c.replace(/^"|"$/g, '').trim());

// // Each parser takes an array of cleaned column arrays and returns { zoneName: value }
// const PARSERS = {
//   // Row: [0]=?  [1]=?  [2]=location  [3]=lux
//   lux: (rows) => {
//     const byLoc = {};
//     rows.forEach((clean) => {
//       if (clean.length < 4) return;
//       const location = clean[2];
//       const val = parseFloat(clean[3]);
//       if (!location || isNaN(val)) return;
//       if (!VALID_ZONES.has(location)) return;
//       byLoc[location] = val;
//     });
//     return byLoc;
//   },

//   // Row: 2025-01-01,"Pit 13 & Pit 15","L1",24.52°C  -> monthly average per zone
//   temperature: (rows) => {
//     const sum = {}, cnt = {};
//     rows.forEach((clean) => {
//       if (clean.length < 4) return;
//       const location = clean[1];
//       const val = parseFloat(clean[3]);
//       if (!location || isNaN(val)) return;
//       location.split('&').forEach((l) => {
//         const loc = l.trim();
//         if (!VALID_ZONES.has(loc)) return;
//         sum[loc] = (sum[loc] || 0) + val;
//         cnt[loc] = (cnt[loc] || 0) + 1;
//       });
//     });
//     const byLoc = {};
//     Object.keys(sum).forEach((loc) => { byLoc[loc] = sum[loc] / cnt[loc]; });
//     return byLoc;
//   },

//   // Row: pit5,4.2
//   air: (rows) => {
//     const byLoc = {};
//     rows.forEach((clean) => {
//       if (clean.length < 2) return;
//       const val = parseFloat(clean[1]);
//       if (isNaN(val)) return;
//       const normalized = clean[0]
//         .replace(/^pit(\d+)$/i,     (_, n) => `Pit ${n}`)
//         .replace(/^section(\d+)$/i, (_, n) => `Section ${n}`);
//       if (!VALID_ZONES.has(normalized)) return;
//       byLoc[normalized] = val;
//     });
//     return byLoc;
//   },
// };

// const formatValue = (v, metric) => {
//   if (v === undefined || v === null || isNaN(v)) return '-';
//   return metric === 'lux' ? String(Math.round(v)) : v.toFixed(1);
// };

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

// const drawPolygons = (canvas, displayWidth, displayHeight, sections, hoveredName = null, metric) => {
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

//     const displayValue = metric === 'lux'
//       ? String(Math.round(section.value))
//       : metric === 'temperature'
//         ? section.value.toFixed(1) + '°C'
//         : section.value.toFixed(1) + ' ACH';

//     ctx.strokeText(displayValue, pos.x, pos.y);
//     ctx.fillText(displayValue, pos.x, pos.y);
//     ctx.restore();
//   });
// };

// const MGMFloorPlanIntegrated = () => {
//   const [polyMap, setPolyMap]               = useState({});
//   // store: { 'lux:2025-09': {zone: value}, 'temperature:2025-09': {...}, 'air:2025-09': {...} }
//   const [store, setStore]                   = useState({});
//   const [loading, setLoading]               = useState({});
//   const [errors, setErrors]                 = useState({});
//   const [selectedMonth, setSelectedMonth]   = useState(MONTHS[new Date().getMonth()]);
//   const [selectedYear, setSelectedYear]     = useState('2025');
//   const [sections, setSections]             = useState([]);
//   const [tooltip, setTooltip]               = useState({ visible: false, name: '', x: 0, y: 0, color: '', value: null });
//   const [hoveredName, setHoveredName]       = useState(null);
//   const [zoom, setZoom]                     = useState(1);
//   const [pan, setPan]                       = useState({ x: 0, y: 0 });
//   const [selectedMetric, setSelectedMetric] = useState('lux');      // 'lux' | 'temperature' | 'air' | 'summary'
//   const [summaryMetric, setSummaryMetric]   = useState('lux');      // which metric the map shows in Summary view

//   const [fit, setFit] = useState(null);   // map size that fits the visible area (Summary view)
//   const isSummary    = selectedMetric === 'summary';
//   const activeMetric = isSummary ? summaryMetric : selectedMetric;
//   const monthNum     = MONTH_NUMBER[selectedMonth];
//   const prevYear     = String(Number(selectedYear) - 1);

//   const baseImgRef       = useRef();
//   const polygonCanvasRef = useRef();
//   const viewportRef      = useRef();
//   const sectionsRef      = useRef([]);
//   const zoomRef          = useRef(zoom);
//   const panRef           = useRef(pan);
//   const storeRef         = useRef({});
//   const inflightRef      = useRef(new Set());

//   useEffect(() => { sectionsRef.current = sections; }, [sections]);
//   useEffect(() => { zoomRef.current = zoom; },         [zoom]);
//   useEffect(() => { panRef.current = pan; },           [pan]);
//   useEffect(() => { storeRef.current = store; },       [store]);

//   // Clear tooltip & hover when month, year or metric changes
//   useEffect(() => {
//     setHoveredName(null);
//     setTooltip(t => ({ ...t, visible: false }));
//   }, [selectedMonth, selectedYear, selectedMetric, summaryMetric]);

//   // Reset zoom/pan when entering or leaving the Summary view (map width changes)
//   useEffect(() => {
//     setZoom(1);
//     setPan({ x: 0, y: 0 });
//   }, [isSummary]);

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

//   // ── Generic backend fetch (cached per metric + year + month) ─────────────
//   const fetchMetric = useCallback((metric, year, mm) => {
//     const key = `${metric}:${year}-${mm}`;
//     if (storeRef.current[key] || inflightRef.current.has(key)) return;

//     inflightRef.current.add(key);
//     setLoading(p => ({ ...p, [key]: true }));
//     setErrors(p => ({ ...p, [key]: null }));

//     fetch(
//       `${BACKEND}/api/${ENDPOINT[metric]}?year=${year}&month=${mm}`,
//       { credentials: 'include' }
//     )
//       .then((res) => {
//         if (res.status === 401) throw new Error('Not authenticated — please log in again.');
//         if (!res.ok)            throw new Error(`Server error: ${res.status}`);
//         return res.text();
//       })
//       .then((rawText) => {
//         const lines     = rawText.trim().split('\n');
//         const firstLine = lines[0] || '';
//         const startIdx  = firstLine.toLowerCase().includes('location') ? 1 : 0;
//         const rows = lines
//           .slice(startIdx)
//           .filter(l => l.trim())
//           .map(splitCsvLine);
//         setStore(prev => ({ ...prev, [key]: PARSERS[metric](rows) }));
//       })
//       .catch((err) => {
//         console.error(`${metric} API fetch failed (${year}-${mm}):`, err);
//         setErrors(p => ({ ...p, [key]: err.message }));
//       })
//       .finally(() => {
//         inflightRef.current.delete(key);
//         setLoading(p => ({ ...p, [key]: false }));
//       });
//   }, []);

//   // ── Fetch all three metrics for the selected period AND the previous year ─
//   useEffect(() => {
//     if (!selectedYear || !selectedMonth) return;
//     METRICS.forEach((m) => {
//       fetchMetric(m, selectedYear, monthNum);
//       fetchMetric(m, prevYear, monthNum);
//     });
//   }, [selectedYear, selectedMonth, monthNum, prevYear, fetchMetric]);

//   // ── Build map sections whenever data or active metric changes ────────────
//   useEffect(() => {
//     if (Object.keys(polyMap).length === 0) return;

//     const monthData = store[`${activeMetric}:${selectedYear}-${monthNum}`];

//     const built = Object.entries(polyMap)
//       .filter(([name]) => monthData && monthData[name] !== undefined)
//       .map(([name, points]) => {
//         const value  = monthData[name];
//         const colors = getColorByMetric(value, activeMetric);
//         return { name, points, value, fill: colors.fill, border: colors.border };
//       });

//     setSections(built);
//   }, [selectedMonth, selectedYear, monthNum, polyMap, store, activeMetric]);

//   // ── Draw ─────────────────────────────────────────────────────────────────
//   const drawAll = useCallback((hovered = null) => {
//     const img    = baseImgRef.current;
//     const canvas = polygonCanvasRef.current;
//     if (!img || !canvas || sectionsRef.current.length === 0) return;
//     drawPolygons(canvas, img.clientWidth, img.clientHeight, sectionsRef.current, hovered, activeMetric);
//   }, [activeMetric]);

//   useEffect(() => { drawAll(hoveredName); }, [sections, hoveredName, drawAll, isSummary, fit]);
//   useEffect(() => {
//     const onResize = () => drawAll(null);
//     window.addEventListener('resize', onResize);
//     return () => window.removeEventListener('resize', onResize);
//   }, [drawAll]);

//   // ── Fit the map inside the visible part of the window (Summary view)
//   useEffect(() => {
//     const vp = viewportRef.current;
//     if (!vp) return;
//     const compute = () => {
//       const rect   = vp.getBoundingClientRect();
//       const availW = Math.min(rect.width,  document.documentElement.clientWidth - rect.left - 16);
//       const availH = Math.min(rect.height, window.innerHeight - rect.top - 16);
//       if (availW <= 0 || availH <= 0) return;
//       const s = Math.min(availW / BASE_WIDTH, availH / BASE_HEIGHT);
//       setFit({ w: Math.floor(BASE_WIDTH * s), h: Math.floor(BASE_HEIGHT * s) });
//     };
//     compute();
//     window.addEventListener('resize', compute);
//     const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(compute) : null;
//     if (ro) ro.observe(vp);
//     return () => {
//       window.removeEventListener('resize', compute);
//       if (ro) ro.disconnect();
//     };
//   }, [isSummary]);

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

//   const currentKey     = `${activeMetric}:${selectedYear}-${monthNum}`;
//   const loadingCurrent = !!loading[currentKey];
//   const errorCurrent   = errors[currentKey];

//   // ── Mouse move — tooltip & hover ─────────────────────────────────────────
//   const handleMouseMove = (e) => {
//     if (loadingCurrent) return;

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
//     { key: 'summary',     label: 'Summary' },
//   ];

//   const hasLuxForMonth = (monthName) => {
//     const key = `lux:${selectedYear}-${MONTH_NUMBER[monthName]}`;
//     return !!store[key];
//   };

//   // ── Summary table rows: selected month, previous year vs selected year ───
//   const getVal = (metric, year, zone) => {
//     const d = store[`${metric}:${year}-${monthNum}`];
//     return d ? d[zone] : undefined;
//   };

//   const summaryRows = isSummary
//     ? [...VALID_ZONES]
//         .filter(zone => METRICS.some(m =>
//           getVal(m, prevYear, zone) !== undefined || getVal(m, selectedYear, zone) !== undefined))
//         .map(zone => ({ zone }))
//     : [];

//   const summaryLoading = METRICS.some(m =>
//     loading[`${m}:${selectedYear}-${monthNum}`] || loading[`${m}:${prevYear}-${monthNum}`]);
//   const prevYearErrors = METRICS.filter(m => errors[`${m}:${prevYear}-${monthNum}`]);

//   const cellStyle = {
//     border: '1px solid #999', padding: '3px 6px', fontSize: '0.74rem', color: '#111',
//   };

//   return (
//     <Box sx={{
//       width: isSummary ? 'calc(100% - 80px)' : '100%',
//       height: isSummary ? 'calc(100vh - 130px)' : '100vh',
//       display: 'flex', flexDirection: 'column',
//       overflow: 'hidden', backgroundColor: 'transparent',
//       margin: '130px 0px 0px 80px',
//     }}>
//       <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

//         {/* ── Summary table panel (only in Summary view) ── */}
//         {isSummary && (
//           <Box sx={{
//             width: 520, flexShrink: 0, overflowY: 'auto',
//             alignSelf: 'flex-start', maxHeight: '100%', pb: 2,
//             backgroundColor: 'rgba(255,255,255,0.95)',
//             borderRight: '1px solid #ddd', p: 1.5,
//           }}>
//             {/* Year / Month selectors */}
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
//               <Typography sx={{ color: '#555', fontSize: '0.75rem', fontWeight: 'bold' }}>Year:</Typography>
//               <FormControl size="small" sx={{ minWidth: 90 }}>
//                 <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
//                   sx={{ fontSize: '0.78rem', height: 32, backgroundColor: '#fff',
//                     '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
//                     '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' } }}>
//                   {YEARS.map(y => <MenuItem key={y} value={y} sx={{ fontSize: '0.78rem' }}>{y}</MenuItem>)}
//                 </Select>
//               </FormControl>
//               <Typography sx={{ color: '#555', fontSize: '0.75rem', fontWeight: 'bold' }}>Month:</Typography>
//               <FormControl size="small" sx={{ minWidth: 120 }}>
//                 <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
//                   sx={{ fontSize: '0.78rem', height: 32, backgroundColor: '#fff',
//                     '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
//                     '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' } }}>
//                   {MONTHS.map(m => <MenuItem key={m} value={m} sx={{ fontSize: '0.78rem' }}>{m}</MenuItem>)}
//                 </Select>
//               </FormControl>
//             </Box>
//             {METRICS.filter(m => errors[`${m}:${selectedYear}-${monthNum}`]).map(m => (
//               <Typography key={m} sx={{ color: '#d32f2f', fontSize: '0.7rem', textAlign: 'center' }}>
//                 {METRIC_SHORT[m]}: {errors[`${m}:${selectedYear}-${monthNum}`]}
//               </Typography>
//             ))}
//             <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', textDecoration: 'underline' }}>
//               {selectedMonth} {prevYear} vs {selectedMonth} {selectedYear}
//             </Typography>
           

//             {summaryLoading && (
//               <Typography sx={{ color: '#C8A800', fontSize: '0.72rem', fontStyle: 'italic', textAlign: 'center' }}>
//                 Loading data…
//               </Typography>
//             )}
//             {!summaryLoading && prevYearErrors.length > 0 && (
//               <Typography sx={{ color: '#d32f2f', fontSize: '0.72rem', textAlign: 'center' }}>
//                 No {prevYear} data available for {prevYearErrors.map(m => METRIC_SHORT[m]).join(', ')}.
//               </Typography>
//             )}

//             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
//               <thead>
//                 <tr>
//                   <th style={{ ...cellStyle, background: '#fff' }}>Zone</th>
//                   <th style={{ ...cellStyle, background: '#fff' }}>Year</th>
//                   {METRICS.map((m) => {
//                     const active = summaryMetric === m;
//                     return (
//                       <th
//                         key={m}
//                         onClick={() => setSummaryMetric(m)}
//                         style={{
//                           ...cellStyle, cursor: 'pointer',
//                           background: active ? '#C8A800' : '#fff',
//                           color: active ? '#fff' : '#111',
//                         }}
//                       >
//                         {METRIC_SHORT[m]}
//                       </th>
//                     );
//                   })}
//                 </tr>
//               </thead>
//               <tbody>
//                 {summaryRows.map(({ zone }) => (
//                   <React.Fragment key={zone}>
//                     <tr>
//                       <td rowSpan={2} style={{ ...cellStyle, fontWeight: 'bold', background: '#fff' }}>{zone}</td>
//                       <td style={{ ...cellStyle, background: '#fff', color: '#555' }}>{prevYear}</td>
//                       {METRICS.map(m => (
//                         <td key={m} style={{ ...cellStyle, background: '#fff' }}>
//                           {formatValue(getVal(m, prevYear, zone), m)}
//                         </td>
//                       ))}
//                     </tr>
//                     <tr>
//                       <td style={{ ...cellStyle, background: '#d9d9d9', color: '#555' }}>{selectedYear}</td>
//                       {METRICS.map(m => (
//                         <td key={m} style={{ ...cellStyle, background: '#d9d9d9' }}>
//                           {formatValue(getVal(m, selectedYear, zone), m)}
//                         </td>
//                       ))}
//                     </tr>
//                   </React.Fragment>
//                 ))}
//                 {!summaryLoading && summaryRows.length === 0 && (
//                   <tr>
//                     <td colSpan={5} style={{ ...cellStyle, color: '#888' }}>No data for this period</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </Box>
//         )}

//         <Box
//           ref={viewportRef}
//           onMouseMove={handleMouseMove}
//           onMouseLeave={handleMouseLeave}
//           sx={{ position: 'relative', flex: 1, overflow: 'hidden', cursor: hoveredName ? 'pointer' : 'default', userSelect: 'none' }}
//         >
//           {/* Zoom + pan layer */}
//           <Box sx={{
//             position: 'absolute', top: 0, left: 0,
//             width:  isSummary && fit ? fit.w : '100%',
//             height: isSummary && fit ? fit.h : '100%',
//             transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
//             transformOrigin: '0 0', willChange: 'transform',
//           }}>
//             <img
//               ref={baseImgRef} src={baseImage} onLoad={() => drawAll()}
//               style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0, pointerEvents: 'none' }}
//               alt="Base Floor Plan"
//             />
//             <canvas
//               ref={polygonCanvasRef}
//               style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}
//             />
//           </Box>

//           {/* ── Metric Toggle Buttons ── */}
//           <Box sx={{
//             position: 'absolute', top: 20, left: 550, zIndex: 400,
//             display: 'flex', gap: 0.5,
//             backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
//             border: '1px solid rgba(200,168,0,0.35)', borderRadius: '10px',
//             p: '4px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
//           }}>
//             {METRIC_BUTTONS.map(({ key, label }) => {
//               const isActive = selectedMetric === key;
//               return (
//                 <Box key={key} onClick={() => setSelectedMetric(key)} sx={{
//                   px: 2.2, py: 0.65, borderRadius: '7px',
//                   fontSize: '0.76rem', fontWeight: isActive ? 700 : 500,
//                   letterSpacing: 0.3, cursor: 'pointer', transition: 'all 0.18s ease',
//                   background: isActive ? 'linear-gradient(135deg, #C8A800 0%, #8B6B00 100%)' : 'transparent',
//                   color: isActive ? '#fff' : '#555',
//                   boxShadow: isActive ? '0 2px 8px rgba(180,130,0,0.45), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
//                   border: isActive ? 'none' : '1px solid transparent',
//                   '&:hover': { backgroundColor: isActive ? undefined : 'rgba(200,168,0,0.12)', color: isActive ? '#fff' : '#8B6B00' },
//                   userSelect: 'none',
//                 }}>
//                   {label}
//                 </Box>
//               );
//             })}
//           </Box>

//           {/* ── Top bar: Year + Month + status ── */}
//           <Box sx={{
//             display: 'flex', alignItems: 'center', gap: 1,
//             px: 1.5, py: 0.75, flexShrink: 0,
//             ...(isSummary && { display: 'none' }),
//             backgroundColor: 'rgba(255,255,255,0.9)',
//             borderBottom: '1px solid #ddd',
//           }}>
//             <Box sx={{ width: '1px', height: 24, backgroundColor: '#ddd', mx: 1, ml: 180 }} />

//             <Typography sx={{ color: '#555', fontSize: '0.75rem', fontWeight: 'bold', mr: 0.5 }}>Year:</Typography>
//             <FormControl size="small" sx={{ minWidth: 100 }}>
//               <Select
//                 value={selectedYear}
//                 onChange={(e) => setSelectedYear(e.target.value)}
//                 sx={{
//                   fontSize: '0.78rem', height: 32, backgroundColor: '#fff',
//                   '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
//                   '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
//                 }}
//               >
//                 {YEARS.map((y) => <MenuItem key={y} value={y} sx={{ fontSize: '0.78rem' }}>{y}</MenuItem>)}
//               </Select>
//             </FormControl>

//             <Typography sx={{ color: '#555', fontSize: '0.75rem', fontWeight: 'bold', mr: 0.5 }}>Month:</Typography>
//             <FormControl size="small" sx={{ minWidth: 130 }}>
//               <Select
//                 value={selectedMonth}
//                 onChange={(e) => setSelectedMonth(e.target.value)}
//                 sx={{
//                   fontSize: '0.78rem', height: 32, backgroundColor: '#fff',
//                   '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
//                   '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
//                 }}
//               >
//                 {MONTHS.map((m) => (
//                   <MenuItem key={m} value={m} sx={{ fontSize: '0.78rem', color: hasLuxForMonth(m) ? '#111' : '#aaa' }}>
//                     {m}
//                   </MenuItem>
//                 ))}
//               </Select>
//             </FormControl>

//             {/* Loading / error status for the metric shown on the map */}
//             {loadingCurrent && (
//               <Typography sx={{ color: '#C8A800', fontSize: '0.72rem', ml: 1, fontStyle: 'italic' }}>
//                 Loading {METRIC_SHORT[activeMetric].toLowerCase()} data…
//               </Typography>
//             )}
//             {errorCurrent && !loadingCurrent && (
//               <Typography sx={{ color: '#d32f2f', fontSize: '0.72rem', ml: 1 }}>
//                 {errorCurrent}
//               </Typography>
//             )}
//           </Box>

//           {/* ── Legend ── */}
//           <Box sx={{
//             position: 'absolute', top: 16, left: 16, zIndex: 300,
//             backgroundColor: 'rgba(255, 245, 200, 0.95)',
//             border: '2px solid #C8A800', borderRadius: '6px',
//             px: 1.5, py: 1, boxShadow: '0 2px 12px rgba(0,0,0,0.3)', minWidth: 500,
//           }}>
//             <Typography sx={{ color: '#8B6800', fontWeight: 'bold', fontSize: '0.72rem', mb: 0.75, letterSpacing: 0.5, textDecoration: 'underline' }}>
//               {activeMetric === 'lux'         && 'Lux Level Legend'}
//               {activeMetric === 'temperature' && 'Temperature Legend'}
//               {activeMetric === 'air'         && 'ACH Legend'}
//               {isSummary && ` — ${selectedMonth} ${selectedYear}`}
//             </Typography>
//             <Box sx={{ display: 'flex', gap: 0.75, width: '100%' }}>
//               {activeMetric === 'lux' && LUX_LEVELS.map((l) => (
//                 <Box key={l.label} sx={{
//                   flex: 1, textAlign: 'center', backgroundColor: l.fill,
//                   border: '2px solid rgba(0,0,0,0.2)', borderRadius: '4px', py: 0.5,
//                 }}>
//                   <Typography sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 'bold' }}>{l.label}</Typography>
//                 </Box>
//               ))}
//               {activeMetric === 'temperature' && (
//                 <Box sx={{ width: '100%', position: 'relative', px: 1, pb: 0.5 }}>
//                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: '2px' }}>
//                     {[{ label: '26°C' }, { label: '23°C' }, { label: '20°C' }].map((item) => (
//                       <Box key={item.label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                         <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#444', lineHeight: 1.2 }}>
//                           {item.label}
//                         </Typography>
//                         <Box sx={{ height: 6, width: '1.5px', backgroundColor: '#555' }} />
//                       </Box>
//                     ))}
//                   </Box>
//                   <Box sx={{
//                     height: 18, borderRadius: '4px',
//                     background: 'linear-gradient(to right, #FF2200, #FF8800, #FFDD00, #00CC44, #00CCCC, #0044FF)',
//                     border: '1px solid #999'
//                   }} />
//                 </Box>
//               )}
//               {activeMetric === 'air' && (
//                 <>
//                   <Box sx={{ flex: 1, textAlign: 'center', backgroundColor: '#ff8080', borderRadius: '4px', py: 0.5, fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>Less than 4 ACH</Box>
//                   <Box sx={{ flex: 1, textAlign: 'center', backgroundColor: '#5cd65c', borderRadius: '4px', py: 0.5, fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>Greater than 4 ACH</Box>
//                 </>
//               )}
//             </Box>
//           </Box>

//           {/* ── Tooltip ── */}
//           {tooltip.visible && (
//             <Box sx={{
//               position: 'absolute', left: tooltip.x, top: tooltip.y,
//               zIndex: 400, pointerEvents: 'none', backgroundColor: '#ffffff',
//               border: `2px solid ${tooltip.color}`, borderRadius: '8px', px: 1.5, py: 1,
//               boxShadow: '0 4px 16px rgba(0,0,0,0.15)', minWidth: 160,
//             }}>
//               <Typography sx={{ color: '#111', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: 0.3 }}>
//                 {tooltip.name}
//               </Typography>
//               {tooltip.value !== null && (
//                 <Typography sx={{ fontSize: '0.82rem', color: '#333' }}>
//                   {activeMetric === 'lux'         && Math.round(tooltip.value) + ' lux'}
//                   {activeMetric === 'temperature' && tooltip.value.toFixed(1) + ' °C'}
//                   {activeMetric === 'air'         && tooltip.value.toFixed(1) + ' ACH'}
//                 </Typography>
//               )}
//               <Typography sx={{ color: '#999', fontSize: '0.68rem', mt: 0.3 }}>
//                 {selectedMonth} {selectedYear}
//               </Typography>
//             </Box>
//           )}
//         </Box>
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

const getColorByMetric = (value, metric) => {
  if (metric === 'lux')         return getLuxColor(value);
  if (metric === 'temperature') return getTempColor(value);
  if (metric === 'air') {
   return Math.round(value * 10) / 10 >= 4
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

// ── Metric config ───────────────────────────────────────────────────────────
const METRICS = ['lux', 'temperature', 'air'];

const METRIC_LABEL = { lux: 'Lux Level', temperature: 'Temperature', air: 'Air Change Rate' };
const METRIC_SHORT = { lux: 'Lux', temperature: 'Temperature', air: 'ACH' };
const ENDPOINT     = { lux: 'lux-level', temperature: 'temperature-level', air: 'ach-level' };

const splitCsvLine = (line) =>
  (line.match(/("([^"]*)")|([^,]+)/g) || []).map(c => c.replace(/^"|"$/g, '').trim());

// Each parser takes an array of cleaned column arrays and returns { zoneName: value }
const PARSERS = {
  // Row: [0]=?  [1]=?  [2]=location  [3]=lux
  lux: (rows) => {
    const byLoc = {};
    rows.forEach((clean) => {
      if (clean.length < 4) return;
      const location = clean[2];
      const val = parseFloat(clean[3]);
      if (!location || isNaN(val)) return;
      if (!VALID_ZONES.has(location)) return;
      byLoc[location] = val;
    });
    return byLoc;
  },

  // Row: 2025-01-01,"Pit 13 & Pit 15","L1",24.52°C  -> monthly average per zone
  temperature: (rows) => {
    const sum = {}, cnt = {};
    rows.forEach((clean) => {
      if (clean.length < 4) return;
      const location = clean[1];
      const val = parseFloat(clean[3]);
      if (!location || isNaN(val)) return;
      location.split('&').forEach((l) => {
        const loc = l.trim();
        if (!VALID_ZONES.has(loc)) return;
        sum[loc] = (sum[loc] || 0) + val;
        cnt[loc] = (cnt[loc] || 0) + 1;
      });
    });
    const byLoc = {};
    Object.keys(sum).forEach((loc) => { byLoc[loc] = sum[loc] / cnt[loc]; });
    return byLoc;
  },

// Row: 2025-11-01,"Pit 17","L1",3.11349  -> monthly average per zone
air: (rows) => {
  const sum = {}, cnt = {};
  rows.forEach((clean) => {
    if (clean.length < 4) return;
    const location = clean[1];
    const val = parseFloat(clean[3]);
    if (!location || isNaN(val)) return;
    location.split('&').forEach((l) => {
      const loc = l.trim();
      if (!VALID_ZONES.has(loc)) return;
      sum[loc] = (sum[loc] || 0) + val;
      cnt[loc] = (cnt[loc] || 0) + 1;
    });
  });
  const byLoc = {};
  Object.keys(sum).forEach((loc) => { byLoc[loc] = sum[loc] / cnt[loc]; });
  return byLoc;
},
};

const formatValue = (v, metric) => {
  if (v === undefined || v === null || isNaN(v)) return '-';
  return metric === 'lux' ? String(Math.round(v)) : v.toFixed(1);
};

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

const drawPolygons = (canvas, displayWidth, displayHeight, sections, hoveredName = null, metric) => {
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

    const displayValue = metric === 'lux'
      ? String(Math.round(section.value))
      : metric === 'temperature'
        ? section.value.toFixed(1) + '°C'
        : section.value.toFixed(1) + ' ACH';

    ctx.strokeText(displayValue, pos.x, pos.y);
    ctx.fillText(displayValue, pos.x, pos.y);
    ctx.restore();
  });
};

const MGMFloorPlanIntegrated = () => {
  const [polyMap, setPolyMap]               = useState({});
  // store: { 'lux:2025-09': {zone: value}, 'temperature:2025-09': {...}, 'air:2025-09': {...} }
  const [store, setStore]                   = useState({});
  const [loading, setLoading]               = useState({});
  const [errors, setErrors]                 = useState({});
  const [selectedMonth, setSelectedMonth]   = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear]     = useState('2025');
  const [sections, setSections]             = useState([]);
  const [tooltip, setTooltip]               = useState({ visible: false, name: '', x: 0, y: 0, color: '', value: null });
  const [hoveredName, setHoveredName]       = useState(null);
  const [zoom, setZoom]                     = useState(1);
  const [pan, setPan]                       = useState({ x: 0, y: 0 });
  const [selectedMetric, setSelectedMetric] = useState('lux');      // 'lux' | 'temperature' | 'air' | 'summary'

  const [fit, setFit] = useState(null);   // map size that fits the visible area (Summary view)
  const isSummary    = true;   // table + map layout is now the main page
  const activeMetric = selectedMetric;
  const monthNum     = MONTH_NUMBER[selectedMonth];
  const prevYear     = String(Number(selectedYear) - 1);

  const baseImgRef       = useRef();
  const polygonCanvasRef = useRef();
  const viewportRef      = useRef();
  const sectionsRef      = useRef([]);
  const zoomRef          = useRef(zoom);
  const panRef           = useRef(pan);
  const storeRef         = useRef({});
  const inflightRef      = useRef(new Set());

  useEffect(() => { sectionsRef.current = sections; }, [sections]);
  useEffect(() => { zoomRef.current = zoom; },         [zoom]);
  useEffect(() => { panRef.current = pan; },           [pan]);
  useEffect(() => { storeRef.current = store; },       [store]);

  // Clear tooltip & hover when month, year or metric changes
  useEffect(() => {
    setHoveredName(null);
    setTooltip(t => ({ ...t, visible: false }));
  }, [selectedMonth, selectedYear, selectedMetric]);

  // Reset zoom/pan when entering or leaving the Summary view (map width changes)
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [isSummary]);

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

  // ── Generic backend fetch (cached per metric + year + month) ─────────────
  const fetchMetric = useCallback((metric, year, mm) => {
    const key = `${metric}:${year}-${mm}`;
    if (storeRef.current[key] || inflightRef.current.has(key)) return;

    inflightRef.current.add(key);
    setLoading(p => ({ ...p, [key]: true }));
    setErrors(p => ({ ...p, [key]: null }));

    fetch(
      `${BACKEND}/api/${ENDPOINT[metric]}?year=${year}&month=${mm}`,
      { credentials: 'include' }
    )
      .then((res) => {
        if (res.status === 401) throw new Error('Not authenticated — please log in again.');
        if (!res.ok)            throw new Error(`Server error: ${res.status}`);
        return res.text();
      })
      .then((rawText) => {
        const lines     = rawText.trim().split('\n');
        const firstLine = lines[0] || '';
        const startIdx  = firstLine.toLowerCase().includes('location') ? 1 : 0;
        const rows = lines
          .slice(startIdx)
          .filter(l => l.trim())
          .map(splitCsvLine);
        setStore(prev => ({ ...prev, [key]: PARSERS[metric](rows) }));
      })
      .catch((err) => {
        console.error(`${metric} API fetch failed (${year}-${mm}):`, err);
        setErrors(p => ({ ...p, [key]: err.message }));
      })
      .finally(() => {
        inflightRef.current.delete(key);
        setLoading(p => ({ ...p, [key]: false }));
      });
  }, []);

  // ── Fetch all three metrics for the selected period AND the previous year ─
  useEffect(() => {
    if (!selectedYear || !selectedMonth) return;
    METRICS.forEach((m) => {
      fetchMetric(m, selectedYear, monthNum);
      fetchMetric(m, prevYear, monthNum);
    });
  }, [selectedYear, selectedMonth, monthNum, prevYear, fetchMetric]);

  // ── Build map sections whenever data or active metric changes ────────────
  useEffect(() => {
    if (Object.keys(polyMap).length === 0) return;

    const monthData = store[`${activeMetric}:${selectedYear}-${monthNum}`];

    const built = Object.entries(polyMap)
      .filter(([name]) => monthData && monthData[name] !== undefined)
      .map(([name, points]) => {
        const value  = monthData[name];
        const colors = getColorByMetric(value, activeMetric);
        return { name, points, value, metric: activeMetric, fill: colors.fill, border: colors.border };
      });

    setSections(built);
  }, [selectedMonth, selectedYear, monthNum, polyMap, store, activeMetric]);

  // ── Draw ─────────────────────────────────────────────────────────────────
  const drawAll = useCallback((hovered = null) => {
    const img    = baseImgRef.current;
    const canvas = polygonCanvasRef.current;
    if (!img || !canvas) return;
    // Only draw sections that belong to the metric currently selected
    const secs = sectionsRef.current.filter(s => s.metric === activeMetric);
    if (secs.length === 0) {
      // Nothing to show for this metric (loading / no data): clear any old colours
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    drawPolygons(canvas, img.clientWidth, img.clientHeight, secs, hovered, activeMetric);
  }, [activeMetric]);

  useEffect(() => { drawAll(hoveredName); }, [sections, hoveredName, drawAll, isSummary, fit]);
  useEffect(() => {
    const onResize = () => drawAll(null);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [drawAll]);

  // ── Fit the map inside the visible part of the window (Summary view)
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const compute = () => {
      const rect   = vp.getBoundingClientRect();
      const availW = Math.min(rect.width,  document.documentElement.clientWidth - rect.left - 16);
      const availH = Math.min(rect.height, window.innerHeight - rect.top - 16);
      if (availW <= 0 || availH <= 0) return;
      const s = Math.min(availW / BASE_WIDTH, availH / BASE_HEIGHT);
      setFit({ w: Math.floor(BASE_WIDTH * s), h: Math.floor(BASE_HEIGHT * s) });
    };
    compute();
    window.addEventListener('resize', compute);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(compute) : null;
    if (ro) ro.observe(vp);
    return () => {
      window.removeEventListener('resize', compute);
      if (ro) ro.disconnect();
    };
  }, [isSummary]);

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

  const currentKey     = `${activeMetric}:${selectedYear}-${monthNum}`;
  const loadingCurrent = !!loading[currentKey];
  const errorCurrent   = errors[currentKey];

  // ── Mouse move — tooltip & hover ─────────────────────────────────────────
  const handleMouseMove = (e) => {
    if (loadingCurrent) return;

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
      if (section.metric !== activeMetric) continue;
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
    const key = `lux:${selectedYear}-${MONTH_NUMBER[monthName]}`;
    return !!store[key];
  };

  // ── Summary table rows: selected month, previous year vs selected year ───
  const getVal = (metric, year, zone) => {
    const d = store[`${metric}:${year}-${monthNum}`];
    return d ? d[zone] : undefined;
  };

  const summaryRows = isSummary
    ? [...VALID_ZONES]
        .filter(zone => METRICS.some(m =>
          getVal(m, prevYear, zone) !== undefined || getVal(m, selectedYear, zone) !== undefined))
        .map(zone => ({ zone }))
    : [];

  const summaryLoading = METRICS.some(m =>
    loading[`${m}:${selectedYear}-${monthNum}`] || loading[`${m}:${prevYear}-${monthNum}`]);
  const prevYearErrors = METRICS.filter(m => errors[`${m}:${prevYear}-${monthNum}`]);

  const cellStyle = {
    border: '1px solid #999', padding: '3px 6px', fontSize: '0.74rem', color: '#111',
  };

  return (
    <Box sx={{
      width: isSummary ? 'calc(100% - 80px)' : '100%',
      height: isSummary ? 'calc(100vh - 130px)' : '100vh',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', backgroundColor: 'transparent',
      margin: '130px 0px 0px 80px',
    }}>
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ── Summary table panel (only in Summary view) ── */}
        {isSummary && (
          <Box sx={{
            width: 520, flexShrink: 0, overflowY: 'auto',
            alignSelf: 'flex-start', maxHeight: '100%', pb: 2,
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRight: '1px solid #ddd', p: 1.5,
          }}>
            {/* Year / Month selectors */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ color: '#555', fontSize: '0.75rem', fontWeight: 'bold' }}>Year:</Typography>
              <FormControl size="small" sx={{ minWidth: 90 }}>
                <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
                  sx={{ fontSize: '0.78rem', height: 32, backgroundColor: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' } }}>
                  {YEARS.map(y => <MenuItem key={y} value={y} sx={{ fontSize: '0.78rem' }}>{y}</MenuItem>)}
                </Select>
              </FormControl>
              <Typography sx={{ color: '#555', fontSize: '0.75rem', fontWeight: 'bold' }}>Month:</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                  sx={{ fontSize: '0.78rem', height: 32, backgroundColor: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' } }}>
                  {MONTHS.map(m => <MenuItem key={m} value={m} sx={{ fontSize: '0.78rem' }}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            {METRICS.filter(m => errors[`${m}:${selectedYear}-${monthNum}`]).map(m => (
              <Typography key={m} sx={{ color: '#d32f2f', fontSize: '0.7rem', textAlign: 'center' }}>
                {METRIC_SHORT[m]}: {errors[`${m}:${selectedYear}-${monthNum}`]}
              </Typography>
            ))}
            <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', textDecoration: 'underline' }}>
              {selectedMonth} {prevYear} vs {selectedMonth} {selectedYear}
            </Typography>
           

            {summaryLoading && (
              <Typography sx={{ color: '#C8A800', fontSize: '0.72rem', fontStyle: 'italic', textAlign: 'center' }}>
                Loading data…
              </Typography>
            )}
            {!summaryLoading && prevYearErrors.length > 0 && (
              <Typography sx={{ color: '#d32f2f', fontSize: '0.72rem', textAlign: 'center' }}>
                No {prevYear} data available for {prevYearErrors.map(m => METRIC_SHORT[m]).join(', ')}.
              </Typography>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr>
                  <th style={{ ...cellStyle, background: '#fff' }}>Zone</th>
                  <th style={{ ...cellStyle, background: '#fff' }}>Year</th>
                  {METRICS.map((m) => {
                    const active = selectedMetric === m;
                    return (
                      <th
                        key={m}
                        onClick={() => setSelectedMetric(m)}
                        style={{
                          ...cellStyle, cursor: 'pointer',
                          background: active ? '#C8A800' : '#fff',
                          color: active ? '#fff' : '#111',
                        }}
                      >
                        {METRIC_SHORT[m]}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {summaryRows.map(({ zone }) => (
                  <React.Fragment key={zone}>
                    <tr>
                      <td rowSpan={2} style={{ ...cellStyle, fontWeight: 'bold', background: '#fff' }}>{zone}</td>
                      <td style={{ ...cellStyle, background: '#fff', color: '#555' }}>{selectedYear}</td>
                      {METRICS.map(m => (
                        <td key={m} style={{ ...cellStyle, background: '#fff' }}>
                          {formatValue(getVal(m, selectedYear, zone), m)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ ...cellStyle, background: '#d9d9d9', color: '#555' }}>{prevYear}</td>
                      {METRICS.map(m => (
                        <td key={m} style={{ ...cellStyle, background: '#d9d9d9' }}>
                          {formatValue(getVal(m, prevYear, zone), m)}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                ))}
                {!summaryLoading && summaryRows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...cellStyle, color: '#888' }}>No data for this period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        )}

        <Box
          ref={viewportRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          sx={{ position: 'relative', flex: 1, overflow: 'hidden', cursor: hoveredName ? 'pointer' : 'default', userSelect: 'none' }}
        >
          {/* Zoom + pan layer */}
          <Box sx={{
            position: 'absolute', top: 0, left: 0,
            width:  isSummary && fit ? fit.w : '100%',
            height: isSummary && fit ? fit.h : '100%',
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
            ...(isSummary && { display: 'none' }),
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

            {/* Loading / error status for the metric shown on the map */}
            {loadingCurrent && (
              <Typography sx={{ color: '#C8A800', fontSize: '0.72rem', ml: 1, fontStyle: 'italic' }}>
                Loading {METRIC_SHORT[activeMetric].toLowerCase()} data…
              </Typography>
            )}
            {errorCurrent && !loadingCurrent && (
              <Typography sx={{ color: '#d32f2f', fontSize: '0.72rem', ml: 1 }}>
                {errorCurrent}
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
              {activeMetric === 'lux'         && 'Lux Level Legend'}
              {activeMetric === 'temperature' && 'Temperature Legend'}
              {activeMetric === 'air'         && 'ACH Legend'}
              {isSummary && ` — ${selectedMonth} ${selectedYear}`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, width: '100%' }}>
              {activeMetric === 'lux' && LUX_LEVELS.map((l) => (
                <Box key={l.label} sx={{
                  flex: 1, textAlign: 'center', backgroundColor: l.fill,
                  border: '2px solid rgba(0,0,0,0.2)', borderRadius: '4px', py: 0.5,
                }}>
                  <Typography sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 'bold' }}>{l.label}</Typography>
                </Box>
              ))}
              {activeMetric === 'temperature' && (
                <Box sx={{ width: '100%', position: 'relative', px: 1, pb: 0.5 }}>
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
                  <Box sx={{
                    height: 18, borderRadius: '4px',
                    background: 'linear-gradient(to right, #FF2200, #FF8800, #FFDD00, #00CC44, #00CCCC, #0044FF)',
                    border: '1px solid #999'
                  }} />
                </Box>
              )}
              {activeMetric === 'air' && (
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
                  {activeMetric === 'lux'         && Math.round(tooltip.value) + ' lux'}
                  {activeMetric === 'temperature' && tooltip.value.toFixed(1) + ' °C'}
                  {activeMetric === 'air'         && tooltip.value.toFixed(1) + ' ACH'}
                </Typography>
              )}
              <Typography sx={{ color: '#999', fontSize: '0.68rem', mt: 0.3 }}>
                {selectedMonth} {selectedYear}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MGMFloorPlanIntegrated;