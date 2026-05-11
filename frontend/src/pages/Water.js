




import React, { useEffect, useMemo, useState,useRef,useLayoutEffect } from "react";
import "../pages/UtilityLayout.css";
import ChartDataLabels from "chartjs-plugin-datalabels";
import MultipleYearComparison from "./MultiYearComparison";
import Papa from "papaparse";
import { Bar, Doughnut } from "react-chartjs-2";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from "react-router-dom";

// Import images from assets
import checkIcon from '../../src/assets/icons/energyDG.png';
import warningIcon from '../../src/assets/icons/gasHovered.png';
import infoIcon from '../../src/assets/icons/waterHovered.png';
import alertIcon from '../../src/assets/icons/electricityHovered.png';
import WaterMultipleYearComparison from "./WaterMultipleYearComparison";
import DownloadIcon from "@mui/icons-material/Download"; 
import { IconButton } from "@mui/material";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Container, Row, Col, Form, Table, Button } from "react-bootstrap";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const MONTHS_ORDER = [
  "January","February","March","April",
  "May","June","July","August",
  "September","October","November","December"
];

const WATER_COST_COLUMNS = {
  Cotai: ["Water Cost"],
  Macho: ["Water Cost"]
};

/* ── Water breakdown files per site ───────────────────────── */
const BREAKDOWN_FILES = {
  Cotai: "Cotai_Water_Breakdown.csv",
  Macho: "Macho_Water_Breakdown.csv", // or "Macau_Water_Breakdown.csv" if that's your name
};


// Water column mappings for different sites
const WATER_COLUMNS = {
  Cotai: {
    actual: ["Actual Water Consumption", "Actual Water Consumption_m3"],
    normalized: ["Normalized Water Consumption", "Normalized Water Consumption_m3"]
  },
  Macho: {
    actual: ["Actual Water Consumption", "Actual Water Consumption_m3"],
    normalized: ["Normalized Water Consumption", "Normalized Water Consumption_m3"]
  }
};

// Header aliases (so All Sites works even if headers differ slightly)
const WATER_ACT_ALIASES = [
  "Actual Water Consumption", "Actual Water Consumption (m3)",
  "Actual Water Consumption_m3", "Water Consumption (m3)"
];

const WATER_NORM_ALIASES = [
  "Normalized Water Consumption", "Normalized Water Consumption (m3)",
  "Normalized Water Consumption_m3"
];

const WATER_COST_ALIASES = [
  "Water Cost", "Actual Water Cost (MOP)", "Water Cost (MOP)"
];

const CDD_ALIASES = ["CDD", "Cooling Degree Days"];
const FOOD_COVER_ALIASES = ["Food Cover", "Food Cover (count)"];

/** ---- helper to sync all three table header rows' heights exactly ---- */
function useSyncHeaderHeights(rowA1Ref, rowA2Ref, rowB1Ref, rowB2Ref, rowC1Ref, rowC2Ref, deps) {
  useLayoutEffect(() => {
    const rows = [rowA1Ref.current, rowA2Ref.current, rowB1Ref.current, rowB2Ref.current, rowC1Ref.current, rowC2Ref.current];
    if (rows.some(r => !r)) return;

    const clearHeights = () => {
      rows.forEach(r => {
        r.style.height = "";
        r.querySelectorAll("th,td").forEach(c => (c.style.height = ""));
      });
    };

    const apply = () => {
      clearHeights();
      const hA1 = rowA1Ref.current.getBoundingClientRect().height;
      const hA2 = rowA2Ref.current.getBoundingClientRect().height;
      const hB1 = rowB1Ref.current.getBoundingClientRect().height;
      const hB2 = rowB2Ref.current.getBoundingClientRect().height;
      const hC1 = rowC1Ref.current.getBoundingClientRect().height;
      const hC2 = rowC2Ref.current.getBoundingClientRect().height;
      const max1 = Math.max(hA1, hB1, hC1);
      const max2 = Math.max(hA2, hB2, hC2);

      [rowA1Ref.current, rowB1Ref.current, rowC1Ref.current].forEach(r => {
        r.style.height = `${max1}px`;
        r.querySelectorAll("th,td").forEach(c => (c.style.height = `${max1}px`));
      });
      [rowA2Ref.current, rowB2Ref.current, rowC2Ref.current].forEach(r => {
        r.style.height = `${max2}px`;
        r.querySelectorAll("th,td").forEach(c => (c.style.height = `${max2}px`));
      });
    };

    const raf = requestAnimationFrame(apply);
    const onResize = () => requestAnimationFrame(apply);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      clearHeights();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const Water = ({ onNavigateToUtility }) => {
  const navigate = useNavigate();
  const [waterData, setWaterData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [normalizedData, setNormalizedData] = useState([]);
  const [breakdownRaw, setBreakdownRaw] = useState([]);

  const [site, setSite] = useState(localStorage.getItem("selectedSite") || "Cotai");
  const [showNormalized, setShowNormalized] = useState(false);
  const [showCdd, setShowCdd] = useState(false);
  const [showFoodCover, setShowFoodCover] = useState(true);

  const [reportingYear, setReportingYear] = useState("2025");
  const [reportingMonth, setReportingMonth] = useState("December");
  const [currentView, setCurrentView] = useState("yearOnYear"); 
  const [baselineYear, setBaselineYear] = useState("2024");
  const isAll = site === "All";

  const actualHead1Ref = useRef(null);
  const actualHead2Ref = useRef(null);
  const normHead1Ref   = useRef(null);
  const normHead2Ref   = useRef(null);
  const breakdownHead1Ref = useRef(null);
  const breakdownHead2Ref = useRef(null);

  const thHeaderStyle = { backgroundColor:"#F5DEB3", border:"1px solid #8B4513", color:"black" };
  const toggleLabelStyle = { width: '160px', fontWeight: 500 };
  const toggleBtnBase = { width:'70px', padding:'2px 6px', fontSize:'0.85rem', marginRight:'8px', borderRadius:'2px' };
  const enableBtnStyle = { ...toggleBtnBase, backgroundColor:'#B1A265', border:'1px solid #8B4513', color:'#000' };
  const disableBtnStyle = { ...toggleBtnBase, backgroundColor:'#6c757d', border:'1px solid #5a6268', color:'#fff' };


  // identical to Utility (cache-busted + cleans Year/Month)
const parseCsv = (fileName) =>
  new Promise((resolve) => {
    Papa.parse(`${process.env.REACT_APP_BE_URL}/api/file/${fileName}?t=${Date.now()}`, {
      download: true,
      header: true,
      complete: ({ data }) => {
        const cleaned = (data || [])
          .map(row => ({
            ...row,
            Year: row.Year ? row.Year.toString().trim() : "",
            Month: row.Month ? row.Month.toString().trim() : "",
          }))
          .filter(d => d.Month && d.Year); // only valid rows
        resolve(cleaned);
      }
    });
  });


  // keep headers aligned any time labels/years change
  useSyncHeaderHeights(
    actualHead1Ref, actualHead2Ref,
    normHead1Ref, normHead2Ref,
    breakdownHead1Ref, breakdownHead2Ref,
    [baselineYear, reportingYear]
  );

  useEffect(() => {
    if (isAll) {
      setShowNormalized(false);   // never show normalized on All
      setShowCdd(false);          // hide CDD for All
      setShowFoodCover(true);     // Food Cover always ON for All
    }
  }, [isAll]);

  useEffect(() => {
    if (!breakdownRaw.length) return;
    const years = [...new Set(breakdownRaw.map(r => String(r.Year).trim()))];
    if (years.length && !years.includes(reportingYear)) {
      setReportingYear(years[years.length - 1]);
    }
  }, [breakdownRaw]);

  useEffect(() => {
    if (!waterData.length) return;
    const years = [...new Set(waterData.map(d => d.Year))];
    if (!years.includes(baselineYear)) {
      const prev = (parseInt(reportingYear) - 1).toString();
      setBaselineYear(years.includes(prev) ? prev : years[0]);
    }
  }, [waterData, reportingYear, baselineYear]);

  useEffect(() => {
    if (!reportingYear) return;
    const desired = String(Number(reportingYear) - 1);
    const years = [...new Set(waterData.map(d => d.Year))];
    let pick = desired;
    if (years.length && !years.includes(desired)) {
      const sorted = years.map(Number).sort((a, b) => a - b);
      const smaller = sorted.filter(y => y < Number(reportingYear));
      if (smaller.length) pick = String(smaller[smaller.length - 1]);
    }
    if (pick !== baselineYear) setBaselineYear(pick);
  }, [reportingYear, waterData]);

  useEffect(() => {
    const handleSiteChange = () => setSite(localStorage.getItem("selectedSite") || "Cotai");
    window.addEventListener("siteChange", handleSiteChange);
    return () => window.removeEventListener("siteChange", handleSiteChange);
  }, []);


useEffect(() => {
  const reload = () => {
    if (site !== "All") {
      Promise.all([
        parseCsv(`${site}_Cleaned_Consumption.csv`),
        parseCsv(`${site}_Cost_Corrected_Full.csv`),
        parseCsv(`${site}_Cleaned_Consumption.csv`), // if Normalized is in same file
      ]).then(([w, cost, norm]) => {
        setWaterData(w);
        setCostData(cost);
        setNormalizedData(norm);
      });
    } else {
      Promise.all([
        parseCsv(`Cotai_Cleaned_Consumption.csv`),
        parseCsv(`Macho_Cleaned_Consumption.csv`),
        parseCsv(`Cotai_Cost_Corrected_Full.csv`),
        parseCsv(`Macho_Cost_Corrected_Full.csv`),
      ]).then(([wCotai, wMacho, costCotai, costMacho]) => {
        const wAgg = aggregateAllSitesEnhanced(
          [...wCotai, ...wMacho],
          { sum: {
              "Actual Water Consumption": WATER_ACT_ALIASES,
              "Normalized Water Consumption": WATER_NORM_ALIASES
            } }
        );
        const costAgg = aggregateAllSitesEnhanced(
          [...costCotai, ...costMacho],
          { sum: { "Water Cost": WATER_COST_ALIASES },
            avg: { "CDD": CDD_ALIASES, "Food Cover": FOOD_COVER_ALIASES } }
        );
        setWaterData(wAgg);
        setCostData(costAgg);
        setNormalizedData([]); // not used in "All"
      });
    }
  };

  window.addEventListener("csvUpdated", reload);
  return () => window.removeEventListener("csvUpdated", reload);
}, [site]);

  

  /* load main csvs */
useEffect(() => {
  let mounted = true;
  if (!site) return;

  const load = async () => {
    if (site !== "All") {
      const [w, cost, norm] = await Promise.all([
        parseCsv(`${site}_Cleaned_Consumption.csv`),
        parseCsv(`${site}_Cost_Corrected_Full.csv`),
        parseCsv(`${site}_Cleaned_Consumption.csv`), // if Normalized column lives here
      ]);
      if (!mounted) return;
      setWaterData(w);
      setCostData(cost);
      setNormalizedData(norm);
      return;
    }

    // === All Sites ===
    const [wCotai, wMacho, costCotai, costMacho] = await Promise.all([
      parseCsv(`Cotai_Cleaned_Consumption.csv`),
      parseCsv(`Macho_Cleaned_Consumption.csv`),
      parseCsv(`Cotai_Cost_Corrected_Full.csv`),
      parseCsv(`Macho_Cost_Corrected_Full.csv`),
    ]);
    if (!mounted) return;

    const wAgg = aggregateAllSitesEnhanced(
      [...wCotai, ...wMacho],
      { sum: {
          "Actual Water Consumption": WATER_ACT_ALIASES,
          "Normalized Water Consumption": WATER_NORM_ALIASES
        } }
    );

    const costAgg = aggregateAllSitesEnhanced(
      [...costCotai, ...costMacho],
      { sum: { "Water Cost": WATER_COST_ALIASES },
        avg: { "CDD": CDD_ALIASES, "Food Cover": FOOD_COVER_ALIASES } }
    );

    setWaterData(wAgg);
    setCostData(costAgg);
    setNormalizedData([]); // no normalized table in "All"
  };

  load();
  return () => { mounted = false; };
}, [site]);

  

  useEffect(() => {
    if (site === "All") { setShowFoodCover(true); setShowCdd(false); }
  }, [site]);

  /* Load breakdown csv */
useEffect(() => {
  const file = BREAKDOWN_FILES[site];
  if (!file) { setBreakdownRaw([]); return; }

  Papa.parse(`${process.env.REACT_APP_BE_URL}/api/file/${file}?t=${Date.now()}`, {
    download: true,
    header: true,
    transformHeader: (h) => String(h || "").trim(),
    beforeFirstChunk: (chunk) =>
      chunk.split(/\r?\n/).map(line =>
        line.startsWith('"') && line.endsWith('"') ? line.slice(1, -1) : line
      ).join("\n"),
    complete: ({ data }) => {
      const rows = (data || []).filter(r => r && (r.Month != null) && (r.Year != null));
      setBreakdownRaw(rows);
    }
  });
}, [site]);


  const breakdownYears = [...new Set(breakdownRaw.map(r => r.Year))];
  const allYears = [...new Set([
    ...waterData.map(d => d.Year),
    ...breakdownYears
  ])].sort();

  const parseNum = (val) => Number(val?.toString().replace(/,/g, "")) || 0;
  const getValue = (row, keys) => {
    if (!row) return null;
    for (let k of keys) {
      if (row[k] !== undefined && row[k] !== "") {
        return parseNum(row[k]);
      }
    }
    return null;
  };

  const toNum = (v) => Number(String(v ?? "").replace(/,/g, "")) || 0;

  const normalizeMonth = (m) => {
    const s = String(m ?? "").trim();
    const n = Number(s);
    if (Number.isFinite(n) && n >= 1 && n <= 12) return MONTHS_ORDER[n - 1];
    const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    return MONTHS_ORDER.includes(cap) ? cap : s;
  };

  const pickFieldEnhanced = (row, names) => {
    for (const name of names) {
      if (row?.hasOwnProperty(name) && row[name] != null) {
        const val = String(row[name]).trim();
        if (val !== "" && val !== "-" && val !== "0") return toNum(val);
      }
    }
    return 0;
  };

  // Sum + avg aggregator for All Sites (same pattern as Electricity)
  const aggregateAllSitesEnhanced = (rows, { sum = {}, avg = {} }) => {
    const map = new Map();
    rows.forEach((r) => {
      const Year = String(r.Year);
      const Month = normalizeMonth(r.Month);
      const key = `${Year}|${Month}`;
      if (!map.has(key)) {
        const init = { Year, Month };
        Object.keys(sum).forEach(k => (init[k] = 0));
        Object.keys(avg).forEach(k => (init[`__${k}`] = { s: 0, c: 0 }));
        map.set(key, init);
      }
      const acc = map.get(key);
      Object.entries(sum).forEach(([outKey, srcNames]) => {
        acc[outKey] += pickFieldEnhanced(r, srcNames);
      });
      Object.entries(avg).forEach(([outKey, srcNames]) => {
        const v = pickFieldEnhanced(r, srcNames);
        if (v > 0) { acc[`__${outKey}`].s += v; acc[`__${outKey}`].c += 1; }
      });
    });

    const out = Array.from(map.values()).map(acc => {
      Object.keys(avg).forEach(k => {
        const { s, c } = acc[`__${k}`];
        acc[k] = c ? s / c : 0;
        delete acc[`__${k}`];
      });
      return acc;
    });

    return out.sort((a,b) =>
      a.Year.localeCompare(b.Year) ||
      MONTHS_ORDER.indexOf(a.Month) - MONTHS_ORDER.indexOf(b.Month)
    );
  };

  // Generic month sum (works for single site or combined)
  const sumFor = (rows, { year, month, aliases }) =>
    rows.filter(r => String(r.Year) === String(year) && normalizeMonth(r.Month) === normalizeMonth(month))
        .reduce((a, r) => a + pickFieldEnhanced(r, aliases), 0);

  // Create month map for charts
  const makeMonthMap = (rows, { year, aliases }) => {
    const m = new Map();
    MONTHS_ORDER.forEach(month => {
      const v = rows
        .filter(r => String(r.Year) === String(year) && normalizeMonth(r.Month) === month)
        .reduce((a, r) => a + pickFieldEnhanced(r, aliases), 0);
      m.set(month, v);
    });
    return m;
  };

  const fmt8 = (n) => {
    if (n == null || Number.isNaN(n)) return "";
    const sign = n < 0 ? "-" : "";
    const s = Math.trunc(Math.abs(n)).toString();
    const trimmed = s.length > 8 ? s.slice(0, 8) : s;
    return sign + trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // --- CSV helpers for breakdown export ---
  const escapeCSV = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const pctNum = (n) => (Number.isFinite(n) ? `${n.toFixed(1)}%` : "");

  // --- CSV helpers ---
  const fmt = (v) =>
    (v === null || v === undefined || Number.isNaN(v)) ? "" : v.toLocaleString();

  const pct = (s) =>
    (s && s !== "NaN%" && s !== "Infinity%" && s !== "-Infinity%") ? s : "";

  const getColor = (val) => (!val || typeof val !== "string") ? "" : val.startsWith("-") ? "text-success" : "text-danger";
  const calcChange = (a, b) => (a != null && b != null) ? `${((b - a) / a * 100).toFixed(1)}%` : "";

  const reportingMonthIndex = MONTHS_ORDER.indexOf(reportingMonth);
  const monthsChart = MONTHS_ORDER.slice(0, reportingMonthIndex + 1);
  const monthsTable = MONTHS_ORDER;
  const sumLimited = (rows, key) => rows.reduce((acc, r) => acc + (r.within ? (Number(r[key]) || 0) : 0), 0);

  /* ================= ACTUAL TABLE ================= */
  const actualTableData = MONTHS_ORDER.map((month, idx) => {
    const within = idx <= reportingMonthIndex;

    const water24 = within ? sumFor(waterData, { year: baselineYear,  month, aliases: WATER_ACT_ALIASES }) : null;
    const water25 = within ? sumFor(waterData, { year: reportingYear, month, aliases: WATER_ACT_ALIASES }) : null;

    const mop24   = within ? sumFor(costData,  { year: baselineYear,  month, aliases: WATER_COST_ALIASES }) : null;
    const mop25   = within ? sumFor(costData,  { year: reportingYear, month, aliases: WATER_COST_ALIASES }) : null;

    const cdd24   = within ? sumFor(costData,  { year: baselineYear,  month, aliases: CDD_ALIASES }) : null;
    const cdd25   = within ? sumFor(costData,  { year: reportingYear, month, aliases: CDD_ALIASES }) : null;

    const fc24    = within ? sumFor(costData,  { year: baselineYear,  month, aliases: FOOD_COVER_ALIASES }) : null;
    const fc25    = within ? sumFor(costData,  { year: reportingYear, month, aliases: FOOD_COVER_ALIASES }) : null;

    const cddChange = (cdd24 && cdd25) ? `${(((cdd25 - cdd24) / cdd24) * 100).toFixed(1)}%` : "";
    const foodCoverChange = (fc24 && fc25) ? `${(((fc25 - fc24) / fc24) * 100).toFixed(1)}%` : "";

    return {
      month, within,
      water24, water25,
      mop24, mop25,
      cdd24, cdd25,
      foodCover24: fc24, foodCover25: fc25,
      waterChange: calcChange(water24, water25),
      mopChange:   calcChange(mop24,   mop25),
      cddChange,
      foodCoverChange
    };
  });

  const totalActual = {
    water24: sumLimited(actualTableData, "water24"),
    water25: sumLimited(actualTableData, "water25"),
    mop24: sumLimited(actualTableData, "mop24"),
    mop25: sumLimited(actualTableData, "mop25"),
  };
  totalActual.waterChange = calcChange(totalActual.water24, totalActual.water25);
  totalActual.mopChange = calcChange(totalActual.mop24, totalActual.mop25);
  const totalCDDBaseline  = sumLimited(actualTableData, "cdd24");
  const totalCDDReporting = sumLimited(actualTableData, "cdd25");
  const totalCddChange = totalCDDBaseline > 0 ? `${(((totalCDDReporting - totalCDDBaseline) / totalCDDBaseline) * 100).toFixed(1)}%` : "-";

  const totalFoodCoverBaseline  = sumLimited(actualTableData, "foodCover24");
  const totalFoodCoverReporting = sumLimited(actualTableData, "foodCover25");
  const totalFoodCoverChange = totalFoodCoverBaseline > 0 
    ? `${(((totalFoodCoverReporting - totalFoodCoverBaseline) / totalFoodCoverBaseline) * 100).toFixed(1)}%` 
    : "-";

  /* ================= NORMALIZED TABLE ==================== */
  const normalizedTableData = MONTHS_ORDER.map((month, idx) => {
    const within = idx <= reportingMonthIndex;
    if (!within) return { month, within, normalized: null, actual: null, normChange: "" };

    const normalized = sumFor(site === "All" ? waterData : normalizedData, {
      year: reportingYear, month, aliases: WATER_NORM_ALIASES
    });
    const actual = sumFor(waterData, { year: reportingYear, month, aliases: WATER_ACT_ALIASES });

    return {
      month, within, normalized, actual,
      normChange: (normalized && actual) ? `${(((actual - normalized) / normalized) * 100).toFixed(1)}%` : ""
    };
  });

  const totalNorm = {
    normalized: normalizedTableData.reduce((a, r) => a + (r.within ? (r.normalized || 0) : 0), 0),
    actual:     normalizedTableData.reduce((a, r) => a + (r.within ? (r.actual     || 0) : 0), 0),
  };
  totalNorm.normChange = calcChange(totalNorm.normalized, totalNorm.actual);

  /* ================= CHARTS ============================= */
  const reportingDataMap = makeMonthMap(waterData, { year: reportingYear, aliases: WATER_ACT_ALIASES });
  const baselineDataMap  = makeMonthMap(waterData, { year: baselineYear,  aliases: WATER_ACT_ALIASES });
  const chartData = {
    labels: monthsChart,
    datasets: [
      { label: `Actual (${reportingYear})`, data: monthsChart.map(m => reportingDataMap.get(m) ?? 0), backgroundColor: "#2a9df4", order: 10 },
      { label: `Baseline (${baselineYear})`, data: monthsChart.map(m => baselineDataMap.get(m)  ?? 0), backgroundColor: "#7cd560", order: 10 },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: "top" }, title: { display: true, text: `Water Consumption: ${baselineYear} vs ${reportingYear}` } },
    scales: { y: { beginAtZero: true, title: { display: true, text: "Consumption (m³)" } } }
  };

  const normReportMap = makeMonthMap(site === "All" ? waterData : normalizedData, {
    year: reportingYear, aliases: WATER_NORM_ALIASES
  });
  const actReportMap  = makeMonthMap(waterData, { year: reportingYear, aliases: WATER_ACT_ALIASES });

  const normalizedChartData = {
    labels: monthsChart,
    datasets: [
      { label: `${reportingYear} Actual`,     data: monthsChart.map(m => actReportMap.get(m)  || 0), backgroundColor: "#2a9df4", order: 10 },
      { label: `${reportingYear} Normalized`, data: monthsChart.map(m => normReportMap.get(m) || 0), backgroundColor: "#FCCD00", order: 11 }
    ]
  };

  // === TOOLTIP-FRIENDLY DATASETS =================================
  const base = isAll ? chartData : (showNormalized ? normalizedChartData : chartData);

  const metricName = showNormalized ? "Normalized Consumption" : "Actual Consumption";
  let datasets = base.datasets.map(ds => {
    const isBaseline = (ds.label || "").toLowerCase().includes("baseline");
    const period = isBaseline ? "Baseline Period" : "Reporting Period";
    return {
      ...ds,
      label: `${metricName} - ${period} (m³)`,
      order: (!ds.type || ds.type === "bar") ? 10 : ds.order,
      customMeta: { metric: metricName, period, unit: "m³" }
    };
  });

  // ----- CDD / Food Cover lines --------
  const cddBaselineMap  = makeMonthMap(costData, { year: baselineYear,  aliases: CDD_ALIASES });
  const cddMap          = makeMonthMap(costData, { year: reportingYear, aliases: CDD_ALIASES });
  const fcBaselineMap   = makeMonthMap(costData, { year: baselineYear,  aliases: FOOD_COVER_ALIASES });
  const fcMap           = makeMonthMap(costData, { year: reportingYear, aliases: FOOD_COVER_ALIASES });

  // CDD only for single sites when enabled
  if (!isAll && showCdd) {
    datasets.push(
      { type:"line", label:"CDD - Baseline Period", data: monthsChart.map(m => cddBaselineMap.get(m) || 0), yAxisID:"y1", borderColor:"#000", borderDash:[5,5], fill:false, order:1, borderWidth:2, pointRadius:4, pointHoverRadius:6 },
      { type:"line", label:"CDD - Reporting Period", data: monthsChart.map(m => cddMap.get(m) || 0), yAxisID:"y1", borderColor:"#bd9d4b", fill:false, order:2, borderWidth:2, pointRadius:4, pointHoverRadius:6 }
    );
  }

  // Food Cover: always on for All Sites, toggle for single sites
  if ((isAll) || (!isAll && showFoodCover)) {
    datasets = [
      ...datasets.filter(ds => !ds.label.includes("Food Cover")), // avoid duplicates
      {
        type:"line",
        label:"Food Cover - Baseline Period",
        data: monthsChart.map(m => fcBaselineMap.get(m) || 0),
        yAxisID:"y1",
        borderColor:"#000",
        borderDash:[5,5],
        fill:false, order:1, borderWidth:2, pointRadius:4, pointHoverRadius:6
      },
      {
        type:"line",
        label:"Food Cover - Reporting Period",
        data: monthsChart.map(m => fcMap.get(m) || 0),
        yAxisID:"y1",
        borderColor:"#bd9d4b",
        fill:false, order:2, borderWidth:2, pointRadius:4, pointHoverRadius:6
      }
    ];
  }

  const displayChartData = { labels: monthsChart, datasets };

  // === OPTIONS =================================
  const displayChartOptions = {
    ...chartOptions,
    interaction: { mode: "nearest", intersect: true },
    scales: {
      ...chartOptions.scales,
      y1: {
        display: isAll || showCdd || showFoodCover,
        position: "right",
        grid: { drawOnChartArea: false },
        beginAtZero: true,
        title: {
          display: isAll || showCdd || showFoodCover,
          text: isAll ? "Food Cover" : (showCdd ? "Cooling Degree Days" : "Food Cover")
        }
      }
    },
    plugins: {
      ...chartOptions.plugins,
      datalabels: { display: false },
      title: { display: false },
      legend: {
        display: true,
        position: "bottom",
        align: "center",
        labels: { boxWidth: 16, padding: 12, usePointStyle: true }
      }
    }
  };

  /* ── Breakdown rows ──────────── */
  const monthNumber = (name) => MONTHS_ORDER.indexOf(String(name).trim()) + 1;

  const { breakdownRows, breakdownTotal } = useMemo(() => {
    if (!breakdownRaw?.length) return { breakdownRows: [], breakdownTotal: 0 };

    const selMonthNum = MONTHS_ORDER.indexOf(reportingMonth) + 1;
    const selYearNum  = Number(reportingYear);

    const row = breakdownRaw.find(r => {
      const y = Number(r.Year);
      if (y !== selYearNum) return false;

      const mRaw = (r.Month || "").toString().replace(/['"]+/g, "").trim();
      const mLower = mRaw.toLowerCase();

      if (!isNaN(Number(mRaw))) return Number(mRaw) === selMonthNum;
      return (
        mLower === reportingMonth.toLowerCase() ||
        mLower.slice(0, 3) === reportingMonth.slice(0, 3).toLowerCase()
      );
    });

    if (!row) return { breakdownRows: [], breakdownTotal: 0 };

    const EXCLUDE_COLS = new Set(["month","year","item","index","#","total"]);
    const categoryColumns = Object.keys(row).filter(key => {
      const keyLower = key.toLowerCase().trim();
      return !EXCLUDE_COLS.has(keyLower) && key.trim() !== "";
    });

    const items = categoryColumns.map(cat => {
      const rawValue = row[cat];
      let value = 0;
      if (rawValue !== null && rawValue !== undefined && rawValue !== "") {
        const stringValue = String(rawValue).replace(/['"]+/g, "").trim();
        if (stringValue !== "" && !isNaN(Number(stringValue))) value = Number(stringValue);
      }
      return { category: cat.trim(), value };
    }).filter(item => item.value > 0);

    if (items.length === 0) return { breakdownRows: [], breakdownTotal: 0 };

    const total = items.reduce((sum, item) => sum + item.value, 0);
    const withPercentages = items.map(item => ({
      ...item,
      pct: total > 0 ? (item.value / total) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return { breakdownRows: withPercentages, breakdownTotal: total };
  }, [breakdownRaw, reportingMonth, reportingYear]);

  /* ===== Donut data/options ===== */
  const PALETTE = [
    "#F7D36F","#A5D8F3","#84D2A6","#F29E9E","#CBA6F7",
    "#57C7E3","#F6B26B","#93C47D","#6FA8DC","#E06666",
    "#B4A7D6","#76A5AF","#FFD966","#8E7CC3","#6AA84F",
    "#C27BA0","#A2C4C9","#EAD1DC"
  ];
  const TOP_N = 12;

  const { donutData, donutTotal } = useMemo(() => {
    if (!breakdownRows?.length) return { donutData: null, donutTotal: 0 };

    const top = breakdownRows.slice(0, TOP_N);
    const othersValue = breakdownRows.slice(TOP_N).reduce((a,b) => a + (b.value || 0), 0);

    const labels = top.map(r => r.category);
    const values = top.map(r => r.value);

    if (othersValue > 0) { labels.push("Others"); values.push(othersValue); }

    const total = values.reduce((a,b)=>a+b,0);

    return {
      donutData: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
          borderWidth: 1
        }]
      },
      donutTotal: total
    };
  }, [breakdownRows]);

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      title: { display: false },
      legend: {
        position: "bottom",
        align: "center",
        labels: { boxWidth: 14, padding: 12, usePointStyle: true }
      },
      tooltip: {
        callbacks: {
          label(ctx) {
            const val = Number(ctx.raw || 0);
            const total = donutTotal || 0;
            const pct = total ? ((val / total) * 100).toFixed(1) : "0.0";
            return `${ctx.label}: ${val.toLocaleString()} m³ (${pct}%)`;
          }
        }
      },
      datalabels: {
        color: "#000",
        formatter: (value, ctx) => {
          const total = donutTotal || 0;
          const pct = total ? ((value / total) * 100).toFixed(1) : "0.0";
          return `${pct}%`;
        },
        font: { weight: "bold", size: 11 },
        anchor: "center",
        align: "center"
      }
    }
  };

  const handleDownloadCSV = () => {
    if (showNormalized) {
      let csv = `Month,${reportingYear} Normalized Water (m³),${reportingYear} Actual Water (m³),% Change - Normalized\n`;
      normalizedTableData
        .filter(r => r.within)
        .forEach(r => {
          csv += [r.month, r.normalized ?? "", r.actual ?? "", pct(r.normChange)].join(",") + "\n";
        });
      csv += ["Total", totalNorm.normalized, totalNorm.actual, pct(totalNorm.normChange)].join(",") + "\n";
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Water_Normalized_${reportingMonth}_${reportingYear}.csv`;
      link.click();
    } else {
      let csv = "Month,Water Baseline (m³),Water Reporting (m³),% Change Water,Cost Baseline (MOP),Cost Reporting (MOP),% Change Cost,% Change CDD,% Change Food Cover\n";
      actualTableData
        .filter(r => r.within)
        .forEach(r => {
          csv += [
            r.month, r.water24 ?? "", r.water25 ?? "", pct(r.waterChange),
            r.mop24 ?? "", r.mop25 ?? "", pct(r.mopChange),
            pct(r.cddChange), pct(r.foodCoverChange)
          ].join(",") + "\n";
        });
      csv += [
        "Total",
        totalActual.water24, totalActual.water25, pct(totalActual.waterChange),
        totalActual.mop24, totalActual.mop25, pct(totalActual.mopChange),
        pct(totalCddChange), pct(totalFoodCoverChange)
      ].join(",") + "\n";
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Water_Actual_${baselineYear}_vs_${reportingYear}_${reportingMonth}.csv`;
      link.click();
    }
  };

  const handleDownloadBreakdownCSV = () => {
    const siteName = site;
    let csv = "";
    csv += `Site,${escapeCSV(siteName)}\n`;
    csv += `Month,${escapeCSV(reportingMonth)}\n`;
    csv += `Year,${escapeCSV(reportingYear)}\n\n`;
    csv += `Category,Value (m³),Percent\n`;
    breakdownRows.forEach(r => {
      csv += [escapeCSV(r.category), r.value ?? "", pctNum(r.pct)].join(",") + "\n";
    });
    csv += ["Total", breakdownTotal ?? "", ""].join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Water_Breakdown_${siteName}_${reportingMonth}_${reportingYear}.csv`;
    link.click();
  };

  return (
    <Container fluid style={{ marginTop:"120px", marginLeft:"80px" }}>
      {currentView === "multiYear" ? (
        <>
          <h1 className="section-title">
            <span className="title-main">Water</span>
            <span
              className="title-sub clickable"
              onClick={() => setCurrentView("yearOnYear")}
            >
              <i className="fas fa-arrow-right" style={{ color: "orange", marginRight: "1px" }}><ArrowForwardIcon/></i>
              <h6 style={{ margin: "30px" }}>Year-on-Year</h6>
            </span>
          </h1>
          <WaterMultipleYearComparison />
        </>
      ) : (
        <>
          {/* --- FIXED PAGE HEADER --- */}
          <Row className="utility-header align-items-center mb-3">
            {/* Left: Icons */}
            <Col xs="auto">
              <div className="d-flex align-items-center gap-2" style={{ position:"relative", zIndex:2000 }}>
                <img src={checkIcon}  alt="Electricity" style={{ width:36, height:36, cursor:"pointer" }} onClick={() => navigate("/utility")} />
               
                  <img src={warningIcon} alt="Gas"      style={{ width:36, height:36, cursor:"pointer" }} onClick={() => navigate("/gas")} />
               
                <img src={infoIcon}   alt="Water"       style={{ width:36, height:36, cursor:"pointer" }} onClick={() => navigate("/water")} />
                <img src={alertIcon}  alt="Energy"      style={{ width:36, height:36, cursor:"pointer" }} onClick={() => navigate("/energy")} />
              </div>
            </Col>

            {/* Middle: Toggles */}
            <Col xs={6}>
              {site !== "All" && (
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center">
                    <strong style={{ minWidth: "200px", fontWeight: 500, textAlign: "right" }}>
                      Normalized Consumption
                    </strong>
                    <Button size="sm" style={showNormalized ? enableBtnStyle : disableBtnStyle}
                            onClick={() => setShowNormalized(true)} className="ms-2">Enable</Button>
                    <Button size="sm" style={showNormalized ? disableBtnStyle : enableBtnStyle}
                            onClick={() => setShowNormalized(false)}>Disable</Button>
                  </div>

                  <div className="d-flex align-items-center">
                    <strong style={{ minWidth: "200px", fontWeight: 500, textAlign: "right" }}>
                      CDD
                    </strong>
                    <Button size="sm" style={showCdd ? enableBtnStyle : disableBtnStyle}
                            onClick={() => { setShowCdd(true); setShowFoodCover(false); }} className="ms-2">Enable</Button>
                    <Button size="sm" style={showCdd ? disableBtnStyle : enableBtnStyle}
                            onClick={() => setShowCdd(false)}>Disable</Button>
                  </div>

                  <div className="d-flex align-items-center">
                    <strong style={{ minWidth: "200px", fontWeight: 500, textAlign: "right" }}>
                      Food Cover
                    </strong>
                    <Button size="sm" style={showFoodCover ? enableBtnStyle : disableBtnStyle}
                            onClick={() => { setShowFoodCover(true); setShowCdd(false); }} className="ms-2">Enable</Button>
                    <Button size="sm" style={showFoodCover ? disableBtnStyle : enableBtnStyle}
                            onClick={() => setShowFoodCover(false)}>Disable</Button>
                  </div>
                </div>
              )}
            </Col>

            {/* Right: Filters */}
            <Col xs="auto">
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center">
                  <Form.Label className="mb-0 me-1"><strong>Baseline</strong></Form.Label>
                  <Form.Select value={baselineYear} onChange={e => setBaselineYear(e.target.value)}
                               style={{ minWidth: '75px', fontSize: '0.9rem' }}>
                    {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </Form.Select>
                </div>
                <div className="d-flex align-items-center">
                  <Form.Label className="mb-0 me-1"><strong>Reporting</strong></Form.Label>
                  <Form.Select value={reportingMonth} onChange={e => setReportingMonth(e.target.value)}
                               style={{ minWidth: '100px', fontSize: '0.9rem' }}>
                    {MONTHS_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
                  </Form.Select>
                </div>
                <div>
                  <Form.Select value={reportingYear} onChange={e => setReportingYear(e.target.value)}
                               style={{ minWidth: '75px', fontSize: '0.9rem' }}>
                    {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </Form.Select>
                </div>
              </div>
            </Col>
          </Row>

          {/* --- MAIN LAYOUT --- */}
          <h1 className="section-title">
            <span className="title-main">Water</span>
            <span className="title-sub clickable" onClick={() => setCurrentView("multiYear")}>
              <i className="fas fa-arrow-right" style={{ color: "orange", marginRight: "1px" }}><ArrowForwardIcon/></i>
              <h6 style={{ marginTop: "20px" }}>Multiple Year Comparison</h6>
            </span>
          </h1>

          {/* Charts Section - Side by Side */}
          <Row className="gx-3 gy-3 mb-4">
            <Col xl={isAll ? 12 : 8} lg={isAll ? 12 : 8} className="chart-section">
              <div style={{ position: "relative" }}>
                <IconButton
                  onClick={handleDownloadCSV}
                  title={isAll ? "Download Actual CSV" : (showNormalized ? "Download Normalized CSV" : "Download Actual CSV")}
                  style={{ position: "absolute", top: "-30px", right: isAll ? "750px" : "75px", backgroundColor: "white", padding: 4, zIndex: 10 }}
                  size="small"
                >
                  <DownloadIcon />
                </IconButton>
                <div style={{ height: "600px" }}>
                  <Bar data={displayChartData} options={displayChartOptions} />
                </div>
              </div>
            </Col>
            
            {/* Donut Chart */}
            {!isAll && (
              <Col xl={4} lg={4} className="chart-section">
                <div className="donut-card">
                  <h5 className="text-danger fw-bold mb-1">Consumption Profile</h5>
                  <div style={{ height: "370px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {donutData ? <Doughnut data={donutData} options={donutOptions} /> : <div className="text-center text-muted">No data</div>}
                  </div>
                </div>
              </Col>
            )}
          </Row>

          {/* Three Tables Row - Side by Side */}
          <Row className="g-2">
            {/* Actual Consumption Table */}
            <Col xl={isAll ? 5 : 5} lg={isAll ? 12 : 5} md={12} className="table-card">
              <h5 className="text-danger fw-bold">Actual Consumption</h5>
              <div style={{ fontSize: "0.75rem" }}>
                <Table bordered className="text-center w-100 table-sm shadow-sm"
                  style={{ border:'2px solid #8B4513', borderCollapse:'collapse', tableLayout:'fixed', width:'100%', minHeight: "450px" }}>
                  <thead style={{ backgroundColor:'#D4B56A' }}>
                    <tr ref={actualHead1Ref}>
                      <th rowSpan="2" style={{...thHeaderStyle, width: '10%', fontSize: '0.7rem', padding: '4px 2px'}}>Month</th>
                      <th colSpan="3" style={{...thHeaderStyle, textAlign: 'center', fontSize: '0.7rem', padding: '4px 2px'}}>Water Consumption (m³)</th>
                      <th colSpan="3" style={{...thHeaderStyle, textAlign: 'center', fontSize: '0.7rem', padding: '4px 2px'}}>Water Cost (MOP)</th>
                      <th rowSpan="2" style={{...thHeaderStyle, width: '8%', fontSize: '0.7rem', padding: '4px 2px'}}>% CDD</th>
                      <th rowSpan="2" style={{...thHeaderStyle, width: '8%', fontSize: '0.7rem', padding: '4px 2px'}}>% Food Cover</th>
                    </tr>
                    <tr ref={actualHead2Ref}>
                      <th style={{...thHeaderStyle, width: '12%', fontSize: '0.65rem', padding: '2px'}}>{baselineYear}</th>
                      <th style={{...thHeaderStyle, width: '12%', fontSize: '0.65rem', padding: '2px'}}>{reportingYear}</th>
                      <th style={{...thHeaderStyle, width: '8%', fontSize: '0.65rem', padding: '2px'}}>% Change</th>
                      <th style={{...thHeaderStyle, width: '12%', fontSize: '0.65rem', padding: '2px'}}>{baselineYear}</th>
                      <th style={{...thHeaderStyle, width: '12%', fontSize: '0.65rem', padding: '2px'}}>{reportingYear}</th>
                      <th style={{...thHeaderStyle, width: '8%', fontSize: '0.65rem', padding: '2px'}}>% Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actualTableData.map((row, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#F5DEB3' }}>
                        <td style={{ fontSize: '0.7rem', padding: '2px 4px' }}>{row.month.slice(0,3)}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.water24?.toLocaleString()}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.water25?.toLocaleString()}</td>
                        <td className={`number-cell ${getColor(row.waterChange)}`} style={{ fontSize: '0.7rem', padding: '2px' }}>{row.waterChange}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.mop24?.toLocaleString()}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.mop25?.toLocaleString()}</td>
                        <td className={`number-cell ${getColor(row.mopChange)}`} style={{ fontSize: '0.7rem', padding: '2px' }}>{row.mopChange}</td>
                        <td className={`number-cell ${getColor(row.cddChange)}`} style={{ fontSize: '0.7rem', padding: '2px' }}>{row.cddChange}</td>
                        <td className={`number-cell ${getColor(row.foodCoverChange)}`} style={{ fontSize: '0.7rem', padding: '2px' }}>{row.foodCoverChange}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Total</td>
                      <td className="number-cell" title={totalActual.water24.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalActual.water24)}</td>
                      <td className="number-cell" title={totalActual.water25.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalActual.water25)}</td>
                      <td className={`number-cell ${getColor(totalActual.waterChange)}`} style={{ fontSize: '0.7rem' }}>{totalActual.waterChange}</td>
                      <td className="number-cell" title={totalActual.mop24.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalActual.mop24)}</td>
                      <td className="number-cell" title={totalActual.mop25.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalActual.mop25)}</td>
                      <td className={`number-cell ${getColor(totalActual.mopChange)}`} style={{ fontSize: '0.7rem' }}>{totalActual.mopChange}</td>
                      <td className={`number-cell ${getColor(totalCddChange)}`} style={{ fontSize: '0.7rem' }}>{totalCddChange}</td>
                      <td className={`number-cell ${getColor(totalFoodCoverChange)}`} style={{ fontSize: '0.7rem' }}>{totalFoodCoverChange}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </Col>

            {/* Normalized Consumption Table */}
            {!isAll && (
            <Col xl={3} lg={3} md={12} className="table-card">
              <h5 className="text-danger fw-bold">Normalized Consumption</h5>
              <div style={{ fontSize: "0.75rem" }}>
                <Table bordered className="text-center w-100 table-sm shadow-sm"
                  style={{ border:'2px solid #8B4513', borderCollapse:'collapse', tableLayout:'fixed', width:'100%', minHeight: "450px" }}>
                  <thead style={{ background:'#F5DEB3' }}>
                    <tr ref={normHead1Ref}>
                      <th style={{...thHeaderStyle, width: '25%', fontSize: '0.7rem', padding: '4px 2px'}}>Month</th>
                      <th style={{...thHeaderStyle, width: '30%', fontSize: '0.7rem', padding: '4px 2px'}}>{reportingYear} Normalized (m³)</th>
                      <th style={{...thHeaderStyle, width: '30%', fontSize: '0.7rem', padding: '4px 2px'}}>{reportingYear} Actual (m³)</th>
                      <th style={{...thHeaderStyle, width: '15%', fontSize: '0.7rem', padding: '4px 2px'}}>% Change</th>
                    </tr>
                    <tr ref={normHead2Ref}>
                      <th style={thHeaderStyle}></th>
                      <th style={thHeaderStyle}></th>
                      <th style={thHeaderStyle}></th>
                      <th style={thHeaderStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedTableData.map((row, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#F5DEB3' }}>
                        <td style={{ fontSize: '0.7rem', padding: '2px 4px' }}>{row.month.slice(0,3)}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.normalized?.toLocaleString()}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.actual?.toLocaleString()}</td>
                        <td className={`number-cell ${getColor(row.normChange)}`} style={{ fontSize: '0.7rem', padding: '2px' }}>{row.normChange}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Total</td>
                      <td className="number-cell" title={totalNorm.normalized.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalNorm.normalized)}</td>
                      <td className="number-cell" title={totalNorm.actual.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalNorm.actual)}</td>
                      <td className={`number-cell ${getColor(totalNorm.normChange)}`} style={{ fontSize: '0.7rem' }}>{totalNorm.normChange}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </Col>
            )}

            {/* Breakdown Table */}
            {!isAll && (
            <Col xl={3} lg={4} md={12} className="table-card">
              <h5 className="text-danger fw-bold mb-1 d-flex align-items-center">
                Breakdown
                <IconButton onClick={handleDownloadBreakdownCSV} title="Download breakdown CSV" size="small" style={{ marginLeft: 8, backgroundColor: "white", padding: 2 }}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </h5>

              <div className="breakdown-totalbar mb-2" style={{ backgroundColor: '#F5DEB3', padding: '6px', border: '1px solid #8B4513', textAlign: 'center', fontSize: '0.8rem' }}>
                <div>
                  <strong>{reportingMonth} {reportingYear}</strong>
                  <div><strong>{breakdownTotal ? breakdownTotal.toLocaleString() : "-"} m³</strong></div>
                </div>
              </div>

              <div style={{ fontSize: "0.75rem" }}>
                <Table bordered className="text-center table-sm shadow-sm"
                  style={{ width: "100%", border: "2px solid #8B4513", borderTop: "none", borderCollapse: "collapse", minHeight: "400px" }}>
                  <thead style={{ background:'#F5DEB3' }}>
                    <tr ref={breakdownHead1Ref}>
                      <th style={{...thHeaderStyle, fontSize: '0.7rem', padding: '4px 2px'}}>Category</th>
                      <th style={{...thHeaderStyle, fontSize: '0.7rem', padding: '4px 2px'}}>{reportingMonth} {reportingYear} (m³)</th>
                      <th style={{...thHeaderStyle, fontSize: '0.7rem', padding: '4px 2px'}}>%</th>
                    </tr>
                    <tr ref={breakdownHead2Ref}>
                      <th style={thHeaderStyle}></th>
                      <th style={thHeaderStyle}></th>
                      <th style={thHeaderStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownRows.map((r, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#F5DEB3' }}>
                        <td className="breakdown-category" style={{ textAlign: 'left', paddingLeft: '6px', fontSize: '0.7rem', padding: '2px 6px' }}>{r.category}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{r.value?.toLocaleString()}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{r.pct ? `${r.pct.toFixed(1)}%` : ""}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td className="breakdown-category" style={{ textAlign: 'left', paddingLeft: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>Total</td>
                      <td className="number-cell" style={{ fontSize: '0.7rem' }}>{breakdownTotal?.toLocaleString()}</td>
                      <td />
                    </tr>
                  </tbody>
                </Table>
              </div>
            </Col>
            )}
          </Row>
        </>
      )}
    </Container>
  );
};

export default Water;