// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { createRoot } from 'react-dom/client';
// import {
//   AlertTriangle,
//   BarChart3,
//   CalendarDays,
//   CheckCircle2,
//   ChevronDown,
//   Clock,
//   Cloud,
//   Droplets,
//   Factory,
//   FileText,
//   Hand,
//   Home,
//   Info,
//   Layers3,
//   MonitorCog,
//   Mouse,
//   MousePointer2,
//   RotateCcw,
//   Settings,
//   Snowflake,
//   Thermometer,
//   Wifi,
//   Wind,
// } from 'lucide-react';
// import { Canvas, useFrame, useThree } from '@react-three/fiber';
// import { Html, OrbitControls } from '@react-three/drei';
// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import logo from '../assets/mgmLogo.png';
// import './iaq.css';

// const MODEL_URL = '/models/lobby-gltf/MGM%20Cotai%20Hotel%20Lift%20Lobby.gltf';
// const SENSOR_DATA_URL = '/data/mgm-cotai-hotel-lobby-sensor-data.csv';

// // Flip to true once to print every mesh the heat layer decided is a floor.
// // Use it to confirm the slabs under IAQ002 / IAQ003 are being picked up.
// const DEBUG_FLOOR_PICKS = false;

// // Approximate 3D placements until real IAQ sensor coordinates are available.
// // These are R3F world coordinates after the BIM model is normalized.
// const sensors = [
//   { id: 'S-N5F-IAQ001', tower: 'North', co2: 610, tone: 'green', pos: [-0.32, 0.12, -2.05], labelOffset: [-0.05, 0.52, -0.55] },
//   { id: 'S-N5F-IAQ002', tower: 'North', co2: 620, tone: 'gold', pos: [-2.75, 0.12, 1.12], labelOffset: [-0.65, 0.5, -0.2] },
//   { id: 'S-N5F-IAQ003', tower: 'North', co2: 630, tone: 'blue', pos: [2.72, 0.12, 0.95], labelOffset: [-0.65, 0.5, 0.2] },
//   { id: 'S-S5F-IAQ001', tower: 'South', co2: 640, tone: 'gold', pos: [2.75, 0.12, -3.75] },
//   { id: 'S-S5F-IAQ002', tower: 'South', co2: 650, tone: 'gold', pos: [4.0, 0.12, -0.65] },
//   { id: 'S-S5F-IAQ003', tower: 'South', co2: 660, tone: 'orange', pos: [3.75, 0.12, 2.85] },
// ];

// const sensorToneColor = { green: '#76ff5a', gold: '#ffd34d', orange: '#ff9e38', blue: '#45caff' };

// const metricConfig = [
//   { name: 'Temperature', well: '22C - 24C', unit: 'C', Icon: Thermometer, digits: 1 },
//   { name: 'Humidity', well: '< 65% RH', unit: '%RH', Icon: Droplets, digits: 1 },
//   { name: 'CO2', well: '< 900 ppm', unit: 'ppm', Icon: Cloud, digits: 0 },
//   { name: 'PM2.5', well: '< 15 ug/m3', unit: 'ug/m3', Icon: Wind, digits: 0 },
//   { name: 'PM10', well: '< 50 ug/m3', unit: 'ug/m3', Icon: Snowflake, digits: 0 },
//   { name: 'TVOC', well: '< 500 ug/m3', unit: 'ug/m3', Icon: Factory, digits: 0 },
// ];

// const iaqThresholds = {
//   CO2: { well: 900, dspa: 1000, unit: 'ppm' },
//   'PM2.5': { well: 15, dspa: 75, unit: 'ug/m3' },
//   PM10: { well: 50, dspa: 150, unit: 'ug/m3' },
//   TVOC: { well: 500, dspa: 600, unit: 'ug/m3' },
// };

// const layerLegends = {
//   Temperature: {
//     title: 'TEMPERATURE LEGEND',
//     ticks: ['26C', '23C', '20C'],
//     gradient: 'linear-gradient(90deg, #ff4a18, #fff338 24%, #75ff5d 50%, #45caff 72%, #5b62cc)',
//   },
//   Humidity: {
//     title: 'HUMIDITY LEGEND',
//     ticks: ['<65%', '65%', '75%', '85%+'],
//     gradient: 'linear-gradient(90deg, #76ff5a 0%, #76ff5a 32%, #ffe338 42%, #ff923d 68%, #e84b38 100%)',
//   },
//   CO2: {
//     title: 'CO2 LEGEND',
//     ticks: ['0', '900 WELL', '1000 DSPA', 'High'],
//     gradient: 'linear-gradient(90deg, #76ff5a 0%, #76ff5a 40%, #ffe338 58%, #ff923d 78%, #e84b38 100%)',
//   },
//   'PM2.5': {
//     title: 'PM2.5 LEGEND',
//     ticks: ['0', '15 WELL', '75 DSPA', 'High'],
//     gradient: 'linear-gradient(90deg, #76ff5a 0%, #76ff5a 28%, #ffe338 56%, #ff923d 78%, #e84b38 100%)',
//   },
//   PM10: {
//     title: 'PM10 LEGEND',
//     ticks: ['0', '50 WELL', '150 DSPA', 'High'],
//     gradient: 'linear-gradient(90deg, #76ff5a 0%, #76ff5a 28%, #ffe338 56%, #ff923d 78%, #e84b38 100%)',
//   },
//   TVOC: {
//     title: 'TVOC LEGEND',
//     ticks: ['0', '500 WELL', '600 DSPA', 'High'],
//     gradient: 'linear-gradient(90deg, #76ff5a 0%, #76ff5a 42%, #ffe338 58%, #ff923d 78%, #e84b38 100%)',
//   },
// };

// const fallbackComparisons = [
//   ['IAQ Score', '96 /100', '94 /100', '+2'],
//   ['CO2 (ppm)', '620', '650', '-30'],
//   ['PM2.5 (ug/m3)', '8', '10', '-2'],
//   ['PM10 (ug/m3)', '15', '18', '-3'],
//   ['TVOC (ug/m3)', '110', '140', '-30'],
//   ['Temperature (C)', '23.5', '23.8', '-0.3'],
//   ['Humidity (%RH)', '52', '55', '-3'],
// ];

// const trendSeries = [
//   { label: 'CO2', unit: 'ppm', value: '620', color: '#8dff6c', yTicks: [1500, 900, 300] },
//   { label: 'PM2.5', unit: 'µg/m³', value: '8', color: '#8ed8ff', yTicks: [60, 30, 0] },
//   { label: 'PM10', unit: 'µg/m³', value: '15', color: '#cc92ff', yTicks: [120, 60, 0] },
//   { label: 'TVOC', unit: 'µg/m³', value: '110', color: '#bd82ff', yTicks: [300, 150, 0] },
//   { label: 'Humidity', unit: '%RH', value: '52', color: '#91e8ff', yTicks: [100, 50, 0] },
//   { label: 'Temperature', unit: '°C', value: '23.5', color: '#ffad78', yTicks: [30, 20, 10] },
// ];

// const trendXAxis = ['10:30', '16:30', '22:30', '04:30', '10:30'];

// function numericValue(value) {
//   if (value == null) return null;
//   const match = String(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
//   return match ? Number(match[0]) : null;
// }

// function formatMetric(value, unit, digits = 0) {
//   if (!Number.isFinite(value)) return '--';
//   return `${value.toFixed(digits)} ${unit}`;
// }

// function metricDisplay(metric, value) {
//   const config = metricConfig.find((item) => item.name === metric);
//   return formatMetric(value, config?.unit || '', config?.digits ?? 0);
// }

// function temperatureColor(value) {
//   if (!Number.isFinite(value)) return '#75ff5d';
//   const cold = new THREE.Color('#5b62cc');
//   const cool = new THREE.Color('#45caff');
//   const mid = new THREE.Color('#75ff5d');
//   const warm = new THREE.Color('#fff338');
//   const hot = new THREE.Color('#ff5a1f');
//   const clamped = THREE.MathUtils.clamp(value, 20, 26);
//   if (clamped <= 22.2) return cold.lerp(cool, (clamped - 20) / 2.2).getStyle();
//   if (clamped <= 23) return cool.lerp(mid, (clamped - 22.2) / 0.8).getStyle();
//   if (clamped <= 24.5) return mid.lerp(warm, (clamped - 23) / 1.5).getStyle();
//   return warm.lerp(hot, (clamped - 24.5) / 1.5).getStyle();
// }

// function humidityColor(value) {
//   if (!Number.isFinite(value)) return '#76ff5a';
//   if (value < 65) return '#76ff5a';
//   if (value < 75) return '#ffe338';
//   if (value < 85) return '#ff923d';
//   return '#e84b38';
// }

// function iaqGuidelineColor(metric, value) {
//   const thresholds = iaqThresholds[metric];
//   if (!thresholds || !Number.isFinite(value)) return '#76ff5a';
//   if (value <= thresholds.well) return '#76ff5a';
//   if (value <= thresholds.dspa) return '#ffe338';

//   const redPoint = thresholds.dspa + Math.max(thresholds.dspa - thresholds.well, thresholds.dspa * 0.25);
//   const t = THREE.MathUtils.clamp((value - thresholds.dspa) / (redPoint - thresholds.dspa), 0, 1);
//   return new THREE.Color('#ff923d').lerp(new THREE.Color('#e84b38'), t).getStyle();
// }

// function average(values) {
//   const valid = values.filter(Number.isFinite);
//   if (!valid.length) return null;
//   return valid.reduce((sum, value) => sum + value, 0) / valid.length;
// }

// function metricStatus(metric, value) {
//   if (!Number.isFinite(value)) return '--';
//   const thresholds = iaqThresholds[metric];
//   if (thresholds) return value <= thresholds.well ? 'Excellent' : value <= thresholds.dspa ? 'Good' : 'Monitor';
//   if (metric === 'Humidity') return value < 65 ? 'Good' : 'Monitor';
//   if (metric === 'Temperature') return value >= 22 && value <= 24 ? 'Excellent' : 'Monitor';
//   return 'Good';
// }

// function metricComplies(metric, value) {
//   if (!Number.isFinite(value)) return false;
//   const thresholds = iaqThresholds[metric];
//   if (thresholds) return value <= thresholds.well;
//   if (metric === 'Humidity') return value < 65;
//   if (metric === 'Temperature') return value >= 22 && value <= 24;
//   return true;
// }

// function formatTimeFromTimestamp(timestamp) {
//   if (!timestamp) return '--';
//   const date = new Date(String(timestamp).replace(' Hong_Kong', ''));
//   if (Number.isNaN(date.getTime())) return '--';
//   return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
// }

// function parseSensorCsv(text) {
//   const lines = text.trim().split(/\r?\n/).filter(Boolean);
//   if (lines.length < 2) return null;
//   const headers = lines[0].split(',');
//   const latest = lines[lines.length - 1].split(',');
//   const timestamp = latest[0];
//   const readings = {};

//   headers.forEach((header, index) => {
//     if (index === 0) return;
//     const match = header.match(/^(S-[NS]5F-IAQ\d{3})\s+(.+)$/);
//     if (!match) return;
//     const [, sensorId, metric] = match;
//     readings[sensorId] ||= {};
//     readings[sensorId][metric] = numericValue(latest[index]);
//   });

//   return { timestamp, readings };
// }

// function useSensorData() {
//   const [data, setData] = useState(null);

//   useEffect(() => {
//     let cancelled = false;
//     fetch(SENSOR_DATA_URL)
//       .then((res) => {
//         if (!res.ok) throw new Error('sensor data request failed');
//         return res.text();
//       })
//       .then((text) => {
//         if (!cancelled) setData(parseSensorCsv(text));
//       })
//       .catch((error) => console.error('Sensor CSV failed to load:', error));

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   return data;
// }

// // Hong Kong coordinates - used to pull live outdoor conditions for the topbar
// const HK_LAT = 22.3193;
// const HK_LON = 114.1694;

// function useClock() {
//   const [time, setTime] = useState(new Date());
//   useEffect(() => {
//     const id = window.setInterval(() => setTime(new Date()), 1000);
//     return () => window.clearInterval(id);
//   }, []);
//   return time;
// }

// // Pulls live outdoor temperature/humidity for Hong Kong from Open-Meteo
// // (no API key required). Refreshes every 10 minutes and falls back to the
// // last good reading if a request fails.
// function useHkWeather() {
//   const [weather, setWeather] = useState({ temp: null, humidity: null, status: 'loading' });

//   useEffect(() => {
//     let cancelled = false;

//     async function fetchWeather() {
//       try {
//         const url =
//           `https://api.open-meteo.com/v1/forecast?latitude=${HK_LAT}&longitude=${HK_LON}` +
//           `&current=temperature_2m,relative_humidity_2m&timezone=Asia%2FHong_Kong`;
//         const res = await fetch(url);
//         if (!res.ok) throw new Error('weather request failed');
//         const data = await res.json();
//         if (cancelled) return;
//         setWeather({
//           temp: Math.round(data.current.temperature_2m),
//           humidity: Math.round(data.current.relative_humidity_2m),
//           status: 'live',
//         });
//       } catch (err) {
//         if (cancelled) return;
//         setWeather((prev) => ({ ...prev, status: prev.temp == null ? 'error' : 'stale' }));
//       }
//     }

//     fetchWeather();
//     const id = window.setInterval(fetchWeather, 10 * 60 * 1000);
//     return () => {
//       cancelled = true;
//       window.clearInterval(id);
//     };
//   }, []);

//   return weather;
// }

// function MiniChart({ color, seed = 1 }) {
//   const points = Array.from({ length: 34 }, (_, i) => {
//     const wave = Math.sin((i + seed) * 0.55) * 10 + Math.cos(i * 0.22 + seed) * 7;
//     const spike = i % 9 === 0 ? 12 : 0;
//     return `${(i / 33) * 100},${50 - wave - spike}`;
//   }).join(' ');

//   return (
//     <svg className="mini-chart" viewBox="0 0 100 74" preserveAspectRatio="none">
//       <defs>
//         <linearGradient id={`fill-${seed}`} x1="0" x2="0" y1="0" y2="1">
//           <stop offset="0%" stopColor={color} stopOpacity="0.32" />
//           <stop offset="100%" stopColor={color} stopOpacity="0" />
//         </linearGradient>
//       </defs>
//       {[18, 37, 56].map((y) => (
//         <line key={y} x1="0" x2="100" y1={y} y2={y} />
//       ))}
//       <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
//       <polygon points={`0,74 ${points} 100,74`} fill={`url(#fill-${seed})`} />
//     </svg>
//   );
// }

// // ---------------------------------------------------------------------------
// // Heatmap generation
// //
// // Primary path: paint the real floor slab geometry from the BIM model with an
// // inverse-distance-weighted (IDW) shader, so every sensor's colour bleeds into
// // its neighbours and the fill stops exactly at the walls, because it IS the
// // floor mesh. No hand-authored mask rectangles, no per-sensor glow blobs.
// //
// // Fallback path (buildHeatTexture + maskZones below) only runs if the model
// // exposes no usable floor geometry at all.
// // ---------------------------------------------------------------------------

// // Point-in-rotated-rectangle test in the model's XZ (floor) plane.
// function pointInRotatedRect(px, pz, zone) {
//   const [cx, , cz] = zone.position;
//   const [w, h] = zone.size;
//   const rot = zone.rotation || 0;
//   const dx = px - cx;
//   const dz = pz - cz;
//   const cos = Math.cos(-rot);
//   const sin = Math.sin(-rot);
//   const localX = dx * cos - dz * sin;
//   const localZ = dx * sin + dz * cos;
//   return Math.abs(localX) <= w / 2 && Math.abs(localZ) <= h / 2;
// }

// // Point-in-polygon test (ray casting) for when you have real traced
// // floor-outline coordinates instead of approximated rectangles.
// function pointInPolygon(px, pz, polygon) {
//   let inside = false;
//   for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
//     const xi = polygon[i].x, zi = polygon[i].z;
//     const xj = polygon[j].x, zj = polygon[j].z;
//     const intersect =
//       zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi;
//     if (intersect) inside = !inside;
//   }
//   return inside;
// }

// // Bounding box (in world XZ) that fully covers a set of mask rectangles,
// // used to size and position the single plane the texture is painted onto.
// function computeZoneBounds(zones, margin = 0.4) {
//   let minX = Infinity;
//   let maxX = -Infinity;
//   let minZ = Infinity;
//   let maxZ = -Infinity;
//   zones.forEach((zone) => {
//     const [cx, , cz] = zone.position;
//     const [w, h] = zone.size;
//     const r = Math.hypot(w, h) / 2; // safe radius that covers any rotation
//     minX = Math.min(minX, cx - r);
//     maxX = Math.max(maxX, cx + r);
//     minZ = Math.min(minZ, cz - r);
//     maxZ = Math.max(maxZ, cz + r);
//   });
//   return { minX: minX - margin, maxX: maxX + margin, minZ: minZ - margin, maxZ: maxZ + margin };
// }

// // Builds one smooth, wall-clipped heat texture for a tower's footprint.
// function buildHeatTexture({ maskZones, sensorPoints, resolution = 256 }) {
//   const bounds = computeZoneBounds(maskZones);
//   const { minX, maxX, minZ, maxZ } = bounds;
//   const canvas = document.createElement('canvas');
//   canvas.width = resolution;
//   canvas.height = resolution;
//   const ctx = canvas.getContext('2d');
//   const img = ctx.createImageData(resolution, resolution);
//   const sensorColors = sensorPoints.map((s) => new THREE.Color(s.color));

//   for (let py = 0; py < resolution; py++) {
//     const worldZ = minZ + (py / (resolution - 1)) * (maxZ - minZ);
//     for (let px = 0; px < resolution; px++) {
//       const worldX = minX + (px / (resolution - 1)) * (maxX - minX);
//       const idx = (py * resolution + px) * 4;

//       const inside = maskZones.some((z) => pointInRotatedRect(worldX, worldZ, z));
//       if (!inside) {
//         img.data[idx + 3] = 0;
//         continue;
//       }

//       let r = 0;
//       let g = 0;
//       let b = 0;
//       let totalWeight = 0;
//       sensorPoints.forEach((sensor, i) => {
//         const dist = Math.hypot(worldX - sensor.x, worldZ - sensor.z);
//         const weight = 1 / Math.pow(Math.max(dist, 0.2), 2);
//         r += sensorColors[i].r * weight;
//         g += sensorColors[i].g * weight;
//         b += sensorColors[i].b * weight;
//         totalWeight += weight;
//       });
//       if (totalWeight > 0) {
//         r /= totalWeight;
//         g /= totalWeight;
//         b /= totalWeight;
//       }

//       img.data[idx] = Math.round(r * 255);
//       img.data[idx + 1] = Math.round(g * 255);
//       img.data[idx + 2] = Math.round(b * 255);
//       img.data[idx + 3] = 225;
//     }
//   }
//   ctx.putImageData(img, 0, 0);
//   const texture = new THREE.CanvasTexture(canvas);
//   texture.colorSpace = THREE.SRGBColorSpace;
//   texture.needsUpdate = true;
//   return { texture, bounds };
// }

// // IDW shader applied directly to the BIM floor slabs. uFalloffStart /
// // uFalloffEnd keep one tower's colour from creeping across the whole plate:
// // full colour within uFalloffStart of any sensor, faded to nothing by
// // uFalloffEnd. Raise both if a corner of the lobby is left uncoloured.
// function makeFloorHeatMaterial(sensorPoints, exclusionZones = [], opacity = 0.62) {
//   const colors = Array.from({ length: 6 }, (_, index) => {
//     const color = new THREE.Color(sensorPoints[index]?.color || '#76ff5a');
//     return color;
//   });
//   const positions = Array.from({ length: 6 }, (_, index) => {
//     const sensor = sensorPoints[index];
//     return new THREE.Vector2(sensor?.x || 0, sensor?.z || 0);
//   });
//   const exclusionCenters = Array.from({ length: 6 }, (_, index) => {
//     const zone = exclusionZones[index];
//     return new THREE.Vector2(zone?.position?.[0] || 0, zone?.position?.[2] || 0);
//   });
//   const exclusionSizes = Array.from({ length: 6 }, (_, index) => {
//     const zone = exclusionZones[index];
//     return new THREE.Vector2(zone?.size?.[0] || 0, zone?.size?.[1] || 0);
//   });
//   const exclusionRotations = Array.from({ length: 6 }, (_, index) => exclusionZones[index]?.rotation || 0);

//   return new THREE.ShaderMaterial({
//     transparent: true,
//     depthWrite: false,
//     depthTest: true,
//     polygonOffset: true,
//     polygonOffsetFactor: -4,
//     polygonOffsetUnits: -4,
//     uniforms: {
//       uSensorCount: { value: Math.min(sensorPoints.length, 6) },
//       uSensorPositions: { value: positions },
//       uSensorColors: { value: colors },
//       uOpacity: { value: opacity },
//       uFalloffStart: { value: 3.2 },
//       uFalloffEnd: { value: 5.0 },
//       uExclusionCount: { value: Math.min(exclusionZones.length, 6) },
//       uExclusionCenters: { value: exclusionCenters },
//       uExclusionSizes: { value: exclusionSizes },
//       uExclusionRotations: { value: exclusionRotations },
//     },
//     vertexShader: `
//       varying vec3 vWorldPosition;
//       void main() {
//         vec4 worldPosition = modelMatrix * vec4(position, 1.0);
//         vWorldPosition = worldPosition.xyz;
//         gl_Position = projectionMatrix * viewMatrix * worldPosition;
//       }
//     `,
//     fragmentShader: `
//       uniform int uSensorCount;
//       uniform vec2 uSensorPositions[6];
//       uniform vec3 uSensorColors[6];
//       uniform float uOpacity;
//       uniform float uFalloffStart;
//       uniform float uFalloffEnd;
//       uniform int uExclusionCount;
//       uniform vec2 uExclusionCenters[6];
//       uniform vec2 uExclusionSizes[6];
//       uniform float uExclusionRotations[6];
//       varying vec3 vWorldPosition;
//       void main() {
//         for (int i = 0; i < 6; i++) {
//           if (i >= uExclusionCount) break;
//           vec2 d = vWorldPosition.xz - uExclusionCenters[i];
//           float c = cos(-uExclusionRotations[i]);
//           float s = sin(-uExclusionRotations[i]);
//           vec2 local = vec2(d.x * c - d.y * s, d.x * s + d.y * c);
//           if (abs(local.x) <= uExclusionSizes[i].x * 0.5 && abs(local.y) <= uExclusionSizes[i].y * 0.5) {
//             discard;
//           }
//         }

//         vec3 mixedColor = vec3(0.0);
//         float totalWeight = 0.0;
//         float nearest = 1.0e9;
//         for (int i = 0; i < 6; i++) {
//           if (i >= uSensorCount) break;
//           float d = distance(vWorldPosition.xz, uSensorPositions[i]);
//           float w = 1.0 / pow(max(d, 0.2), 2.0);
//           mixedColor += uSensorColors[i] * w;
//           totalWeight += w;
//           nearest = min(nearest, d);
//         }
//         mixedColor = totalWeight > 0.0 ? mixedColor / totalWeight : vec3(0.45, 1.0, 0.35);
//         float fade = 1.0 - smoothstep(uFalloffStart, uFalloffEnd, nearest);
//         if (fade <= 0.001) discard;
//         gl_FragColor = vec4(mixedColor, uOpacity * fade);
//       }
//     `,
//   });
// }

// // Meshes we never want to paint, regardless of shape.
// const NON_FLOOR_HINTS = [
//   'wall', 'masonry', 'ceiling', 'roof', 'door', 'glass', 'curtain',
//   'column', 'railing', 'lift', 'elevator', 'furniture', 'sofa', 'seat',
// ];

// // Left-side compartments marked as no-overlay areas. Everything else keeps heatmap.
// const HEATMAP_EXCLUSION_ZONES = {
//   North: [
//     { position: [-2.67, 0, 2.59], size: [3.35, 2.85], rotation: 0.04 },
//     { position: [1.65, 0, 2.59], size: [3.85, 2.85], rotation: 0.04 },
//   ],
//   South: [],
// };

// // Collects every floor slab in the model. Named floors are taken directly;
// // anything else qualifies if it is thin in Y, wide in XZ and sits near the
// // bottom of the model — which catches the slabs under IAQ002 and IAQ003 that
// // a material-name-only filter used to miss.
// function getFloorOverlayGeometries(model, { debug = false } = {}) {
//   if (!model) return [];
//   const scene = model.scene;
//   scene.updateWorldMatrix(true, true);

//   const modelBox = new THREE.Box3().setFromObject(scene);
//   const floorY = modelBox.min.y;
//   const modelHeight = Math.max(modelBox.max.y - modelBox.min.y, 0.001);

//   const geometries = [];
//   scene.traverse((obj) => {
//     if (!obj.isMesh || !obj.geometry) return;

//     const meshName = (obj.name || '').toLowerCase();
//     const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
//     const materialNames = materials.map((m) => (m?.name || '').toLowerCase()).join(' ');
//     const haystack = `${meshName} ${materialNames}`;

//     const explicitFloor =
//       haystack.includes('oak flooring') ||
//       haystack.includes('floorplan') ||
//       haystack.includes('floor_plan') ||
//       haystack.includes('floor') ||
//       haystack.includes('slab');

//     if (!explicitFloor && NON_FLOOR_HINTS.some((hint) => haystack.includes(hint))) return;
//     if (explicitFloor && (haystack.includes('wall') || haystack.includes('ceiling'))) return;

//     const box = new THREE.Box3().setFromObject(obj);
//     const size = box.getSize(new THREE.Vector3());
//     const footprint = size.x * size.z;

//     const isThin = size.y <= Math.max(modelHeight * 0.06, 0.25);
//     const isLow = box.min.y <= floorY + modelHeight * 0.25;
//     const isBigEnough = footprint > 0.6;

//     if (!(explicitFloor || (isThin && isLow && isBigEnough))) return;
//     if (!isLow) return; // never paint ceilings, even if named "floor"

//     if (debug) {
//       // eslint-disable-next-line no-console
//       console.log(
//         '[heat floor]', obj.name || '(unnamed)',
//         '| mat:', materialNames || '(none)',
//         '| y:', box.min.y.toFixed(2),
//         '| area:', footprint.toFixed(2)
//       );
//     }

//     const geometry = obj.geometry.clone();
//     geometry.applyMatrix4(obj.matrixWorld);
//     geometries.push({ id: obj.uuid, geometry });
//   });

//   return geometries;
// }

// function HeatLayer({ visible, selectedLayer, visibleSensors, model }) {
//   const groupRef = useRef(null);
//   const guidelineHeatLayers = ['CO2', 'PM2.5', 'PM10', 'TVOC'];
//   const metricHeatLayers = ['Temperature', 'Humidity', ...guidelineHeatLayers];

//   // Fallback-only mask rectangles, used if the model exposes no floor slabs.
//   const isNorthTower = visibleSensors.some((sensor) => sensor.tower === 'North');
//   const isSouthTower = visibleSensors.some((sensor) => sensor.tower === 'South');
//   const towerExclusionZones = isNorthTower ? HEATMAP_EXCLUSION_ZONES.North : isSouthTower ? HEATMAP_EXCLUSION_ZONES.South : [];

//   const maskZones = useMemo(() => {
//     if (isNorthTower) {
//       return [
//         { position: [2.28, 0.18, 0.36], size: [3.35, 4.65], rotation: -0.05 },
//         { position: [2.35, 0.18, -0.98], size: [6.35, 2.25], rotation: -0.03 },
//         { position: [0.42, 0.18, -1.16], size: [3.15, 2.55], rotation: 0.02 },
//         { position: [-1.78, 0.18, 0.98], size: [4.35, 1.85], rotation: 0.05 },
//         { position: [1.3, 0.18, -1.62], size: [3.4, 2.35], rotation: 0.01 },
//       ];
//     }
//     if (isSouthTower) {
//       return [
//         { position: [3.55, 0.18, -0.55], size: [2.6, 3.55], rotation: 0.02 },
//         { position: [2.8, 0.18, -3.75], size: [2.35, 1.1], rotation: 0.02 },
//       ];
//     }
//     return [];
//   }, [isNorthTower, isSouthTower]);

//   const colorForMetricValue = useCallback(
//     (value) => {
//       if (selectedLayer === 'Humidity') return humidityColor(value);
//       if (guidelineHeatLayers.includes(selectedLayer)) return iaqGuidelineColor(selectedLayer, value);
//       return temperatureColor(value);
//     },
//     [selectedLayer]
//   );

//   const sensorPoints = useMemo(
//     () =>
//       visibleSensors.map((sensor) => ({
//         id: sensor.id,
//         x: sensor.pos[0],
//         z: sensor.pos[2],
//         color: colorForMetricValue(sensor.readings?.[selectedLayer]),
//       })),
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     [
//       selectedLayer,
//       colorForMetricValue,
//       visibleSensors.map((s) => `${s.id}:${s.readings?.[selectedLayer]}`).join(','),
//     ]
//   );

//   const heatResult = useMemo(() => {
//     if (!metricHeatLayers.includes(selectedLayer) || maskZones.length === 0 || sensorPoints.length === 0) {
//       return null;
//     }
//     return buildHeatTexture({ maskZones, sensorPoints });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedLayer, maskZones, sensorPoints]);

//   const floorGeometries = useMemo(
//     () => getFloorOverlayGeometries(model, { debug: DEBUG_FLOOR_PICKS }),
//     [model]
//   );
//   const floorMaterial = useMemo(
//     () => makeFloorHeatMaterial(sensorPoints, towerExclusionZones, 0.62),
//     [sensorPoints, towerExclusionZones]
//   );

//   useFrame(({ clock }) => {
//     if (!groupRef.current) return;
//     groupRef.current.visible = visible;
//     groupRef.current.children.forEach((child) => {
//       if (!child.material) return;
//       const baseOpacity = child.userData.baseOpacity ?? 0.85;
//       child.material.opacity = baseOpacity + Math.sin(clock.elapsedTime) * 0.04;
//     });
//   });

//   // Primary path: paint the real floor slabs, every sensor included.
//   if (metricHeatLayers.includes(selectedLayer) && floorGeometries.length > 0) {
//     return (
//       <group ref={groupRef} renderOrder={35} visible={visible}>
//         {floorGeometries.map(({ id, geometry }) => (
//           <mesh key={id} geometry={geometry} material={floorMaterial} />
//         ))}
//       </group>
//     );
//   }

//   if (heatResult) {
//     const { texture, bounds } = heatResult;
//     const width = bounds.maxX - bounds.minX;
//     const depth = bounds.maxZ - bounds.minZ;
//     const centerX = (bounds.minX + bounds.maxX) / 2;
//     const centerZ = (bounds.minZ + bounds.maxZ) / 2;

//     return (
//       <group ref={groupRef}>
//         <mesh rotation-x={-Math.PI / 2} position={[centerX, 0.24, centerZ]} userData={{ baseOpacity: 0.78 }}>
//           <planeGeometry args={[width, depth]} />
//           <meshBasicMaterial
//             map={texture}
//             transparent
//             opacity={0.78}
//             side={THREE.DoubleSide}
//             depthWrite={false}
//             depthTest={false}
//           />
//         </mesh>
//       </group>
//     );
//   }

//   // Fallback "no parameter data yet" ambient overview blobs.
//   return (
//     <group ref={groupRef}>
//       <mesh rotation-x={-Math.PI / 2} position={[-3.25, 0.04, 0.1]} scale={[1.45, 0.72, 1]} userData={{ baseOpacity: 0.24 }}>
//         <circleGeometry args={[4.2, 96]} />
//         <meshBasicMaterial color="#76ff5a" transparent opacity={0.24} side={THREE.DoubleSide} depthWrite={false} />
//       </mesh>
//       <mesh rotation-x={-Math.PI / 2} position={[3.25, 0.05, 0.1]} scale={[1.45, 0.72, 1]} userData={{ baseOpacity: 0.24 }}>
//         <circleGeometry args={[4.2, 96]} />
//         <meshBasicMaterial color="#ffbf39" transparent opacity={0.24} side={THREE.DoubleSide} depthWrite={false} />
//       </mesh>
//       <mesh rotation-x={-Math.PI / 2} position={[0, 0.06, 0.05]} scale={[0.72, 1.08, 1]} userData={{ baseOpacity: 0.16 }}>
//         <circleGeometry args={[3.4, 96]} />
//         <meshBasicMaterial color="#e9f56a" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
//       </mesh>
//     </group>
//   );
// }

// // ---------------------------------------------------------------------------
// // Mask calibration tool
// //
// // Temporary developer utility: when active, clicking anywhere on the model
// // floor logs the exact world (x, z) coordinate under the cursor to the
// // console, formatted ready to paste into a polygon array. Still handy for
// // checking sensor placement against the real floor outline.
// // ---------------------------------------------------------------------------
// function MaskCalibrator({ active, onPoint }) {
//   const { gl } = useThree();

//   useEffect(() => {
//     gl.domElement.style.cursor = active ? 'crosshair' : 'auto';
//     return () => {
//       gl.domElement.style.cursor = 'auto';
//     };
//   }, [active, gl]);

//   const handleClick = useCallback(
//     (e) => {
//       if (!active) return;
//       e.stopPropagation();
//       const { x, z } = e.point;
//       const line = `{ x: ${x.toFixed(2)}, z: ${z.toFixed(2)} },`;
//       // eslint-disable-next-line no-console
//       console.log(line);
//       onPoint?.({ x: Number(x.toFixed(2)), z: Number(z.toFixed(2)) });
//     },
//     [active, onPoint]
//   );

//   return (
//     <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} onClick={handleClick} visible={false}>
//       <planeGeometry args={[60, 60]} />
//       <meshBasicMaterial />
//     </mesh>
//   );
// }

// // Visual markers + connecting outline for points collected during calibration,
// // so you can see the traced polygon forming on top of the model.
// function CalibrationTrace({ points }) {
//   if (!points.length) return null;
//   const linePoints = points.map((p) => new THREE.Vector3(p.x, 0.18, p.z));
//   if (points.length > 2) linePoints.push(linePoints[0]);

//   return (
//     <group>
//       {points.map((p, i) => (
//         <mesh key={i} position={[p.x, 0.2, p.z]} rotation-x={-Math.PI / 2}>
//           <circleGeometry args={[0.08, 16]} />
//           <meshBasicMaterial color="#ff3df0" />
//         </mesh>
//       ))}
//       {points.length > 1 && (
//         <line>
//           <bufferGeometry attach="geometry" onUpdate={(geo) => geo.setFromPoints(linePoints)} />
//           <lineBasicMaterial attach="material" color="#ff3df0" />
//         </line>
//       )}
//     </group>
//   );
// }

// function prepareBimModel(gltf) {
//   const scene = gltf.scene;
//   scene.traverse((obj) => {
//     if (!obj.isMesh) return;
//     obj.castShadow = true;
//     obj.receiveShadow = true;
//     const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
//     materials.filter(Boolean).forEach((material) => {
//       const name = (material.name || '').toLowerCase();
//       material.side = THREE.DoubleSide;
//       if ('metalness' in material) material.metalness = Math.min(material.metalness ?? 0, 0.18);
//       if ('roughness' in material) material.roughness = Math.max(material.roughness ?? 0.7, 0.58);
//       ['map', 'emissiveMap', 'aoMap', 'roughnessMap', 'metalnessMap', 'normalMap'].forEach((slot) => {
//         const texture = material[slot];
//         if (!texture) return;
//         texture.anisotropy = 16;
//         texture.needsUpdate = true;
//         if (slot === 'map' || slot === 'emissiveMap') texture.colorSpace = THREE.SRGBColorSpace;
//       });
//       if (material.color) {
//         if (name.includes('wood') || name.includes('oak')) material.color.set('#dca34d');
//         else if (name.includes('concrete masonry') || name.includes('marble dark')) material.color.set('#343632');
//         else if (name.includes('precast')) material.color.set('#d8d0bd');
//         else if (name.includes('cast')) material.color.set('#eee3c5');
//         else if (name.includes('aluminium')) material.color.set('#cbc6b8');
//         else if (name.includes('floor')) material.color.set('#eee9d8');
//       }
//       if (name.includes('glass')) {
//         material.transparent = true;
//         material.opacity = 0.32;
//         material.depthWrite = false;
//       }
//       material.needsUpdate = true;
//     });
//   });

//   // Auto-center and normalize scale so any model lands centered on the grid.
//   const box = new THREE.Box3().setFromObject(scene);
//   const size = new THREE.Vector3();
//   const center = new THREE.Vector3();
//   box.getSize(size);
//   box.getCenter(center);

//   const maxDim = Math.max(size.x, size.y, size.z) || 1;
//   const targetSize = 16;
//   const scale = targetSize / maxDim;

//   scene.scale.setScalar(scale);
//   scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

//   return Math.max((size.length() / 2) * scale, 4);
// }

// function SensorMarker({ sensor, selectedLayer, selected, onSelect }) {
//   const ringRef = useRef(null);
//   const color = sensorToneColor[sensor.tone] || '#ffffff';
//   const labelOffset = sensor.labelOffset || [0, 0.5, 0];
//   const layerValue = metricDisplay(selectedLayer, sensor.readings?.[selectedLayer]);

//   useFrame(({ clock }) => {
//     if (!ringRef.current) return;
//     const pulse = 1 + Math.sin(clock.elapsedTime * 2 + sensor.pos[0]) * 0.12;
//     ringRef.current.scale.setScalar(pulse);
//   });

//   return (
//     <group position={sensor.pos}>
//       <mesh
//         ref={ringRef}
//         rotation-x={-Math.PI / 2}
//         onClick={(e) => {
//           e.stopPropagation();
//           onSelect(sensor);
//         }}
//       >
//         <ringGeometry args={[0.55, 0.72, 40]} />
//         <meshBasicMaterial color={color} transparent opacity={0.9} side={THREE.DoubleSide} />
//       </mesh>
//       <mesh rotation-x={-Math.PI / 2}>
//         <circleGeometry args={[0.22, 32]} />
//         <meshBasicMaterial color={selected ? '#ffffff' : color} transparent opacity={0.9} />
//       </mesh>
//       <Html
//         transform
//         sprite
//         center
//         position={labelOffset}
//         scale={1.15}
//         occlude={false}
//         style={{ pointerEvents: 'auto' }}
//       >
//         <div
//           className={`sensor-label ${selected ? 'selected' : ''}`}
//           style={{ '--sensor-color': color }}
//           onClick={(e) => {
//             e.stopPropagation();
//             onSelect(sensor);
//           }}
//         >
//           <strong>{sensor.id}</strong>
//           <span>{selectedLayer} {layerValue}</span>
//         </div>
//       </Html>
//     </group>
//   );
// }

// function BimModel({ model }) {
//   return <primitive object={model.scene} />;
// }

// function BimScene({
//   heatmap,
//   controlsRef,
//   model,
//   visibleSensors,
//   selectedLayer,
//   selectedSensor,
//   onSelectSensor,
//   calibrating,
//   calibrationPoints,
//   onCalibrationPoint,
// }) {
//   return (
//     <>
//       <color attach="background" args={['#020506']} />
//       <fog attach="fog" args={['#020506', 28, 64]} />
//       <ambientLight intensity={1.05} />
//       <hemisphereLight args={['#fff7df', '#2a251c', 1.35]} />
//       <directionalLight position={[7, 12, 7]} intensity={2.1} color="#ffe9bc" castShadow />
//       <directionalLight position={[-5, 7, -4]} intensity={0.9} color="#e9f4ff" />
//       <mesh rotation-x={-Math.PI / 2} position={[0, -0.055, 0]}>
//         <planeGeometry args={[24, 16]} />
//         <meshBasicMaterial color="#081113" transparent opacity={0.62} depthWrite={false} />
//       </mesh>
//       <gridHelper args={[24, 44, '#2f4e52', '#102024']} position={[0, -0.03, 0]} />
//       <HeatLayer visible={heatmap} selectedLayer={selectedLayer} visibleSensors={visibleSensors} model={model} />
//       {model && <BimModel model={model} />}
//       {model &&
//         visibleSensors.map((sensor) => (
//           <SensorMarker
//             key={sensor.id}
//             sensor={sensor}
//             selectedLayer={selectedLayer}
//             selected={selectedSensor?.id === sensor.id}
//             onSelect={onSelectSensor}
//           />
//         ))}
//       <MaskCalibrator active={calibrating} onPoint={onCalibrationPoint} />
//       <CalibrationTrace points={calibrationPoints} />
//       <OrbitControls ref={controlsRef} makeDefault enableDamping maxPolarAngle={Math.PI * 0.48} enabled={!calibrating} />
//     </>
//   );
// }

// function ModelViewer({ heatmap, tower, dashboardSensors, selectedLayer }) {
//   const controlsRef = useRef(null);
//   const [loadState, setLoadState] = useState('Loading BIM model');
//   const [modelRadius, setModelRadius] = useState(8);
//   const [model, setModel] = useState(null);
//   const [selectedSensor, setSelectedSensor] = useState(null);
//   const [calibrating, setCalibrating] = useState(false);
//   const [calibrationPoints, setCalibrationPoints] = useState([]);
//   const visibleSensors = dashboardSensors.filter((sensor) => `${sensor.tower} Tower` === tower);
//   const legend = layerLegends[selectedLayer] || layerLegends.CO2;

//   const frameModel = useCallback((radius) => {
//     const controls = controlsRef.current;
//     if (!controls) return;
//     const dist = radius * 1.52;
//     controls.object.position.set(0, radius * 1.02, dist);
//     controls.target.set(0, radius * 0.08, 0);
//     controls.minDistance = radius * 0.35;
//     controls.maxDistance = radius * 4.5;
//     controls.object.updateProjectionMatrix();
//     controls.update();
//   }, []);

//   const handleModelReady = useCallback((radius) => {
//     setModelRadius(radius);
//     setLoadState('BIM model online');
//     // One frame later guarantees the OrbitControls ref is settled.
//     requestAnimationFrame(() => frameModel(radius));
//   }, [frameModel]);

//   useEffect(() => {
//     let cancelled = false;
//     const loader = new GLTFLoader();
//     setLoadState('Loading BIM model 0%');
//     loader.load(
//       MODEL_URL,
//       (gltf) => {
//         if (cancelled) return;
//         const radius = prepareBimModel(gltf);
//         setModel(gltf);
//         handleModelReady(radius);
//       },
//       (event) => {
//         if (cancelled || !event.total) return;
//         setLoadState(`Loading BIM model ${Math.round((event.loaded / event.total) * 100)}%`);
//       },
//       (error) => {
//         if (cancelled) return;
//         console.error('BIM model failed to load:', error);
//         setLoadState('Model failed to load');
//       }
//     );

//     const id = window.setTimeout(() => {
//       if (!cancelled) {
//         setLoadState((current) =>
//           current.startsWith('Loading BIM model') ? 'BIM model still preparing' : current
//         );
//       }
//     }, 15000);

//     return () => {
//       cancelled = true;
//       window.clearTimeout(id);
//     };
//   }, []);

//   const resetView = () => frameModel(modelRadius);

//   useEffect(() => {
//     if (selectedSensor && !visibleSensors.some((sensor) => sensor.id === selectedSensor.id)) {
//       setSelectedSensor(null);
//     }
//   }, [selectedSensor, visibleSensors]);

//   // Clear traced points when switching towers so North/South don't mix.
//   useEffect(() => {
//     setCalibrationPoints([]);
//   }, [tower]);

//   const toggleCalibrating = () => {
//     setCalibrating((c) => {
//       const next = !c;
//       if (next) {
//         // eslint-disable-next-line no-console
//         console.log(`--- Calibrating ${tower}: click each floor corner in order ---`);
//       }
//       return next;
//     });
//   };

//   const undoLastPoint = () => setCalibrationPoints((pts) => pts.slice(0, -1));
//   const clearPoints = () => setCalibrationPoints([]);

//   return (
//     <div className="model-wrap">
//       <div className="model-canvas">
//         <Canvas
//           camera={{ position: [0, 9, 12], fov: 35, near: 0.1, far: 2000 }}
//           dpr={[1, 2]}
//           gl={{ antialias: true, alpha: true, outputColorSpace: THREE.SRGBColorSpace }}
//           shadows
//         >
//           <BimScene
//             heatmap={heatmap}
//             controlsRef={controlsRef}
//             model={model}
//             visibleSensors={visibleSensors}
//             selectedLayer={selectedLayer}
//             selectedSensor={selectedSensor}
//             onSelectSensor={setSelectedSensor}
//             calibrating={calibrating}
//             calibrationPoints={calibrationPoints}
//             onCalibrationPoint={(p) => setCalibrationPoints((pts) => [...pts, p])}
//           />
//         </Canvas>
//       </div>
//       <div className="co2-scale" style={{ '--legend-columns': legend.ticks.length }}>
//         <span>{legend.title}</span>
//         <div style={{ '--legend-gradient': legend.gradient }} />
//         {legend.ticks.map((tick) => <small key={tick}>{tick}</small>)}
//       </div>
//       {loadState !== 'BIM model online' && (
//         <div className={`model-status ${loadState.includes('failed') ? 'warn' : ''}`}>{loadState}</div>
//       )}
//       {selectedSensor && (
//         <div className="sensor-detail">
//           <button className="sensor-detail-close" onClick={() => setSelectedSensor(null)} aria-label="Close">×</button>
//           <strong>{selectedSensor.id}</strong>
//           <span>{selectedSensor.tower} Tower - Level 5</span>
//           <span>{selectedLayer}: {metricDisplay(selectedLayer, selectedSensor.readings?.[selectedLayer])}</span>
//           <div className="sensor-detail-grid">
//             {metricConfig.map(({ name }) => (
//               <span key={name}><b>{name}</b>{metricDisplay(name, selectedSensor.readings?.[name])}</span>
//             ))}
//           </div>
//           <span className={`sensor-detail-tag ${selectedSensor.tone}`}>
//             {selectedSensor.tone === 'green' ? 'Excellent' : selectedSensor.tone === 'gold' ? 'Good' : 'Monitor'}
//           </span>
//         </div>
//       )}
//       <div className="compass" aria-label="North compass">
//         <span className="compass-label">N</span>
//         <span className="compass-needle north" />
//         <span className="compass-needle south" />
//         <span className="compass-cross horizontal" />
//         <span className="compass-cross vertical" />
//       </div>
//       {calibrating && (
//         <div className="model-status">
//           Calibrating {tower} — click each floor corner in order ({calibrationPoints.length} points). Check console for logged coordinates.
//         </div>
//       )}
//       <div className="model-tools">
//         <span><Hand size={15} />Drag to rotate</span>
//         <span><Mouse size={15} />Scroll to zoom</span>
//         <span><MousePointer2 size={15} />Click sensor for details</span>
//         <button onClick={resetView}><RotateCcw size={15} />Reset View</button>
//         {/* <button onClick={toggleCalibrating} className={calibrating ? 'active' : ''}>
//           {calibrating ? 'Stop Calibrating' : 'Calibrate Mask'}
//         </button>
//         {calibrating && (
//           <>
//             <button onClick={undoLastPoint}>Undo Point</button>
//             <button onClick={clearPoints}>Clear Points</button>
//           </>
//         )} */}
//       </div>
//     </div>
//   );
// }

// function Panel({ title, children, glow = 'gold', className = '', info = false }) {
//   return (
//     <section className={`panel ${glow} ${className}`}>
//       {title && (
//         <h2>
//           <span>{title}</span>
//           {info && <Info size={13} className="panel-info" />}
//         </h2>
//       )}
//       {children}
//     </section>
//   );
// }

// // Calendar popover for choosing which day's data the dashboard is showing.
// function DatePicker({ date, onChange }) {
//   const [open, setOpen] = useState(false);
//   const [viewMonth, setViewMonth] = useState(new Date(date.getFullYear(), date.getMonth(), 1));
//   const wrapRef = useRef(null);

//   useEffect(() => {
//     function handleOutside(e) {
//       if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
//     }
//     document.addEventListener('mousedown', handleOutside);
//     return () => document.removeEventListener('mousedown', handleOutside);
//   }, []);

//   const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
//   const startDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
//   const cells = [...Array(startDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

//   const isSelected = (day) =>
//     day === date.getDate() &&
//     viewMonth.getMonth() === date.getMonth() &&
//     viewMonth.getFullYear() === date.getFullYear();

//   const shiftMonth = (delta) =>
//     setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1));

//   return (
//     <div className="date-picker" ref={wrapRef}>
//       <button className="status-pill" onClick={() => setOpen((o) => !o)}>
//         <CalendarDays size={17} />
//         {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
//       </button>
//       {open && (
//         <div className="calendar-pop">
//           <div className="calendar-head">
//             <button onClick={() => shiftMonth(-1)} aria-label="Previous month">&#8249;</button>
//             <span>{viewMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
//             <button onClick={() => shiftMonth(1)} aria-label="Next month">&#8250;</button>
//           </div>
//           <div className="calendar-grid dow">
//             {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
//               <span key={i}>{d}</span>
//             ))}
//           </div>
//           <div className="calendar-grid">
//             {cells.map((day, i) =>
//               day ? (
//                 <button
//                   key={i}
//                   className={isSelected(day) ? 'active' : ''}
//                   onClick={() => {
//                     onChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
//                     setOpen(false);
//                   }}
//                 >
//                   {day}
//                 </button>
//               ) : (
//                 <span key={i} />
//               )
//             )}
//           </div>
//           <button
//             className="calendar-today"
//             onClick={() => {
//               const today = new Date();
//               setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
//               onChange(today);
//               setOpen(false);
//             }}
//           >
//             Today
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// const layerOptions = [
//   { label: 'Temperature', unit: '°C', Icon: Thermometer },
//   { label: 'Humidity', unit: '%RH', Icon: Droplets },
//   { label: 'CO2', unit: 'ppm', Icon: Cloud },
//   { label: 'PM2.5', unit: 'µg/m³', Icon: Wind },
//   { label: 'PM10', unit: 'µg/m³', Icon: Snowflake },
//   { label: 'TVOC', unit: 'µg/m³', Icon: Factory },
// ];

// function IAQ() {
//   const now = useClock();
//   const hkWeather = useHkWeather();
//   const sensorData = useSensorData();
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [tower, setTower] = useState('North Tower');
//   const [floor, setFloor] = useState('L5');
//   const [layer, setLayer] = useState('CO2');
//   const [heatmap, setHeatmap] = useState(true);
//   const [activeNav, setActiveNav] = useState('Overview');
//   const readings = sensorData?.readings || {};
//   const latestUpdate = formatTimeFromTimestamp(sensorData?.timestamp);
//   const dashboardSensors = sensors.map((sensor) => ({
//     ...sensor,
//     readings: readings[sensor.id] || {},
//     co2: readings[sensor.id]?.CO2 ?? sensor.co2,
//     battery: readings[sensor.id]?.Battery,
//     rssi: readings[sensor.id]?.RSSI,
//   }));
//   const towerSensors = dashboardSensors.filter((sensor) => `${sensor.tower} Tower` === tower);
//   const currentSummary = metricConfig.map(({ name, well, unit, Icon, digits }) => {
//     const avg = average(towerSensors.map((sensor) => readings[sensor.id]?.[name]));
//     return [name, well, formatMetric(avg, unit, digits), metricStatus(name, avg), metricComplies(name, avg), Icon];
//   });
//   const metricComparisonRows = ['CO2', 'PM2.5', 'PM10', 'TVOC', 'Temperature', 'Humidity'].map((metric) => {
//     const config = metricConfig.find((item) => item.name === metric);
//     const north = average(dashboardSensors.filter((sensor) => sensor.tower === 'North').map((sensor) => readings[sensor.id]?.[metric]));
//     const south = average(dashboardSensors.filter((sensor) => sensor.tower === 'South').map((sensor) => readings[sensor.id]?.[metric]));
//     const diff = Number.isFinite(north) && Number.isFinite(south) ? north - south : null;
//     const digits = config?.digits ?? 0;
//     return [
//       `${metric} (${config?.unit || ''})`,
//       Number.isFinite(north) ? north.toFixed(digits) : '--',
//       Number.isFinite(south) ? south.toFixed(digits) : '--',
//       Number.isFinite(diff) ? `${diff >= 0 ? '+' : ''}${diff.toFixed(digits)}` : '--',
//     ];
//   });
//   const comparisons = sensorData ? [['IAQ Score', '96 /100', '94 /100', '+2'], ...metricComparisonRows] : fallbackComparisons;

//   return (
//     <main className="dashboard">
//       <header className="topbar">
//         <div className="brand">
//           <img className="lion" src={logo} alt="MGM" />
//           <div>
//             <h1>MGM COTAI</h1>
//             <p>INDOOR AIR QUALITY (IAQ) COMMAND CENTER</p>
//             <span>HOTEL TOWERS LIFT LOBBY MONITORING</span>
//           </div>
//         </div>
//         <div className="status-strip">
//           <DatePicker date={selectedDate} onChange={setSelectedDate} />
//           <span className="status-pill">
//             <Clock size={17} />
//             {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
//           </span>
//           <span className="status-pill">
//             <Thermometer size={17} />
//             {hkWeather.temp != null ? `${hkWeather.temp} C` : '-- C'}
//           </span>
//           <span className="status-pill">
//             <Droplets size={17} />
//             {hkWeather.humidity != null ? `${hkWeather.humidity}% RH` : '--% RH'}
//           </span>
//           <span className="status-pill live">
//             <Wifi size={17} />
//             LIVE
//           </span>
//         </div>
//       </header>

//       <div className="content-grid">
//         <aside className="left-stack">
//           <Panel title="OVERALL IAQ SCORE" info>
//             <div className="score-ring-wrap">
//               <div className="score-ring" />
//               <div className="score-content">
//                 <div className="score-number">96</div>
//                 <small>/100</small>
//                 <span className="score-label">EXCELLENT</span>
//                 <div className="stars">★★★★★</div>
//               </div>
//             </div>
//             <div className="cert">
//               <div>WELL<br />PLATINUM<br />2026</div>
//               <p><strong>WELL PLATINUM CERTIFIED</strong><br />HEALTHY AIR<br />HEALTHY GUESTS</p>
//             </div>
//           </Panel>
//           <Panel title="NORTH vs SOUTH COMPARISON" glow="cyan" className="comparison-panel">
//             <table>
//               <thead><tr><th>Parameter</th><th>North</th><th>South</th><th>Diff</th></tr></thead>
//               <tbody>{comparisons.map((row) => (
//                 <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td></tr>
//               ))}</tbody>
//             </table>
//           </Panel>
//           <Panel title="CURRENT IAQ SUMMARY" glow="green" className="iaq-summary-panel">
//             <table>
//               <thead><tr><th>Parameter</th><th>Target (WELL)</th><th>Current</th><th>Status</th><th>Compliance</th></tr></thead>
//               <tbody>{currentSummary.map(([name, well, value, status, complies, Icon]) => (
//                 <tr key={name}>
//                   <td><span className="param-label"><Icon size={14} />{name}</span></td>
//                   <td>{well}</td>
//                   <td>{value}</td>
//                   <td><i />{status}</td>
//                   <td className={complies ? 'pass' : 'watch'}><CheckCircle2 size={12} />{complies ? 'PASS' : 'WATCH'}</td>
//                 </tr>
//               ))}</tbody>
//             </table>
//             <div className="summary-compliance">OVERALL COMPLIANCE <strong>98%</strong></div>
//           </Panel>
//         </aside>

//         <div className="filters panel gold top-filters">
//           <div><label>Tower</label><div className="seg">{['North Tower', 'South Tower'].map((item) => <button className={tower === item ? 'active' : ''} onClick={() => setTower(item)} key={item}>{item}</button>)}</div></div>
//           <div><label>Floor</label><div className="seg compact">{['L5', 'L18', 'L26', 'PD14', 'PE05'].map((item) => <button className={floor === item ? 'active' : ''} onClick={() => setFloor(item)} key={item}>{item}</button>)}</div></div>
//           <div><label>View Mode</label><div className="seg"><button className={heatmap ? 'active' : ''} onClick={() => setHeatmap(true)}>BIM + Heatmap</button><button className={!heatmap ? 'active' : ''} onClick={() => setHeatmap(false)}>BIM Only</button></div></div>
//           <div><label>Parameter Layer</label><div className="layer-row">{layerOptions.map(({ label, unit, Icon }) => <button className={layer === label ? 'active' : ''} onClick={() => setLayer(label)} key={label}><Icon size={14} /><span>{label}</span><small>{unit}</small></button>)}</div></div>
//         </div>

//         <section className="center-stage">
//           <Panel title="BIM MODEL - HOTEL TOWER LIFT LOBBY (LEVEL 5)" className="model-panel" info>
//             <ModelViewer heatmap={heatmap} tower={tower} dashboardSensors={dashboardSensors} selectedLayer={layer} />
//           </Panel>
//           <div className="lower-panels sensor-only">
//             <Panel title="SENSOR STATUS" glow="blue" className="sensor-status-panel">
//               <table>
//                 <thead><tr><th>Location</th><th>Status</th><th>Last Update</th></tr></thead>
//                 <tbody>{dashboardSensors.map((s) => <tr key={s.id}><td>{s.id}</td><td><i />Online</td><td>{latestUpdate}</td></tr>)}</tbody>
//               </table>
//               <div className="network">
//                 <span className="network-label">NETWORK STATUS <span className="signal-bars" aria-hidden="true"><b /><b /><b /><b /></span></span>
//                 <span>100%</span>
//               </div>
//             </Panel>
//           </div>
//         </section>

//         <aside className="right-stack">
//           <section className="panel blue trend-panel">
//             <div className="trend-panel-head">
//               <h2>IAQ TRENDS (Last 24 Hours)</h2>
//               <button className="range-select">Last 24 Hours <ChevronDown size={13} /></button>
//             </div>
//             <div className="trend-list">
//               {trendSeries.map(({ label, unit, value, color, yTicks }, i) => (
//                 <div className="trend" key={label}>
//                   <div className="trend-head">
//                     <span style={{ color }}>{label} ({unit})</span>
//                     <strong style={{ color }}>
//                       {value}
//                       <small>{unit}</small>
//                     </strong>
//                   </div>
//                   <div className="trend-body">
//                     <div className="trend-yaxis">
//                       {yTicks.map((tick) => (
//                         <span key={tick}>{tick}</span>
//                       ))}
//                     </div>
//                     <div className="trend-chart-wrap">
//                       <MiniChart color={color} seed={i + 2} />
//                       <div className="trend-xaxis">
//                         {trendXAxis.map((t, idx) => (
//                           <span key={`${t}-${idx}`}>{t}</span>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </section>
//           <Panel title="INDOOR vs OUTDOOR COMPARISON" glow="cyan">
//             <table>
//               <thead><tr><th>Parameter</th><th>Outdoor</th><th>Indoor</th><th>Diff</th></tr></thead>
//               <tbody>{[['CO2', '430', '620', '+190'], ['PM2.5', '28', '8', '-20'], ['PM10', '65', '15', '-50'], ['TVOC', '350', '110', '-240'], ['Temperature', '29.0', '23.5', '-5.5'], ['Humidity', '68', '52', '-16']].map((r) => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody>
//             </table>
//           </Panel>
//           <Panel title="ALERTS & NOTIFICATIONS" glow="red">
//             <div className="alert-ok"><CheckCircle2 />All systems normal.<br /><span>No active IAQ alerts.</span></div>
//             <div className="maintenance"><AlertTriangle size={18} />UPCOMING MAINTENANCE<br /><span>Next sensor calibration: N-03 - 12 Jun 2026</span></div>
//           </Panel>
//         </aside>
//       </div>

//       <nav className="bottom-nav">
//         {[[Home, 'Overview'], [Layers3, 'Floor Plan'], [BarChart3, 'Historical Data'], [FileText, 'Reports'], [MonitorCog, 'System Status'], [Settings, 'Settings']].map(([Icon, label]) => (
//           <button className={activeNav === label ? 'active' : ''} onClick={() => setActiveNav(label)} key={label}><Icon size={20} />{label}</button>
//         ))}
//         <span>HEALTHY AIR - HEALTHY PEOPLE - SUSTAINABLE MGM</span>
//       </nav>
//     </main>
//   );
// }

// export default IAQ

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cloud,
  Droplets,
  Factory,
  FileText,
  Hand,
  Home,
  Info,
  Layers3,
  MonitorCog,
  Mouse,
  MousePointer2,
  RotateCcw,
  Settings,
  Snowflake,
  Thermometer,
  Wifi,
  Wind,
} from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import logo from '../assets/mgm.png';
import './iaq.css';

const MODEL_URL = '/models/MGM_N5-v2.glb';
const SENSOR_DATA_URL = '/Data/mgm-cotai-hotel-lobby-sensor-data.csv';

// Flip to true once to print every mesh the heat layer decided is a floor.
// Use it to confirm the slabs under IAQ002 / IAQ003 are being picked up.
const DEBUG_FLOOR_PICKS = false;

// N5 sensor locations transcribed from the marked-up BIM views. Coordinates
// are in the normalized R3F space used by MGM_N5-v2.glb. The finished floor
// in that model is y=0.54, so markers sit just above it at y=0.62.
const sensors = [
  { id: 'S-N5F-IAQ001', tower: 'North', co2: 610, tone: 'green', pos: [-3.25, 0.62, 2.05], labelOffset: [-0.25, 0.76, -0.48] },
  { id: 'S-N5F-IAQ002', tower: 'North', co2: 620, tone: 'gold', pos: [-1.72, 2.62, 6.18], labelOffset: [-0.25, 0.76, 0.42] },
  { id: 'S-N5F-IAQ003', tower: 'North', co2: 630, tone: 'blue', pos: [4.68, 2.32, 4.62], labelOffset: [-0.45, 0.76, 0.35] },
  { id: 'S-S5F-IAQ001', tower: 'South', co2: 640, tone: 'gold', pos: [2.75, 0.12, -3.75] },
  { id: 'S-S5F-IAQ002', tower: 'South', co2: 650, tone: 'gold', pos: [4.0, 0.12, -0.65] },
  { id: 'S-S5F-IAQ003', tower: 'South', co2: 660, tone: 'orange', pos: [3.75, 0.12, 2.85] },
];

const sensorToneColor = { green: '#76ff5a', gold: '#ffd34d', orange: '#ff9e38', blue: '#45caff' };

const metricConfig = [
  { name: 'Temperature', well: '22C - 24C', unit: 'C', Icon: Thermometer, digits: 1 },
  { name: 'Humidity', well: '< 65% RH', unit: '%RH', Icon: Droplets, digits: 1 },
  { name: 'CO2', well: '< 900 ppm', unit: 'ppm', Icon: Cloud, digits: 0 },
  { name: 'PM2.5', well: '< 15 ug/m3', unit: 'ug/m3', Icon: Wind, digits: 0 },
  { name: 'PM10', well: '< 50 ug/m3', unit: 'ug/m3', Icon: Snowflake, digits: 0 },
  { name: 'TVOC', well: '< 500 ug/m3', unit: 'ug/m3', Icon: Factory, digits: 0 },
];

const iaqThresholds = {
  CO2: { well: 900, dspa: 1000, unit: 'ppm' },
  'PM2.5': { well: 15, dspa: 75, unit: 'ug/m3' },
  PM10: { well: 50, dspa: 150, unit: 'ug/m3' },
  TVOC: { well: 500, dspa: 600, unit: 'ug/m3' },
};

const layerLegends = {
  Temperature: {
    title: 'TEMPERATURE LEGEND',
    ticks: ['26C', '23C', '20C'],
    gradient: 'linear-gradient(90deg, #ff4a18, #fff338 24%, #75ff5d 50%, #45caff 72%, #5b62cc)',
  },
  Humidity: {
    title: 'HUMIDITY LEGEND',
    ticks: ['<65%', '65%', '75%', '85%+'],
    gradient: 'linear-gradient(90deg, #76ff5a 0%, #76ff5a 32%, #ffe338 42%, #ff923d 68%, #e84b38 100%)',
  },
  CO2: {
    title: 'CO2 LEGEND',
    ticks: ['0', '900 WELL', '1000 DSPA', 'High'],
    gradient: 'linear-gradient(90deg, #76ff5a 0%, #76ff5a 40%, #ffe338 58%, #ff923d 78%, #e84b38 100%)',
  },
  'PM2.5': {
    title: 'PM2.5 LEGEND',
    ticks: ['0', '15 WELL', '75 DSPA', 'High'],
    gradient: 'linear-gradient(90deg, #76ff5a 0%, #76ff5a 28%, #ffe338 56%, #ff923d 78%, #e84b38 100%)',
  },
  PM10: {
    title: 'PM10 LEGEND',
    ticks: ['0', '50 WELL', '150 DSPA', 'High'],
    gradient: 'linear-gradient(90deg, #76ff5a 0%, #76ff5a 28%, #ffe338 56%, #ff923d 78%, #e84b38 100%)',
  },
  TVOC: {
    title: 'TVOC LEGEND',
    ticks: ['0', '500 WELL', '600 DSPA', 'High'],
    gradient: 'linear-gradient(90deg, #76ff5a 0%, #76ff5a 42%, #ffe338 58%, #ff923d 78%, #e84b38 100%)',
  },
};

const fallbackComparisons = [
  ['IAQ Score', '96 /100', '94 /100', '+2'],
  ['CO2 (ppm)', '620', '650', '-30'],
  ['PM2.5 (ug/m3)', '8', '10', '-2'],
  ['PM10 (ug/m3)', '15', '18', '-3'],
  ['TVOC (ug/m3)', '110', '140', '-30'],
  ['Temperature (C)', '23.5', '23.8', '-0.3'],
  ['Humidity (%RH)', '52', '55', '-3'],
];

const trendSeries = [
  { label: 'CO2', unit: 'ppm', value: '620', color: '#8dff6c', yTicks: [1500, 900, 300] },
  { label: 'PM2.5', unit: 'µg/m³', value: '8', color: '#8ed8ff', yTicks: [60, 30, 0] },
  { label: 'PM10', unit: 'µg/m³', value: '15', color: '#cc92ff', yTicks: [120, 60, 0] },
  { label: 'TVOC', unit: 'µg/m³', value: '110', color: '#bd82ff', yTicks: [300, 150, 0] },
  { label: 'Humidity', unit: '%RH', value: '52', color: '#91e8ff', yTicks: [100, 50, 0] },
  { label: 'Temperature', unit: '°C', value: '23.5', color: '#ffad78', yTicks: [30, 20, 10] },
];

const trendXAxis = ['10:30', '16:30', '22:30', '04:30', '10:30'];

function numericValue(value) {
  if (value == null) return null;
  const match = String(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function formatMetric(value, unit, digits = 0) {
  if (!Number.isFinite(value)) return '--';
  return `${value.toFixed(digits)} ${unit}`;
}

function metricDisplay(metric, value) {
  const config = metricConfig.find((item) => item.name === metric);
  return formatMetric(value, config?.unit || '', config?.digits ?? 0);
}

function temperatureColor(value) {
  if (!Number.isFinite(value)) return '#75ff5d';
  const cold = new THREE.Color('#5b62cc');
  const cool = new THREE.Color('#45caff');
  const mid = new THREE.Color('#75ff5d');
  const warm = new THREE.Color('#fff338');
  const hot = new THREE.Color('#ff5a1f');
  const clamped = THREE.MathUtils.clamp(value, 20, 26);
  if (clamped <= 22.2) return cold.lerp(cool, (clamped - 20) / 2.2).getStyle();
  if (clamped <= 23) return cool.lerp(mid, (clamped - 22.2) / 0.8).getStyle();
  if (clamped <= 24.5) return mid.lerp(warm, (clamped - 23) / 1.5).getStyle();
  return warm.lerp(hot, (clamped - 24.5) / 1.5).getStyle();
}

function humidityColor(value) {
  if (!Number.isFinite(value)) return '#76ff5a';
  if (value < 65) return '#76ff5a';
  if (value < 75) return '#ffe338';
  if (value < 85) return '#ff923d';
  return '#e84b38';
}

function iaqGuidelineColor(metric, value) {
  const thresholds = iaqThresholds[metric];
  if (!thresholds || !Number.isFinite(value)) return '#76ff5a';
  if (value <= thresholds.well) return '#76ff5a';
  if (value <= thresholds.dspa) return '#ffe338';

  const redPoint = thresholds.dspa + Math.max(thresholds.dspa - thresholds.well, thresholds.dspa * 0.25);
  const t = THREE.MathUtils.clamp((value - thresholds.dspa) / (redPoint - thresholds.dspa), 0, 1);
  return new THREE.Color('#ff923d').lerp(new THREE.Color('#e84b38'), t).getStyle();
}

function average(values) {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function metricStatus(metric, value) {
  if (!Number.isFinite(value)) return '--';
  const thresholds = iaqThresholds[metric];
  if (thresholds) return value <= thresholds.well ? 'Excellent' : value <= thresholds.dspa ? 'Good' : 'Monitor';
  if (metric === 'Humidity') return value < 65 ? 'Good' : 'Monitor';
  if (metric === 'Temperature') return value >= 22 && value <= 24 ? 'Excellent' : 'Monitor';
  return 'Good';
}

function metricComplies(metric, value) {
  if (!Number.isFinite(value)) return false;
  const thresholds = iaqThresholds[metric];
  if (thresholds) return value <= thresholds.well;
  if (metric === 'Humidity') return value < 65;
  if (metric === 'Temperature') return value >= 22 && value <= 24;
  return true;
}

function formatTimeFromTimestamp(timestamp) {
  if (!timestamp) return '--';
  const date = new Date(String(timestamp).replace(' Hong_Kong', ''));
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function parseSensorCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;
  const headers = lines[0].split(',');
  const latest = lines[lines.length - 1].split(',');
  const timestamp = latest[0];
  const readings = {};

  headers.forEach((header, index) => {
    if (index === 0) return;
    const match = header.match(/^(S-[NS]5F-IAQ\d{3})\s+(.+)$/);
    if (!match) return;
    const [, sensorId, metric] = match;
    readings[sensorId] ||= {};
    readings[sensorId][metric] = numericValue(latest[index]);
  });

  return { timestamp, readings };
}

function useSensorData() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(SENSOR_DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error('sensor data request failed');
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setData(parseSensorCsv(text));
      })
      .catch((error) => console.error('Sensor CSV failed to load:', error));

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

// Hong Kong coordinates - used to pull live outdoor conditions for the topbar
const HK_LAT = 22.3193;
const HK_LON = 114.1694;

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

// Pulls live outdoor temperature/humidity for Hong Kong from Open-Meteo
// (no API key required). Refreshes every 10 minutes and falls back to the
// last good reading if a request fails.
function useHkWeather() {
  const [weather, setWeather] = useState({ temp: null, humidity: null, status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${HK_LAT}&longitude=${HK_LON}` +
          `&current=temperature_2m,relative_humidity_2m&timezone=Asia%2FHong_Kong`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('weather request failed');
        const data = await res.json();
        if (cancelled) return;
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          humidity: Math.round(data.current.relative_humidity_2m),
          status: 'live',
        });
      } catch (err) {
        if (cancelled) return;
        setWeather((prev) => ({ ...prev, status: prev.temp == null ? 'error' : 'stale' }));
      }
    }

    fetchWeather();
    const id = window.setInterval(fetchWeather, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return weather;
}

function MiniChart({ color, seed = 1 }) {
  const points = Array.from({ length: 34 }, (_, i) => {
    const wave = Math.sin((i + seed) * 0.55) * 10 + Math.cos(i * 0.22 + seed) * 7;
    const spike = i % 9 === 0 ? 12 : 0;
    return `${(i / 33) * 100},${50 - wave - spike}`;
  }).join(' ');

  return (
    <svg className="mini-chart" viewBox="0 0 100 74" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`fill-${seed}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[18, 37, 56].map((y) => (
        <line key={y} x1="0" x2="100" y1={y} y2={y} />
      ))}
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
      <polygon points={`0,74 ${points} 100,74`} fill={`url(#fill-${seed})`} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Heatmap generation
//
// Primary path: paint the real floor slab geometry from the BIM model with an
// inverse-distance-weighted (IDW) shader, so every sensor's colour bleeds into
// its neighbours and the fill stops exactly at the walls, because it IS the
// floor mesh. No hand-authored mask rectangles, no per-sensor glow blobs.
//
// Fallback path (buildHeatTexture + maskZones below) only runs if the model
// exposes no usable floor geometry at all.
// ---------------------------------------------------------------------------

// Point-in-rotated-rectangle test in the model's XZ (floor) plane.
function pointInRotatedRect(px, pz, zone) {
  const [cx, , cz] = zone.position;
  const [w, h] = zone.size;
  const rot = zone.rotation || 0;
  const dx = px - cx;
  const dz = pz - cz;
  const cos = Math.cos(-rot);
  const sin = Math.sin(-rot);
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;
  return Math.abs(localX) <= w / 2 && Math.abs(localZ) <= h / 2;
}

// Point-in-polygon test (ray casting) for when you have real traced
// floor-outline coordinates instead of approximated rectangles.
function pointInPolygon(px, pz, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, zi = polygon[i].z;
    const xj = polygon[j].x, zj = polygon[j].z;
    const intersect =
      zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Bounding box (in world XZ) that fully covers a set of mask rectangles,
// used to size and position the single plane the texture is painted onto.
function computeZoneBounds(zones, margin = 0.4) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  zones.forEach((zone) => {
    const [cx, , cz] = zone.position;
    const [w, h] = zone.size;
    const r = Math.hypot(w, h) / 2; // safe radius that covers any rotation
    minX = Math.min(minX, cx - r);
    maxX = Math.max(maxX, cx + r);
    minZ = Math.min(minZ, cz - r);
    maxZ = Math.max(maxZ, cz + r);
  });
  return { minX: minX - margin, maxX: maxX + margin, minZ: minZ - margin, maxZ: maxZ + margin };
}

// Builds one smooth, wall-clipped heat texture for a tower's footprint.
function buildHeatTexture({ maskZones, sensorPoints, resolution = 256 }) {
  const bounds = computeZoneBounds(maskZones);
  const { minX, maxX, minZ, maxZ } = bounds;
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(resolution, resolution);
  const sensorColors = sensorPoints.map((s) => new THREE.Color(s.color));

  for (let py = 0; py < resolution; py++) {
    const worldZ = minZ + (py / (resolution - 1)) * (maxZ - minZ);
    for (let px = 0; px < resolution; px++) {
      const worldX = minX + (px / (resolution - 1)) * (maxX - minX);
      const idx = (py * resolution + px) * 4;

      const inside = maskZones.some((z) => pointInRotatedRect(worldX, worldZ, z));
      if (!inside) {
        img.data[idx + 3] = 0;
        continue;
      }

      let r = 0;
      let g = 0;
      let b = 0;
      let totalWeight = 0;
      sensorPoints.forEach((sensor, i) => {
        const dist = Math.hypot(worldX - sensor.x, worldZ - sensor.z);
        const weight = 1 / Math.pow(Math.max(dist, 0.2), 2);
        r += sensorColors[i].r * weight;
        g += sensorColors[i].g * weight;
        b += sensorColors[i].b * weight;
        totalWeight += weight;
      });
      if (totalWeight > 0) {
        r /= totalWeight;
        g /= totalWeight;
        b /= totalWeight;
      }

      img.data[idx] = Math.round(r * 255);
      img.data[idx + 1] = Math.round(g * 255);
      img.data[idx + 2] = Math.round(b * 255);
      img.data[idx + 3] = 225;
    }
  }
  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { texture, bounds };
}

// IDW shader applied directly to the BIM floor slabs. uFalloffStart /
// uFalloffEnd keep one tower's colour from creeping across the whole plate:
// full colour within uFalloffStart of any sensor, faded to nothing by
// uFalloffEnd. Raise both if a corner of the lobby is left uncoloured.
function makeFloorHeatMaterial(sensorPoints, exclusionZones = [], opacity = 0.62) {
  const colors = Array.from({ length: 6 }, (_, index) => {
    const color = new THREE.Color(sensorPoints[index]?.color || '#76ff5a');
    return color;
  });
  const positions = Array.from({ length: 6 }, (_, index) => {
    const sensor = sensorPoints[index];
    return new THREE.Vector2(sensor?.x || 0, sensor?.z || 0);
  });
  const exclusionCenters = Array.from({ length: 6 }, (_, index) => {
    const zone = exclusionZones[index];
    return new THREE.Vector2(zone?.position?.[0] || 0, zone?.position?.[2] || 0);
  });
  const exclusionSizes = Array.from({ length: 6 }, (_, index) => {
    const zone = exclusionZones[index];
    return new THREE.Vector2(zone?.size?.[0] || 0, zone?.size?.[1] || 0);
  });
  const exclusionRotations = Array.from({ length: 6 }, (_, index) => exclusionZones[index]?.rotation || 0);

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    uniforms: {
      uSensorCount: { value: Math.min(sensorPoints.length, 6) },
      uSensorPositions: { value: positions },
      uSensorColors: { value: colors },
      uOpacity: { value: opacity },
      // The marked N5 corridor is longer than the sensor spacing. Keep full
      // colour through the corridor, then taper it only near the far end.
      uFalloffStart: { value: 8.0 },
      uFalloffEnd: { value: 12.0 },
      uExclusionCount: { value: Math.min(exclusionZones.length, 6) },
      uExclusionCenters: { value: exclusionCenters },
      uExclusionSizes: { value: exclusionSizes },
      uExclusionRotations: { value: exclusionRotations },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform int uSensorCount;
      uniform vec2 uSensorPositions[6];
      uniform vec3 uSensorColors[6];
      uniform float uOpacity;
      uniform float uFalloffStart;
      uniform float uFalloffEnd;
      uniform int uExclusionCount;
      uniform vec2 uExclusionCenters[6];
      uniform vec2 uExclusionSizes[6];
      uniform float uExclusionRotations[6];
      varying vec3 vWorldPosition;
      void main() {
        for (int i = 0; i < 6; i++) {
          if (i >= uExclusionCount) break;
          vec2 d = vWorldPosition.xz - uExclusionCenters[i];
          float c = cos(-uExclusionRotations[i]);
          float s = sin(-uExclusionRotations[i]);
          vec2 local = vec2(d.x * c - d.y * s, d.x * s + d.y * c);
          if (abs(local.x) <= uExclusionSizes[i].x * 0.5 && abs(local.y) <= uExclusionSizes[i].y * 0.5) {
            discard;
          }
        }

        vec3 mixedColor = vec3(0.0);
        float totalWeight = 0.0;
        float nearest = 1.0e9;
        for (int i = 0; i < 6; i++) {
          if (i >= uSensorCount) break;
          float d = distance(vWorldPosition.xz, uSensorPositions[i]);
          float w = 1.0 / pow(max(d, 0.2), 2.0);
          mixedColor += uSensorColors[i] * w;
          totalWeight += w;
          nearest = min(nearest, d);
        }
        mixedColor = totalWeight > 0.0 ? mixedColor / totalWeight : vec3(0.45, 1.0, 0.35);
        float fade = 1.0 - smoothstep(uFalloffStart, uFalloffEnd, nearest);
        if (fade <= 0.001) discard;
        gl_FragColor = vec4(mixedColor, uOpacity * fade);
      }
    `,
  });
}

// Meshes we never want to paint, regardless of shape.
const NON_FLOOR_HINTS = [
  'wall', 'masonry', 'ceiling', 'roof', 'door', 'glass', 'curtain',
  'column', 'railing', 'lift', 'elevator', 'furniture', 'sofa', 'seat',
];

// This GLB exposes the physical floor slabs, so no hand-drawn exclusions are
// required. Keep the structure so an alternate model can add them if needed.
const HEATMAP_EXCLUSION_ZONES = {
  North: [],
  South: [],
};

// Collects every floor slab in the model. Named floors are taken directly;
// anything else qualifies if it is thin in Y, wide in XZ and sits near the
// bottom of the model — which catches the slabs under IAQ002 and IAQ003 that
// a material-name-only filter used to miss.
function getFloorOverlayGeometries(model, { debug = false } = {}) {
  if (!model) return [];
  const scene = model.scene;
  scene.updateWorldMatrix(true, true);

  const modelBox = new THREE.Box3().setFromObject(scene);
  const floorY = modelBox.min.y;
  const modelHeight = Math.max(modelBox.max.y - modelBox.min.y, 0.001);

  const geometries = [];
  scene.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;

    const meshName = (obj.name || '').toLowerCase();
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    const materialNames = materials.map((m) => (m?.name || '').toLowerCase()).join(' ');
    const haystack = `${meshName} ${materialNames}`;

    const explicitFloor =
      haystack.includes('oak flooring') ||
      haystack.includes('floorplan') ||
      haystack.includes('floor_plan') ||
      haystack.includes('floor') ||
      haystack.includes('slab');

    if (!explicitFloor && NON_FLOOR_HINTS.some((hint) => haystack.includes(hint))) return;
    if (explicitFloor && (haystack.includes('wall') || haystack.includes('ceiling'))) return;

    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const footprint = size.x * size.z;

    const isThin = size.y <= Math.max(modelHeight * 0.06, 0.25);
    const isLow = box.min.y <= floorY + modelHeight * 0.25;
    const isBigEnough = footprint > 0.6;

    if (!(explicitFloor || (isThin && isLow && isBigEnough))) return;
    if (!isLow) return; // never paint ceilings, even if named "floor"

    if (debug) {
      // eslint-disable-next-line no-console
      console.log(
        '[heat floor]', obj.name || '(unnamed)',
        '| mat:', materialNames || '(none)',
        '| y:', box.min.y.toFixed(2),
        '| area:', footprint.toFixed(2)
      );
    }

    const geometry = obj.geometry.clone();
    geometry.applyMatrix4(obj.matrixWorld);
    geometries.push({ id: obj.uuid, geometry });
  });

  return geometries;
}

function HeatLayer({ visible, selectedLayer, visibleSensors, model }) {
  const groupRef = useRef(null);
  const guidelineHeatLayers = ['CO2', 'PM2.5', 'PM10', 'TVOC'];
  const metricHeatLayers = ['Temperature', 'Humidity', ...guidelineHeatLayers];

  // Fallback-only mask rectangles, used if the model exposes no floor slabs.
  const isNorthTower = visibleSensors.some((sensor) => sensor.tower === 'North');
  const isSouthTower = visibleSensors.some((sensor) => sensor.tower === 'South');
  const towerExclusionZones = isNorthTower ? HEATMAP_EXCLUSION_ZONES.North : isSouthTower ? HEATMAP_EXCLUSION_ZONES.South : [];

  const maskZones = useMemo(() => {
    if (isNorthTower) {
      return [
        { position: [2.28, 0.18, 0.36], size: [3.35, 4.65], rotation: -0.05 },
        { position: [2.35, 0.18, -0.98], size: [6.35, 2.25], rotation: -0.03 },
        { position: [0.42, 0.18, -1.16], size: [3.15, 2.55], rotation: 0.02 },
        { position: [-1.78, 0.18, 0.98], size: [4.35, 1.85], rotation: 0.05 },
        { position: [1.3, 0.18, -1.62], size: [3.4, 2.35], rotation: 0.01 },
      ];
    }
    if (isSouthTower) {
      return [
        { position: [3.55, 0.18, -0.55], size: [2.6, 3.55], rotation: 0.02 },
        { position: [2.8, 0.18, -3.75], size: [2.35, 1.1], rotation: 0.02 },
      ];
    }
    return [];
  }, [isNorthTower, isSouthTower]);

  const colorForMetricValue = useCallback(
    (value) => {
      if (selectedLayer === 'Humidity') return humidityColor(value);
      if (guidelineHeatLayers.includes(selectedLayer)) return iaqGuidelineColor(selectedLayer, value);
      return temperatureColor(value);
    },
    [selectedLayer]
  );

  const sensorPoints = useMemo(
    () =>
      visibleSensors.map((sensor) => ({
        id: sensor.id,
        x: sensor.pos[0],
        z: sensor.pos[2],
        color: colorForMetricValue(sensor.readings?.[selectedLayer]),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      selectedLayer,
      colorForMetricValue,
      visibleSensors.map((s) => `${s.id}:${s.readings?.[selectedLayer]}`).join(','),
    ]
  );

  const heatResult = useMemo(() => {
    if (!metricHeatLayers.includes(selectedLayer) || maskZones.length === 0 || sensorPoints.length === 0) {
      return null;
    }
    return buildHeatTexture({ maskZones, sensorPoints });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayer, maskZones, sensorPoints]);

  const floorGeometries = useMemo(
    () => getFloorOverlayGeometries(model, { debug: DEBUG_FLOOR_PICKS }),
    [model]
  );
  const floorMaterial = useMemo(
    () => makeFloorHeatMaterial(sensorPoints, towerExclusionZones, 0.62),
    [sensorPoints, towerExclusionZones]
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.visible = visible;
    groupRef.current.children.forEach((child) => {
      if (!child.material) return;
      const baseOpacity = child.userData.baseOpacity ?? 0.85;
      child.material.opacity = baseOpacity + Math.sin(clock.elapsedTime) * 0.04;
    });
  });

  // Primary path: paint the real floor slabs, every sensor included.
  if (metricHeatLayers.includes(selectedLayer) && floorGeometries.length > 0) {
    return (
      <group ref={groupRef} renderOrder={35} visible={visible}>
        {floorGeometries.map(({ id, geometry }) => (
          <mesh key={id} geometry={geometry} material={floorMaterial} />
        ))}
      </group>
    );
  }

  if (heatResult) {
    const { texture, bounds } = heatResult;
    const width = bounds.maxX - bounds.minX;
    const depth = bounds.maxZ - bounds.minZ;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;

    return (
      <group ref={groupRef}>
        <mesh rotation-x={-Math.PI / 2} position={[centerX, 0.24, centerZ]} userData={{ baseOpacity: 0.78 }}>
          <planeGeometry args={[width, depth]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={0.78}
            side={THREE.DoubleSide}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      </group>
    );
  }

  // Fallback "no parameter data yet" ambient overview blobs.
  return (
    <group ref={groupRef}>
      <mesh rotation-x={-Math.PI / 2} position={[-3.25, 0.04, 0.1]} scale={[1.45, 0.72, 1]} userData={{ baseOpacity: 0.24 }}>
        <circleGeometry args={[4.2, 96]} />
        <meshBasicMaterial color="#76ff5a" transparent opacity={0.24} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[3.25, 0.05, 0.1]} scale={[1.45, 0.72, 1]} userData={{ baseOpacity: 0.24 }}>
        <circleGeometry args={[4.2, 96]} />
        <meshBasicMaterial color="#ffbf39" transparent opacity={0.24} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.06, 0.05]} scale={[0.72, 1.08, 1]} userData={{ baseOpacity: 0.16 }}>
        <circleGeometry args={[3.4, 96]} />
        <meshBasicMaterial color="#e9f56a" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Mask calibration tool
//
// Temporary developer utility: when active, clicking anywhere on the model
// floor logs the exact world (x, z) coordinate under the cursor to the
// console, formatted ready to paste into a polygon array. Still handy for
// checking sensor placement against the real floor outline.
// ---------------------------------------------------------------------------
function MaskCalibrator({ active, onPoint }) {
  const { gl } = useThree();

  useEffect(() => {
    gl.domElement.style.cursor = active ? 'crosshair' : 'auto';
    return () => {
      gl.domElement.style.cursor = 'auto';
    };
  }, [active, gl]);

  const handleClick = useCallback(
    (e) => {
      if (!active) return;
      e.stopPropagation();
      const { x, z } = e.point;
      const line = `{ x: ${x.toFixed(2)}, z: ${z.toFixed(2)} },`;
      // eslint-disable-next-line no-console
      console.log(line);
      onPoint?.({ x: Number(x.toFixed(2)), z: Number(z.toFixed(2)) });
    },
    [active, onPoint]
  );

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} onClick={handleClick} visible={false}>
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial />
    </mesh>
  );
}

// Visual markers + connecting outline for points collected during calibration,
// so you can see the traced polygon forming on top of the model.
function CalibrationTrace({ points }) {
  if (!points.length) return null;
  const linePoints = points.map((p) => new THREE.Vector3(p.x, 0.18, p.z));
  if (points.length > 2) linePoints.push(linePoints[0]);

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={[p.x, 0.2, p.z]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color="#ff3df0" />
        </mesh>
      ))}
      {points.length > 1 && (
        <line>
          <bufferGeometry attach="geometry" onUpdate={(geo) => geo.setFromPoints(linePoints)} />
          <lineBasicMaterial attach="material" color="#ff3df0" />
        </line>
      )}
    </group>
  );
}

function prepareBimModel(gltf) {
  const scene = gltf.scene;
  scene.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.filter(Boolean).forEach((material) => {
      const name = (material.name || '').toLowerCase();
      material.side = THREE.DoubleSide;
      if ('metalness' in material) material.metalness = Math.min(material.metalness ?? 0, 0.18);
      if ('roughness' in material) material.roughness = Math.max(material.roughness ?? 0.7, 0.58);
      ['map', 'emissiveMap', 'aoMap', 'roughnessMap', 'metalnessMap', 'normalMap'].forEach((slot) => {
        const texture = material[slot];
        if (!texture) return;
        texture.anisotropy = 16;
        texture.needsUpdate = true;
        if (slot === 'map' || slot === 'emissiveMap') texture.colorSpace = THREE.SRGBColorSpace;
      });
      if (material.color) {
        if (name.includes('wood') || name.includes('oak')) material.color.set('#dca34d');
        else if (name.includes('concrete masonry') || name.includes('marble dark')) material.color.set('#343632');
        else if (name.includes('precast')) material.color.set('#d8d0bd');
        else if (name.includes('cast')) material.color.set('#eee3c5');
        else if (name.includes('aluminium')) material.color.set('#cbc6b8');
        else if (name.includes('floor')) material.color.set('#eee9d8');
      }
      if (name.includes('glass')) {
        material.transparent = true;
        material.opacity = 0.32;
        material.depthWrite = false;
      }
      material.needsUpdate = true;
    });
  });

  // Auto-center and normalize scale so any model lands centered on the grid.
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const targetSize = 16;
  const scale = targetSize / maxDim;

  scene.scale.setScalar(scale);
  scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

  return Math.max((size.length() / 2) * scale, 4);
}

function SensorMarker({ sensor, selectedLayer, selected, onSelect }) {
  const ringRef = useRef(null);
  const color = sensorToneColor[sensor.tone] || '#ffffff';
  const labelOffset = sensor.labelOffset || [0, 0.5, 0];
  const layerValue = metricDisplay(selectedLayer, sensor.readings?.[selectedLayer]);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 2 + sensor.pos[0]) * 0.12;
    ringRef.current.scale.setScalar(pulse);
  });

  return (
    <group position={sensor.pos}>
      <mesh
        ref={ringRef}
        position={[0, 0.24, 0]}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect(sensor);
        }}
      >
        <sphereGeometry args={[0.24, 28, 20]} />
        <meshStandardMaterial
          color={selected ? '#ffffff' : color}
          emissive={color}
          emissiveIntensity={0.72}
          metalness={0.18}
          roughness={0.24}
        />
      </mesh>
      <Html
        transform
        sprite
        center
        position={labelOffset}
        scale={1.15}
        occlude={false}
        style={{ pointerEvents: 'auto' }}
      >
        <div
          className={`sensor-label ${selected ? 'selected' : ''}`}
          style={{ '--sensor-color': color }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(sensor);
          }}
        >
          <strong>{sensor.id}</strong>
          <span>{selectedLayer} {layerValue}</span>
        </div>
      </Html>
    </group>
  );
}

function BimModel({ model }) {
  return <primitive object={model.scene} />;
}

function BimScene({
  heatmap,
  controlsRef,
  model,
  visibleSensors,
  selectedLayer,
  selectedSensor,
  onSelectSensor,
  calibrating,
  calibrationPoints,
  onCalibrationPoint,
}) {
  return (
    <>
      <color attach="background" args={['#020506']} />
      <fog attach="fog" args={['#020506', 28, 64]} />
      <ambientLight intensity={1.05} />
      <hemisphereLight args={['#fff7df', '#2a251c', 1.35]} />
      <directionalLight position={[7, 12, 7]} intensity={2.1} color="#ffe9bc" castShadow />
      <directionalLight position={[-5, 7, -4]} intensity={0.9} color="#e9f4ff" />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.055, 0]}>
        <planeGeometry args={[24, 16]} />
        <meshBasicMaterial color="#081113" transparent opacity={0.62} depthWrite={false} />
      </mesh>
      <gridHelper args={[24, 44, '#2f4e52', '#102024']} position={[0, -0.03, 0]} />
      <HeatLayer visible={heatmap} selectedLayer={selectedLayer} visibleSensors={visibleSensors} model={model} />
      {model && <BimModel model={model} />}
      {model &&
        visibleSensors.map((sensor) => (
          <SensorMarker
            key={sensor.id}
            sensor={sensor}
            selectedLayer={selectedLayer}
            selected={selectedSensor?.id === sensor.id}
            onSelect={onSelectSensor}
          />
        ))}
      <MaskCalibrator active={calibrating} onPoint={onCalibrationPoint} />
      <CalibrationTrace points={calibrationPoints} />
      <OrbitControls ref={controlsRef} makeDefault enableDamping maxPolarAngle={Math.PI * 0.48} enabled={!calibrating} />
    </>
  );
}

function ModelViewer({ heatmap, tower, dashboardSensors, selectedLayer }) {
  const controlsRef = useRef(null);
  const [loadState, setLoadState] = useState('Loading BIM model');
  const [modelRadius, setModelRadius] = useState(8);
  const [model, setModel] = useState(null);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const visibleSensors = dashboardSensors.filter((sensor) => `${sensor.tower} Tower` === tower);
  const legend = layerLegends[selectedLayer] || layerLegends.CO2;

  const frameModel = useCallback((radius) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const dist = radius * 1.52;
    controls.object.position.set(0, radius * 1.02, dist);
    controls.target.set(0, radius * 0.08, 0);
    controls.minDistance = radius * 0.35;
    controls.maxDistance = radius * 4.5;
    controls.object.updateProjectionMatrix();
    controls.update();
  }, []);

  const handleModelReady = useCallback((radius) => {
    setModelRadius(radius);
    setLoadState('BIM model online');
    // One frame later guarantees the OrbitControls ref is settled.
    requestAnimationFrame(() => frameModel(radius));
  }, [frameModel]);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    setLoadState('Loading BIM model 0%');
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (cancelled) return;
        const radius = prepareBimModel(gltf);
        setModel(gltf);
        handleModelReady(radius);
      },
      (event) => {
        if (cancelled || !event.total) return;
        setLoadState(`Loading BIM model ${Math.round((event.loaded / event.total) * 100)}%`);
      },
      (error) => {
        if (cancelled) return;
        console.error('BIM model failed to load:', error);
        setLoadState('Model failed to load');
      }
    );

    const id = window.setTimeout(() => {
      if (!cancelled) {
        setLoadState((current) =>
          current.startsWith('Loading BIM model') ? 'BIM model still preparing' : current
        );
      }
    }, 15000);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  const resetView = () => frameModel(modelRadius);

  useEffect(() => {
    if (selectedSensor && !visibleSensors.some((sensor) => sensor.id === selectedSensor.id)) {
      setSelectedSensor(null);
    }
  }, [selectedSensor, visibleSensors]);

  // Clear traced points when switching towers so North/South don't mix.
  useEffect(() => {
    setCalibrationPoints([]);
  }, [tower]);

  const toggleCalibrating = () => {
    setCalibrating((c) => {
      const next = !c;
      if (next) {
        // eslint-disable-next-line no-console
        console.log(`--- Calibrating ${tower}: click each floor corner in order ---`);
      }
      return next;
    });
  };

  const undoLastPoint = () => setCalibrationPoints((pts) => pts.slice(0, -1));
  const clearPoints = () => setCalibrationPoints([]);

  return (
    <div className="model-wrap">
      <div className="model-canvas">
        <Canvas
          camera={{ position: [0, 9, 12], fov: 35, near: 0.1, far: 2000 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, outputColorSpace: THREE.SRGBColorSpace }}
          shadows
        >
          <BimScene
            heatmap={heatmap}
            controlsRef={controlsRef}
            model={model}
            visibleSensors={visibleSensors}
            selectedLayer={selectedLayer}
            selectedSensor={selectedSensor}
            onSelectSensor={setSelectedSensor}
            calibrating={calibrating}
            calibrationPoints={calibrationPoints}
            onCalibrationPoint={(p) => setCalibrationPoints((pts) => [...pts, p])}
          />
        </Canvas>
      </div>
      <div className="co2-scale" style={{ '--legend-columns': legend.ticks.length }}>
        <span>{legend.title}</span>
        <div style={{ '--legend-gradient': legend.gradient }} />
        {legend.ticks.map((tick) => <small key={tick}>{tick}</small>)}
      </div>
      {loadState !== 'BIM model online' && (
        <div className={`model-status ${loadState.includes('failed') ? 'warn' : ''}`}>{loadState}</div>
      )}
      {selectedSensor && (
        <div className="sensor-detail">
          <button className="sensor-detail-close" onClick={() => setSelectedSensor(null)} aria-label="Close">×</button>
          <strong>{selectedSensor.id}</strong>
          <span>{selectedSensor.tower} Tower - Level 5</span>
          <span>{selectedLayer}: {metricDisplay(selectedLayer, selectedSensor.readings?.[selectedLayer])}</span>
          <div className="sensor-detail-grid">
            {metricConfig.map(({ name }) => (
              <span key={name}><b>{name}</b>{metricDisplay(name, selectedSensor.readings?.[name])}</span>
            ))}
          </div>
          <span className={`sensor-detail-tag ${selectedSensor.tone}`}>
            {selectedSensor.tone === 'green' ? 'Excellent' : selectedSensor.tone === 'gold' ? 'Good' : 'Monitor'}
          </span>
        </div>
      )}
      <div className="compass" aria-label="North compass">
        <span className="compass-label">N</span>
        <span className="compass-needle north" />
        <span className="compass-needle south" />
        <span className="compass-cross horizontal" />
        <span className="compass-cross vertical" />
      </div>
      {calibrating && (
        <div className="model-status">
          Calibrating {tower} — click each floor corner in order ({calibrationPoints.length} points). Check console for logged coordinates.
        </div>
      )}
      <div className="model-tools">
        <span><Hand size={15} />Drag to rotate</span>
        <span><Mouse size={15} />Scroll to zoom</span>
        <span><MousePointer2 size={15} />Click sensor for details</span>
        <button onClick={resetView}><RotateCcw size={15} />Reset View</button>
        {/* <button onClick={toggleCalibrating} className={calibrating ? 'active' : ''}>
          {calibrating ? 'Stop Calibrating' : 'Calibrate Mask'}
        </button>
        {calibrating && (
          <>
            <button onClick={undoLastPoint}>Undo Point</button>
            <button onClick={clearPoints}>Clear Points</button>
          </>
        )} */}
      </div>
    </div>
  );
}

function Panel({ title, children, glow = 'gold', className = '', info = false }) {
  return (
    <section className={`panel ${glow} ${className}`}>
      {title && (
        <h2>
          <span>{title}</span>
          {info && <Info size={13} className="panel-info" />}
        </h2>
      )}
      {children}
    </section>
  );
}

// Calendar popover for choosing which day's data the dashboard is showing.
function DatePicker({ date, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date(date.getFullYear(), date.getMonth(), 1));
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const cells = [...Array(startDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const isSelected = (day) =>
    day === date.getDate() &&
    viewMonth.getMonth() === date.getMonth() &&
    viewMonth.getFullYear() === date.getFullYear();

  const shiftMonth = (delta) =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1));

  return (
    <div className="date-picker" ref={wrapRef}>
      <button className="status-pill" onClick={() => setOpen((o) => !o)}>
        <CalendarDays size={17} />
        {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </button>
      {open && (
        <div className="calendar-pop">
          <div className="calendar-head">
            <button onClick={() => shiftMonth(-1)} aria-label="Previous month">&#8249;</button>
            <span>{viewMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => shiftMonth(1)} aria-label="Next month">&#8250;</button>
          </div>
          <div className="calendar-grid dow">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {cells.map((day, i) =>
              day ? (
                <button
                  key={i}
                  className={isSelected(day) ? 'active' : ''}
                  onClick={() => {
                    onChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
                    setOpen(false);
                  }}
                >
                  {day}
                </button>
              ) : (
                <span key={i} />
              )
            )}
          </div>
          <button
            className="calendar-today"
            onClick={() => {
              const today = new Date();
              setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              onChange(today);
              setOpen(false);
            }}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}

const layerOptions = [
  { label: 'Temperature', unit: '°C', Icon: Thermometer },
  { label: 'Humidity', unit: '%RH', Icon: Droplets },
  { label: 'CO2', unit: 'ppm', Icon: Cloud },
  { label: 'PM2.5', unit: 'µg/m³', Icon: Wind },
  { label: 'PM10', unit: 'µg/m³', Icon: Snowflake },
  { label: 'TVOC', unit: 'µg/m³', Icon: Factory },
];

function IAQ() {
  const now = useClock();
  const hkWeather = useHkWeather();
  const sensorData = useSensorData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tower, setTower] = useState('North Tower');
  const [floor, setFloor] = useState('L5');
  const [layer, setLayer] = useState('CO2');
  const [heatmap, setHeatmap] = useState(true);
  const [activeNav, setActiveNav] = useState('Overview');
  const readings = sensorData?.readings || {};
  const latestUpdate = formatTimeFromTimestamp(sensorData?.timestamp);
  const dashboardSensors = sensors.map((sensor) => ({
    ...sensor,
    readings: readings[sensor.id] || {},
    co2: readings[sensor.id]?.CO2 ?? sensor.co2,
    battery: readings[sensor.id]?.Battery,
    rssi: readings[sensor.id]?.RSSI,
  }));
  const towerSensors = dashboardSensors.filter((sensor) => `${sensor.tower} Tower` === tower);
  const currentSummary = metricConfig.map(({ name, well, unit, Icon, digits }) => {
    const avg = average(towerSensors.map((sensor) => readings[sensor.id]?.[name]));
    return [name, well, formatMetric(avg, unit, digits), metricStatus(name, avg), metricComplies(name, avg), Icon];
  });
  const metricComparisonRows = ['CO2', 'PM2.5', 'PM10', 'TVOC', 'Temperature', 'Humidity'].map((metric) => {
    const config = metricConfig.find((item) => item.name === metric);
    const north = average(dashboardSensors.filter((sensor) => sensor.tower === 'North').map((sensor) => readings[sensor.id]?.[metric]));
    const south = average(dashboardSensors.filter((sensor) => sensor.tower === 'South').map((sensor) => readings[sensor.id]?.[metric]));
    const diff = Number.isFinite(north) && Number.isFinite(south) ? north - south : null;
    const digits = config?.digits ?? 0;
    return [
      `${metric} (${config?.unit || ''})`,
      Number.isFinite(north) ? north.toFixed(digits) : '--',
      Number.isFinite(south) ? south.toFixed(digits) : '--',
      Number.isFinite(diff) ? `${diff >= 0 ? '+' : ''}${diff.toFixed(digits)}` : '--',
    ];
  });
  const comparisons = sensorData ? [['IAQ Score', '96 /100', '94 /100', '+2'], ...metricComparisonRows] : fallbackComparisons;

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">
          <img className="lion" src={logo} alt="MGM" />
          <div>
            <h1>MGM COTAI</h1>
            <p>INDOOR AIR QUALITY (IAQ) COMMAND CENTER</p>
            <span>HOTEL TOWERS LIFT LOBBY MONITORING</span>
          </div>
        </div>
        <div className="status-strip">
          <DatePicker date={selectedDate} onChange={setSelectedDate} />
          <span className="status-pill">
            <Clock size={17} />
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="status-pill">
            <Thermometer size={17} />
            {hkWeather.temp != null ? `${hkWeather.temp} C` : '-- C'}
          </span>
          <span className="status-pill">
            <Droplets size={17} />
            {hkWeather.humidity != null ? `${hkWeather.humidity}% RH` : '--% RH'}
          </span>
          <span className="status-pill live">
            <Wifi size={17} />
            LIVE
          </span>
        </div>
      </header>

      <div className="content-grid">
        <aside className="left-stack">
          <Panel title="OVERALL IAQ SCORE" info>
            <div className="score-ring-wrap">
              <div className="score-ring" />
              <div className="score-content">
                <div className="score-number">96</div>
                <small>/100</small>
                <span className="score-label">EXCELLENT</span>
                <div className="stars">★★★★★</div>
              </div>
            </div>
            <div className="cert">
              <div>WELL<br />PLATINUM<br />2026</div>
              <p><strong>WELL PLATINUM CERTIFIED</strong><br />HEALTHY AIR<br />HEALTHY GUESTS</p>
            </div>
          </Panel>
          <Panel title="NORTH vs SOUTH COMPARISON" glow="cyan" className="comparison-panel">
            <table>
              <thead><tr><th>Parameter</th><th>North</th><th>South</th><th>Diff</th></tr></thead>
              <tbody>{comparisons.map((row) => (
                <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td></tr>
              ))}</tbody>
            </table>
          </Panel>
          <Panel title="CURRENT IAQ SUMMARY" glow="green" className="iaq-summary-panel">
            <table>
              <thead><tr><th>Parameter</th><th>Target (WELL)</th><th>Current</th><th>Status</th><th>Compliance</th></tr></thead>
              <tbody>{currentSummary.map(([name, well, value, status, complies, Icon]) => (
                <tr key={name}>
                  <td><span className="param-label"><Icon size={14} />{name}</span></td>
                  <td>{well}</td>
                  <td>{value}</td>
                  <td><i />{status}</td>
                  <td className={complies ? 'pass' : 'watch'}><CheckCircle2 size={12} />{complies ? 'PASS' : 'WATCH'}</td>
                </tr>
              ))}</tbody>
            </table>
            <div className="summary-compliance">OVERALL COMPLIANCE <strong>98%</strong></div>
          </Panel>
        </aside>

        <div className="filters panel gold top-filters">
          <div><label>Tower</label><div className="seg">{['North Tower', 'South Tower'].map((item) => <button className={tower === item ? 'active' : ''} onClick={() => setTower(item)} key={item}>{item}</button>)}</div></div>
          <div><label>Floor</label><div className="seg compact">{['L5', 'L18', 'L26', 'PD14', 'PE05'].map((item) => <button className={floor === item ? 'active' : ''} onClick={() => setFloor(item)} key={item}>{item}</button>)}</div></div>
          <div><label>View Mode</label><div className="seg"><button className={heatmap ? 'active' : ''} onClick={() => setHeatmap(true)}>BIM + Heatmap</button><button className={!heatmap ? 'active' : ''} onClick={() => setHeatmap(false)}>BIM Only</button></div></div>
          <div><label>Parameter Layer</label><div className="layer-row">{layerOptions.map(({ label, unit, Icon }) => <button className={layer === label ? 'active' : ''} onClick={() => setLayer(label)} key={label}><Icon size={14} /><span>{label}</span><small>{unit}</small></button>)}</div></div>
        </div>

        <section className="center-stage">
          <Panel title="BIM MODEL - HOTEL TOWER LIFT LOBBY (LEVEL 5)" className="model-panel" info>
            <ModelViewer heatmap={heatmap} tower={tower} dashboardSensors={dashboardSensors} selectedLayer={layer} />
          </Panel>
          <div className="lower-panels sensor-only">
            <Panel title="SENSOR STATUS" glow="blue" className="sensor-status-panel">
              <table>
                <thead><tr><th>Location</th><th>Status</th><th>Last Update</th></tr></thead>
                <tbody>{dashboardSensors.map((s) => <tr key={s.id}><td>{s.id}</td><td><i />Online</td><td>{latestUpdate}</td></tr>)}</tbody>
              </table>
              <div className="network">
                <span className="network-label">NETWORK STATUS <span className="signal-bars" aria-hidden="true"><b /><b /><b /><b /></span></span>
                <span>100%</span>
              </div>
            </Panel>
          </div>
        </section>

        <aside className="right-stack">
          <section className="panel blue trend-panel">
            <div className="trend-panel-head">
              <h2>IAQ TRENDS (Last 24 Hours)</h2>
              <button className="range-select">Last 24 Hours <ChevronDown size={13} /></button>
            </div>
            <div className="trend-list">
              {trendSeries.map(({ label, unit, value, color, yTicks }, i) => (
                <div className="trend" key={label}>
                  <div className="trend-head">
                    <span style={{ color }}>{label} ({unit})</span>
                    <strong style={{ color }}>
                      {value}
                      <small>{unit}</small>
                    </strong>
                  </div>
                  <div className="trend-body">
                    <div className="trend-yaxis">
                      {yTicks.map((tick) => (
                        <span key={tick}>{tick}</span>
                      ))}
                    </div>
                    <div className="trend-chart-wrap">
                      <MiniChart color={color} seed={i + 2} />
                      <div className="trend-xaxis">
                        {trendXAxis.map((t, idx) => (
                          <span key={`${t}-${idx}`}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <Panel title="INDOOR vs OUTDOOR COMPARISON" glow="cyan">
            <table>
              <thead><tr><th>Parameter</th><th>Outdoor</th><th>Indoor</th><th>Diff</th></tr></thead>
              <tbody>{[['CO2', '430', '620', '+190'], ['PM2.5', '28', '8', '-20'], ['PM10', '65', '15', '-50'], ['TVOC', '350', '110', '-240'], ['Temperature', '29.0', '23.5', '-5.5'], ['Humidity', '68', '52', '-16']].map((r) => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody>
            </table>
          </Panel>
          <Panel title="ALERTS & NOTIFICATIONS" glow="red">
            <div className="alert-ok"><CheckCircle2 />All systems normal.<br /><span>No active IAQ alerts.</span></div>
            <div className="maintenance"><AlertTriangle size={18} />UPCOMING MAINTENANCE<br /><span>Next sensor calibration: N-03 - 12 Jun 2026</span></div>
          </Panel>
        </aside>
      </div>

      <nav className="bottom-nav">
        {[[Home, 'Overview'], [Layers3, 'Floor Plan'], [BarChart3, 'Historical Data'], [FileText, 'Reports'], [MonitorCog, 'System Status'], [Settings, 'Settings']].map(([Icon, label]) => (
          <button className={activeNav === label ? 'active' : ''} onClick={() => setActiveNav(label)} key={label}><Icon size={20} />{label}</button>
        ))}
        <span>HEALTHY AIR - HEALTHY PEOPLE - SUSTAINABLE MGM</span>
      </nav>
    </main>
  );
}

export default IAQ
