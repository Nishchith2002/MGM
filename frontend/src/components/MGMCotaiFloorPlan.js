



import React, { useEffect, useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { Box, Typography, Select, MenuItem, FormControl } from '@mui/material';
import baseImage from '../assets/MGM COTAI GF_Mar 2026.jpg';

// ── Coordinate space (keep as-is)
const BASE_WIDTH  = 4000;
const BASE_HEIGHT = 2400;

const LUX_LEVELS = [
  { label: 'Under 150',    min: 0,   max: 149,      fill: '#FF2233', border: '#CC0011' },
  { label: '150 - 200',    min: 150, max: 200,      fill: '#FF7700', border: '#CC5500' },
  { label: '201 - 250',    min: 201, max: 250,      fill: '#FFD000', border: '#CC9900' },
  { label: '250 or above', min: 251, max: Infinity, fill: '#11CC44', border: '#009933' },
];
const getLuxColor = (lux) =>
  LUX_LEVELS.find(l => lux >= l.min && lux <= l.max) || LUX_LEVELS[0];

// ── Temperature: 20°C=blue, 23°C=green, 26°C=red
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
  if (selectedMetric === 'air')
    return value >= 4
      ? { fill: '#5cd65c', border: '#2eb82e' }
      : { fill: '#ff8080', border: '#cc0000' };
  return { fill: '#999', border: '#666' };
};

const VALID_ZONES = new Set([
  'Pit 101','Pit 102','Pit 103','Pit 105','Pit 107','Pit 108',
  'Pit 111','Pit 112','Pit 113','Pit 115 , 116',
  'Section A','Section G','Section H','Section J','Section K','Section Y',
]);

const ZOOM_MIN  = 1;
const ZOOM_MAX  = 5;
const ZOOM_STEP = 0.25;

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const YEARS  = ['2023','2024','2025','2026'];

const MONTH_NUMBER = {
  January:'01', February:'02', March:'03',    April:'04',
  May:'05',     June:'06',     July:'07',     August:'08',
  September:'09', October:'10', November:'11', December:'12',
};

const BACKEND = 'http://10.69.80.144:5002';

const NAME_MAP = {
  'Pit 115,116':     'Pit 115 , 116',
  'Pit 108 LT Game': 'Pit 108',
  'Section k':       'Section K', 
  'Pit 115 116':     'Pit 115 , 116'
};

const normaliseLocation = (raw) => {
  const trimmed = raw.trim().replace(/\s*,\s*/g, ',');
  if (NAME_MAP[trimmed]) return NAME_MAP[trimmed];
  const original = raw.trim();
  if (NAME_MAP[original]) return NAME_MAP[original];
  return trimmed;
};

const COTAI_SENSOR_DATA = {
  March: (() => {
    const raw = [
      { loc: 'Pit 101',         temperature: 22.5, lux: 295, air: 4.3 },
      { loc: 'Pit 102',         temperature: 22.0, lux: 298, air: 4.4 },
      { loc: 'Pit 103',         temperature: 21.9, lux: 297, air: 4.4 },
      { loc: 'Pit 105',         temperature: 22.2, lux: 297, air: 4.3 },
      { loc: 'Pit 107',         temperature: 23.2, lux: 391, air: 5.0 },
      { loc: 'Pit 108 LT Game', temperature: 21.6, lux: 185, air: 5.0 },
      { loc: 'Pit 111',         temperature: 21.6, lux: 231, air: 4.1 },
      { loc: 'Pit 112',         temperature: 21.9, lux: 315, air: 5.6 },
      { loc: 'Pit 113',         temperature: 22.4, lux: 487, air: 5.1 },
      { loc: 'Pit 115,116',     temperature: 21.5, lux: 611, air: 5.3 },
      { loc: 'Section A',       temperature: 21.7, lux: 246, air: 5.2 },
      { loc: 'Section G',       temperature: 21.5, lux: 236, air: 4.3 },
      { loc: 'Section H',       temperature: 22.9, lux: 210, air: 4.1 },
      { loc: 'Section J',       temperature: 22.2, lux: 375, air: 5.1 },
      { loc: 'Section K',       temperature: 22.6, lux: 218, air: 5.3 },
      { loc: 'Section Y',       temperature: 22.0, lux: 326, air: 4.8 },
    ];
    const out = {};
    raw.forEach(({ loc, temperature, lux, air }) => {
      const normalised = loc.trim().replace(/\s*,\s*/g, ',');
      const polyName   = NAME_MAP[normalised] || normalised;
      out[polyName]    = { lux, temperature, air };
    });
    return out;
  })(),
};

// ── Helper function: Find the best label position by scanning for the widest horizontal span
const getBestLabelPos = (points, scaleX, scaleY, displayWidth, displayHeight) => {
  if (!points || points.length < 3) return null;

  // Scale points to display coordinates
  const scaled = points.map(([x, y]) => [x * scaleX, y * scaleY]);
  
  // Find bounding box
  const xs = scaled.map(p => p[0]);
  const ys = scaled.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;
  
  // Scan 60 horizontal lines through the polygon
  const SCAN_LINES = 60;
  let bestY = (minY + maxY) / 2;
  let bestSpans = [];
  let maxSpanWidth = 0;

  for (let si = 0; si < SCAN_LINES; si++) {
    const scanY = minY + (boxHeight / (SCAN_LINES - 1)) * si;
    const intersections = [];

    // Find all horizontal intersections at this Y coordinate
    for (let i = 0, j = scaled.length - 1; i < scaled.length; j = i++) {
      const x0 = scaled[j][0], y0 = scaled[j][1];
      const x1 = scaled[i][0], y1 = scaled[i][1];

      // Check if this edge crosses the scan line
      if ((y0 <= scanY && scanY < y1) || (y1 <= scanY && scanY < y0)) {
        const t = (scanY - y0) / (y1 - y0);
        intersections.push(x0 + t * (x1 - x0));
      }
    }

    // Sort intersections left to right
    intersections.sort((a, b) => a - b);

    // Group into spans (pairs of intersection points)
    for (let ii = 0; ii + 1 < intersections.length; ii += 2) {
      const spanX1 = intersections[ii];
      const spanX2 = intersections[ii + 1];
      const spanWidth = spanX2 - spanX1;

      if (spanWidth > maxSpanWidth) {
        maxSpanWidth = spanWidth;
        bestSpans = [{ x1: spanX1, x2: spanX2, width: spanWidth }];
        bestY = scanY;
      } else if (spanWidth === maxSpanWidth) {
        bestSpans.push({ x1: spanX1, x2: spanX2, width: spanWidth });
      }
    }
  }

  // Use the first widest span found
  if (bestSpans.length === 0) {
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, maxW: boxWidth };
  }

  const bestSpan = bestSpans[0];
  const bestX = (bestSpan.x1 + bestSpan.x2) / 2;

  return {
    x: bestX,
    y: bestY,
    maxW: bestSpan.width - 4, // Leave small margins on sides
  };
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

const drawPolygons = (canvas, displayWidth, displayHeight, sections, hoveredName = null, selectedMetric) => {
  canvas.width  = displayWidth;
  canvas.height = displayHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  const scaleX = displayWidth  / BASE_WIDTH;
  const scaleY = displayHeight / BASE_HEIGHT;

  // ── Draw polygons and overlays ──
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
    ctx.fillStyle   = section.fill;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
    drawPath();
    ctx.strokeStyle = section.border;
    ctx.lineWidth   = isHovered ? 4 : 2.5;
    ctx.stroke();
  });

  // ── Draw labels using best position ──
  sections.forEach((section) => {
    if (section.value === undefined || !section.points) return;

    const isHovered = hoveredName === section.name;
    ctx.save();

    // Get best label position
    const labelPos = getBestLabelPos(section.points, scaleX, scaleY, displayWidth, displayHeight);
    if (!labelPos) {
      ctx.restore();
      return;
    }

    const displayValue = selectedMetric === 'lux'
      ? String(Math.round(section.value))
      : selectedMetric === 'temperature'
        ? section.value.toFixed(1) + '°C'
        : section.value.toFixed(1) + ' ACH';

    // ── Set up text rendering ──
    let fontSize = isHovered ? 9 : 11;
    ctx.font         = `900 ${fontSize}px Arial, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle  = '#000000';
    ctx.lineWidth    = 5;
    ctx.lineJoin     = 'round';
    ctx.fillStyle    = '#ffffff';

    // ── Measure text width at current font size ──
    let textWidth = ctx.measureText(displayValue).width;

    // ── Scale down font if text is too wide for available space ──
    while (textWidth > labelPos.maxW && fontSize > 6) {
      fontSize--;
      ctx.font = `900 ${fontSize}px Arial, sans-serif`;
      textWidth = ctx.measureText(displayValue).width;
    }

    // ── Only draw if it fits ──
    if (textWidth <= labelPos.maxW) {
      ctx.strokeText(displayValue, labelPos.x, labelPos.y);
      ctx.fillText(displayValue,   labelPos.x, labelPos.y);
    }

    ctx.restore();
  });
};

// ════════════════════════════════════════════════════════════════════════════════
const MGMCotaiFloorPlan = () => {
  const [polyMap,        setPolyMap]        = useState({});
  const [sections,       setSections]       = useState([]);
  const [selectedMonth,  setSelectedMonth]  = useState('March');
  const [selectedYear,   setSelectedYear]   = useState('2025');
  const [selectedMetric, setSelectedMetric] = useState('lux');
  const [hoveredName,    setHoveredName]    = useState(null);
  const [tooltip,        setTooltip]        = useState({ visible: false, name: '', x: 0, y: 0, color: '', value: null });
  const [zoom,           setZoom]           = useState(1);
  const [pan,            setPan]            = useState({ x: 0, y: 0 });

  const [luxData,    setLuxData]    = useState({});
  const [loadingLux, setLoadingLux] = useState(false);
  const [luxError,   setLuxError]   = useState(null);

  const baseImgRef       = useRef();
  const polygonCanvasRef = useRef();
  const viewportRef      = useRef();
  const sectionsRef      = useRef([]);
  const zoomRef          = useRef(zoom);
  const panRef           = useRef(pan);

  useEffect(() => { sectionsRef.current = sections; }, [sections]);
  useEffect(() => { zoomRef.current = zoom; },         [zoom]);
  useEffect(() => { panRef.current  = pan; },          [pan]);

  // ── Load polygon CSV ──────────────────────────────────────────────────────
  useEffect(() => {
    Papa.parse('/Data/MGM_Cotai_Gaming_Area_Zoning_React_Coordinates_.csv', {
      download: true, header: true, skipEmptyLines: true,
      complete: ({ data }) => {
        const map = {};
        data.forEach((row) => {
          const name = String(row['Location'] || '').replace(/^"+|"+$/g, '').trim();
          const x    = parseFloat(row['X']);
          const y    = parseFloat(row['Y']);
          if (!name || isNaN(x) || isNaN(y) || !VALID_ZONES.has(name)) return;
          if (!map[name]) map[name] = [];
          map[name].push([x, y]);
        });
        setPolyMap(map);
      },
    });
  }, []);

  useEffect(() => {
    setSections([]);
  }, [selectedMonth, selectedYear]);

  // ── Fetch lux from backend when year/month changes ──────────────────
  useEffect(() => {
    if (!selectedYear || !selectedMonth) return;

    const monthNum = MONTH_NUMBER[selectedMonth];
    const cacheKey = `${selectedYear}-${monthNum}`;

    if (luxData[cacheKey]) return;

    setLoadingLux(true);
    setLuxError(null);

    fetch(
      `${BACKEND}/api/cotai/lux-level?year=${selectedYear}&month=${monthNum}`,
      { credentials: 'include' }
    )
      .then((res) => {
        if (res.status === 401) throw new Error('Not authenticated — please log in again.');
        if (!res.ok)            throw new Error(`Server error: ${res.status}`);
        return res.text();
      })
      .then((rawText) => {
        const byLoc = {};
        const lines = rawText.replace(/\r/g, '').trim().split('\n');
        const startIdx = lines.findIndex(l => l.trim().startsWith('"'));
        if (startIdx === -1) {
          console.warn('Cotai lux: no data rows found in response');
          return;
        }

        lines.slice(startIdx).forEach((line) => {
          if (!line.trim()) return;

          const fields = [];
          let current = '';
          let inQuote  = false;

          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              inQuote = !inQuote;
            } else if (ch === ',' && !inQuote) {
              fields.push(current.trim());
              current = '';
            } else {
              current += ch;
            }
          }
          fields.push(current.trim());

          if (fields.length < 4) return;

          const rawLoc = fields[2].trim();
          const luxVal = parseFloat(fields[3]);
          const polyLoc = normaliseLocation(rawLoc);

          if (!polyLoc || isNaN(luxVal) || !VALID_ZONES.has(polyLoc)) return;
          byLoc[polyLoc] = luxVal;
        });

        setLuxData(prev => ({ ...prev, [cacheKey]: byLoc }));
      })
      .catch((err) => {
        console.error('Cotai Lux fetch failed:', err);
        setLuxError(err.message);
      })
      .finally(() => setLoadingLux(false));

  }, [selectedYear, selectedMonth]);

  // ── Rebuild sections whenever month/metric changes ────────────────────────
  useEffect(() => {
    if (Object.keys(polyMap).length === 0) return;

    const monthNum  = MONTH_NUMBER[selectedMonth];
    const cacheKey  = `${selectedYear}-${monthNum}`;
    const fetchedLux = luxData[cacheKey];

    if (!fetchedLux) { setSections([]); return; }

    const built = Object.entries(polyMap)
      .filter(([name]) => {
        if (selectedMetric === 'lux')         return fetchedLux[name] !== undefined;
        if (selectedMetric === 'temperature') return COTAI_SENSOR_DATA['March']?.[name]?.temperature !== undefined;
        if (selectedMetric === 'air')         return COTAI_SENSOR_DATA['March']?.[name]?.air         !== undefined;
        return false;
      })
      .map(([name, points]) => {
        let value;
        if      (selectedMetric === 'lux')         value = fetchedLux[name];
        else if (selectedMetric === 'temperature') value = COTAI_SENSOR_DATA['March'][name].temperature;
        else                                       value = COTAI_SENSOR_DATA['March'][name].air;

        const colors = getColorByMetric(value, selectedMetric);
        return { name, points, value, fill: colors.fill, border: colors.border };
      });

    setSections(built);
  }, [selectedMonth, selectedYear, polyMap, selectedMetric, luxData]);

  // ── Draw ──────────────────────────────────────────────────────────────────
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

  // ── Hover hit-test with viewport-aware tooltip positioning ────────────────
  const handleMouseMove = (e) => {
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
      
      const tooltipWidth = 160;
      const tooltipHeight = 85;
      let tooltipX = mouseVpX + 14;
      let tooltipY = mouseVpY - 10;
      
      if (tooltipX + tooltipWidth > vpRect.width) {
        tooltipX = mouseVpX - tooltipWidth - 14;
      }
      
      if (tooltipY + tooltipHeight > vpRect.height) {
        tooltipY = mouseVpY - tooltipHeight - 10;
      }
      
      tooltipX = Math.max(10, Math.min(tooltipX, vpRect.width - tooltipWidth - 10));
      tooltipY = Math.max(10, Math.min(tooltipY, vpRect.height - tooltipHeight - 10));
      
      setTooltip({ visible: true, name: found.name, color: found.fill, value: found.value, x: tooltipX, y: tooltipY });
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

  return (
    <Box sx={{
      width: '100%', height: '100vh',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', backgroundColor: 'transparent',
      margin: '130px 0px 0px 80px',
    }}>

      {/* ── Viewport ── */}
      <Box
        ref={viewportRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        sx={{ position: 'relative', flex: 1, overflow: 'hidden', cursor: hoveredName ? 'pointer' : 'default', userSelect: 'none' }}
      >
        {/* Zoom + pan layer */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0', willChange: 'transform',
        }}>
          <img
            ref={baseImgRef} src={baseImage} onLoad={() => drawAll()}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0, pointerEvents: 'none' }}
            alt="Cotai Ground Floor Plan"
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
          backgroundColor: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(200,168,0,0.35)',
          borderRadius: '10px', p: '4px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}>
          {METRIC_BUTTONS.map(({ key, label }) => {
            const isActive = selectedMetric === key;
            return (
              <Box
                key={key}
                onClick={() => setSelectedMetric(key)}
                sx={{
                  px: 2.2, py: 0.65, borderRadius: '7px',
                  fontSize: '0.76rem', fontWeight: isActive ? 700 : 500,
                  letterSpacing: 0.3, cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  background: isActive
                    ? 'linear-gradient(135deg, #C8A800 0%, #8B6B00 100%)'
                    : 'transparent',
                  color: isActive ? '#fff' : '#555',
                  boxShadow: isActive
                    ? '0 2px 8px rgba(180,130,0,0.45), inset 0 1px 0 rgba(255,255,255,0.2)'
                    : 'none',
                  border: isActive ? 'none' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: isActive ? undefined : 'rgba(200,168,0,0.12)',
                    color: isActive ? '#fff' : '#8B6B00',
                  },
                  userSelect: 'none',
                }}
              >
                {label}
              </Box>
            );
          })}
        </Box>

        {/* ── Top bar: Year + Month selectors ── */}
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
              {MONTHS.map((m) => {
                const monthKey = `${selectedYear}-${MONTH_NUMBER[m]}`;
                const hasData  = !!luxData[monthKey];
                return (
                  <MenuItem
                    key={m}
                    value={m}
                    sx={{ fontSize: '0.78rem', color: hasData ? '#111' : '#888' }}
                  >
                    {m}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {loadingLux && selectedMetric === 'lux' && (
            <Typography sx={{ color: '#C8A800', fontSize: '0.72rem', ml: 1, fontStyle: 'italic' }}>
              Loading lux data…
            </Typography>
          )}
          {luxError && !loadingLux && (
            <Typography sx={{ color: '#d32f2f', fontSize: '0.72rem', ml: 1 }}>
              {luxError}
            </Typography>
          )}
        </Box>

        {/* ── Legend ── */}
        <Box sx={{
          position: 'absolute', top: 16, left: 16, zIndex: 300,
          backgroundColor: 'rgba(255, 245, 200, 0.95)',
          border: '2px solid #C8A800', borderRadius: '6px',
          px: 1.5, py: 1,
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          minWidth: 500,
        }}>
          <Typography sx={{ color: '#8B6800', fontWeight: 'bold', fontSize: '0.72rem', mb: 0.75, letterSpacing: 0.5, textDecoration: 'underline' }}>
            {selectedMetric === 'lux'         && 'Lux Level Legend'}
            {selectedMetric === 'temperature' && 'Temperature Legend'}
            {selectedMetric === 'air'         && 'ACH Legend'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.75, width: '100%' }}>
            {selectedMetric === 'lux' && LUX_LEVELS.map((l) => (
              <Box key={l.label} sx={{
                flex: 1, textAlign: 'center',
                backgroundColor: l.fill,
                border: '2px solid rgba(0,0,0,0.2)',
                borderRadius: '4px', py: 0.5,
              }}>
                <Typography sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 'bold' }}>
                  {l.label}
                </Typography>
              </Box>
            ))}

            {selectedMetric === 'temperature' && (
              <Box sx={{ width: '100%', position: 'relative', px: 1, pt: 0.5, pb: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#444' }}>28°C</Typography>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#444' }}>23°C</Typography>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#444' }}>20°C</Typography>
                </Box>
                <Box sx={{
                  height: 18, borderRadius: '4px',
                  background: 'linear-gradient(to right, #FF2200, #FF8800, #FFDD00, #00CC44, #00CCCC, #0044FF)',
                  border: '1px solid #999',
                }} />
              </Box>
            )}

            {selectedMetric === 'air' && (
              <>
                <Box sx={{
                  flex: 1, textAlign: 'center',
                  backgroundColor: '#ff8080', borderRadius: '4px', py: 0.5,
                  fontSize: '0.7rem', fontWeight: 'bold', color: '#fff',
                }}>
                  Less than 4 ACH
                </Box>
                <Box sx={{
                  flex: 1, textAlign: 'center',
                  backgroundColor: '#5cd65c', borderRadius: '4px', py: 0.5,
                  fontSize: '0.7rem', fontWeight: 'bold', color: '#fff',
                }}>
                  Greater than 4 ACH
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* ── Tooltip with viewport bounds checking ── */}
        {tooltip.visible && (
          <Box sx={{
            position: 'absolute', left: tooltip.x, top: tooltip.y,
            zIndex: 400, pointerEvents: 'none',
            backgroundColor: '#ffffff',
            border: `2px solid ${tooltip.color}`,
            borderRadius: '8px', px: 1.5, py: 1,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            minWidth: 160,
          }}>
            <Typography sx={{ color: '#111', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: 0.3 }}>
              {tooltip.name}
            </Typography>
            {tooltip.value !== null && (
              <Typography sx={{ fontSize: '0.82rem', color: '#333' }}>
                {selectedMetric === 'lux'         && Math.round(tooltip.value)      + ' lux'}
                {selectedMetric === 'temperature' && tooltip.value.toFixed(1)       + ' °C'}
                {selectedMetric === 'air'         && tooltip.value.toFixed(1)       + ' ACH'}
              </Typography>
            )}
            <Typography sx={{ color: '#999', fontSize: '0.68rem', mt: 0.3 }}>
              {selectedMonth}
            </Typography>
          </Box>
        )}

      </Box>
    </Box>
  );
};

export default MGMCotaiFloorPlan;