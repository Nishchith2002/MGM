






import React, { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import "../pages/UtilityLayout.css";
import ChartDataLabels from "chartjs-plugin-datalabels";
import MultipleYearComparison from "./MultiYearComparison";
import Papa from "papaparse";
import { Bar, Doughnut } from "react-chartjs-2";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from "react-router-dom";
import EnergyMultipleYearComparison from "./EnergyMultipleYearComparison";

// Import images from assets
import checkIcon from '../../src/assets/icons/energyDG.png';
import warningIcon from '../../src/assets/icons/gasHovered.png';
import infoIcon from '../../src/assets/icons/waterHovered.png';
import alertIcon from '../../src/assets/icons/electricityHovered.png';
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

/* ── Energy breakdown files per site ───────────────────────── */
const BREAKDOWN_FILES = {
  Cotai: "Cotai_Energy_Breakdown.csv",
  Macho: "Macho_Energy_Breakdown.csv",
};

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

const Energy = ({ onNavigateToUtility }) => {
  const navigate = useNavigate();
  const [energyData, setEnergyData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [normalizedData, setNormalizedData] = useState([]);
  const [breakdownRaw, setBreakdownRaw] = useState([]);

  const [site, setSite] = useState(localStorage.getItem("selectedSite") || "Cotai");
  const [showNormalized, setShowNormalized] = useState(false);
  const [showCdd, setShowCdd] = useState(false);
  const [showOat, setShowOat] = useState(true);

  const [reportingYear, setReportingYear] = useState("2025");
  const [reportingMonth, setReportingMonth] = useState("December");
  const [currentView, setCurrentView] = useState("yearOnYear"); 
  const [baselineYear, setBaselineYear] = useState("2024");
  const isAll = site === "All";
  
  const oatEnabled = isAll ? true  : showOat;   // force OAT on All
  const cddEnabled = isAll ? false : showCdd;   // hide CDD on All


// API CSV helper with cache-busting and light cleaning
const parseCsv = (fileName) =>
  new Promise((resolve) => {
    Papa.parse(`${process.env.REACT_APP_BE_URL}/api/file/${fileName}?t=${Date.now()}`, {
      download: true,
      header: true,
      complete: ({ data }) => {
        const cleaned = (data || [])
          .map(row => ({
            ...row,
            Year: row.Year ? String(row.Year).trim() : "",
            Month: row.Month ? String(row.Month).trim() : "",
          }))
          .filter(d => d.Month && d.Year);
        resolve(cleaned);
      }
    });
  });

  

  useEffect(() => {
    if (isAll) {
      setShowNormalized(false);
      setShowOat(true);
      setShowCdd(false);
    }
  }, [isAll]);

  const thHeaderStyle = { backgroundColor:"#F5DEB3", border:"1px solid #8B4513", color:"black" };
  const toggleBtnBase = { width:'70px', padding:'2px 6px', fontSize:'0.85rem', marginRight:'8px', borderRadius:'2px' };
  const enableBtnStyle = { ...toggleBtnBase, backgroundColor:'#B1A265', border:'1px solid #8B4513', color:'#000' };
  const disableBtnStyle = { ...toggleBtnBase, backgroundColor:'#6c757d', border:'1px solid #5a6268', color:'#fff' };

  /* refs for the three header rows of all tables */
  const yoyHead1Ref = useRef(null);
  const yoyHead2Ref = useRef(null);
  const normHead1Ref = useRef(null);
  const normHead2Ref = useRef(null);
  const breakdownHead1Ref = useRef(null);
  const breakdownHead2Ref = useRef(null);

  /* keep header bars perfectly aligned */
  useSyncHeaderHeights(
    yoyHead1Ref, yoyHead2Ref,
    normHead1Ref, normHead2Ref,
    breakdownHead1Ref, breakdownHead2Ref,
    [baselineYear, reportingYear]
  );

  useEffect(() => {
    if (!breakdownRaw.length) return;
    const years = [...new Set(breakdownRaw.map(r => String(r.Year).trim()))];
    if (years.length && !years.includes(reportingYear)) {
      setReportingYear(years[years.length - 1]);
    }
  }, [breakdownRaw]);

  useEffect(() => {
    if (!energyData.length) return;
    const years = [...new Set(energyData.map(d => d.Year))];
    if (!years.includes(baselineYear)) {
      const prev = (parseInt(reportingYear) - 1).toString();
      setBaselineYear(years.includes(prev) ? prev : years[0]);
    }
  }, [energyData, reportingYear, baselineYear]);

  useEffect(() => {
    if (!reportingYear) return;
    const desired = String(Number(reportingYear) - 1);
    const years = [...new Set(energyData.map(d => d.Year))];
    let pick = desired;
    if (years.length && !years.includes(desired)) {
      const sorted = years.map(Number).sort((a, b) => a - b);
      const smaller = sorted.filter(y => y < Number(reportingYear));
      if (smaller.length) pick = String(smaller[smaller.length - 1]);
    }
    if (pick !== baselineYear) setBaselineYear(pick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingYear, energyData]);

  useEffect(() => {
    const handleSiteChange = () => setSite(localStorage.getItem("selectedSite") || "Cotai");
    window.addEventListener("siteChange", handleSiteChange);
    return () => window.removeEventListener("siteChange", handleSiteChange);
  }, []);



  
  /* load main csvs */
useEffect(() => {
  let mounted = true;
  if (!site) return;

  const load = async () => {
    if (site !== "All") {
      const [e, cost, norm] = await Promise.all([
        parseCsv(`${site}_Cleaned_Consumption.csv`),
        parseCsv(`${site}_Cost_Corrected_Full.csv`),
        parseCsv(`${site}_Cleaned_Consumption.csv`) // adjust if normalized is a different file
      ]);
      if (!mounted) return;
      setEnergyData(e);
      setCostData(cost);
      setNormalizedData(norm);
      return;
    }

    // === All Sites ===
    const [cotai, macho, costCotai, costMacho] = await Promise.all([
      parseCsv(`Cotai_Cleaned_Consumption.csv`),
      parseCsv(`Macho_Cleaned_Consumption.csv`),
      parseCsv(`Cotai_Cost_Corrected_Full.csv`),
      parseCsv(`Macho_Cost_Corrected_Full.csv`)
    ]);
    if (!mounted) return;

    const agg = aggregateAllSitesEnhanced([...cotai, ...macho], {
      sum: { "Total Actual Energy Consumption": ["Total Actual Energy Consumption", "Total Actual Energy Consumption_GJ"] },
      avg: { "Avg. OAT": ["Avg. OAT"] }
    });
    const costAgg = aggregateAllSitesEnhanced([...costCotai, ...costMacho], {
      sum: { "Energy Cost": ["Energy Cost"] },
      avg: { "CDD": ["CDD"] }
    });

    setEnergyData(agg);
    setCostData(costAgg);
    setNormalizedData([]); // not used in "All"
  };

  load();
  return () => { mounted = false; };
}, [site]);


  /* Load breakdown csv */
useEffect(() => {
  const file = BREAKDOWN_FILES[site];
  if (!file) { setBreakdownRaw([]); return; }

  Papa.parse(`${process.env.REACT_APP_BE_URL}/api/file/${file}?t=${Date.now()}`, {
    download: true,
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => String(h || "").replace(/['"]+/g, "").trim(),
    transform: (val) => (typeof val === "string" ? val.replace(/['"]+/g, "").trim() : val),
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
  const allYears = [...new Set([...energyData.map(d => d.Year), ...breakdownYears])].sort();

  const parseNum = (val) => Number(val?.toString().replace(/,/g, "")) || 0;
  const getValue = (row, keys) => {
    if (!row) return null;
    for (let k of keys) {
      if (row[k] !== undefined && row[k] !== "") return parseNum(row[k]);
    }
    return null;
  };
  const pct = (s) => (s && s !== "NaN%" && s !== "Infinity%" && s !== "-Infinity%") ? s : "";
  const escapeCSV = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const pctNum = (n) => (Number.isFinite(n) ? `${n.toFixed(1)}%` : "");
  const getColor = (val) => (!val || typeof val !== "string") ? "" : val.startsWith("-") ? "text-success" : "text-danger";
  const calcChange = (a, b) => (a != null && b != null) ? `${((b - a) / a * 100).toFixed(1)}%` : "";

  /* ===== helpers for "All" aggregation ===== */
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

  /* Sum + avg aggregator for All Sites (same pattern as Water/Utility) */
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

  const fmt8 = (n) => {
    if (n == null || Number.isNaN(n)) return "";
    const sign = n < 0 ? "-" : "";
    const s = Math.trunc(Math.abs(n)).toString();
    const trimmed = s.length > 8 ? s.slice(0, 8) : s;
    return sign + trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const reportingMonthIndex = MONTHS_ORDER.indexOf(reportingMonth);
  const monthsChart = MONTHS_ORDER.slice(0, reportingMonthIndex + 1);
  const monthsTable = MONTHS_ORDER;
  const sumLimited = (rows, key) => rows.reduce((acc, r) => acc + (r.within ? (Number(r[key]) || 0) : 0), 0);

  /* ================= ACTUAL TABLE ================= */
  const actualTableData = monthsTable.map((month, idx) => {
    const within = idx <= reportingMonthIndex;
    const base       = within ? energyData.find(d => d.Month?.trim() === month && d.Year === baselineYear) : null;
    const report     = within ? energyData.find(d => d.Month?.trim() === month && d.Year === reportingYear) : null;
    const baseCost   = within ? costData.find(d => d.Month?.trim() === month && d.Year === baselineYear) : null;
    const reportCost = within ? costData.find(d => d.Month?.trim() === month && d.Year === reportingYear) : null;

    const energy24 = base ? getValue(base, ["Total Actual Energy Consumption_GJ", "Total Actual Energy Consumption"]) : null;
    const energy25 = report ? getValue(report, ["Total Actual Energy Consumption_GJ", "Total Actual Energy Consumption"]) : null;

    const mop24 = baseCost   ? parseNum(baseCost["Energy Cost"]) : null;
    const mop25 = reportCost ? parseNum(reportCost["Energy Cost"]) : null;

    const cdd24 = baseCost   ? parseNum(baseCost["CDD"]) : null;
    const cdd25 = reportCost ? parseNum(reportCost["CDD"]) : null;

    const cddChange = (cdd24 != null && cdd25 != null) 
      ? `${(((cdd25 - cdd24) / cdd24) * 100).toFixed(1)}%` 
      : "";

    return { month, within, energy24, energy25, mop24, mop25, cdd24, cdd25,
      energyChange: calcChange(energy24, energy25),
      mopChange: calcChange(mop24, mop25),
      cddChange
    };
  });

  const totalActual = {
    energy24: sumLimited(actualTableData, "energy24"),
    energy25: sumLimited(actualTableData, "energy25"),
    mop24: sumLimited(actualTableData, "mop24"),
    mop25: sumLimited(actualTableData, "mop25"),
  };
  totalActual.energyChange = calcChange(totalActual.energy24, totalActual.energy25);
  totalActual.mopChange = calcChange(totalActual.mop24, totalActual.mop25);
  const totalCDDBaseline  = sumLimited(actualTableData, "cdd24");
  const totalCDDReporting = sumLimited(actualTableData, "cdd25");
  const totalCddChange = totalCDDBaseline > 0 ? `${(((totalCDDReporting - totalCDDBaseline) / totalCDDBaseline) * 100).toFixed(1)}%` : "-";

  /* ================= NORMALIZED TABLE ==================== */
  const normalizedTableData = monthsTable.map((month, idx) => {
    const within = idx <= reportingMonthIndex;
    if (!within) return { month, within, normalized: null, actual: null, normChange: "" };
    const normRow   = normalizedData.find(d => d.Month?.trim() === month && d.Year === reportingYear);
    const actualRow = energyData.find(d => d.Month?.trim() === month && d.Year === reportingYear);

    const normalized = normRow ? getValue(normRow, ["Total Normalized Energy Consumption_GJ", "Total Normalized Energy Consumption", "Normalized"]) : null;
    const actual     = actualRow ? getValue(actualRow, ["Total Actual Energy Consumption_GJ", "Total Actual Energy Consumption"]) : null;

    return { month, within, normalized, actual,
      normChange: (normalized != null && actual != null) ? `${(((actual - normalized) / normalized) * 100).toFixed(1)}%` : "" };
  });

  const totalNorm = {
    normalized: normalizedTableData.reduce((a, r) => a + (r.within ? (r.normalized || 0) : 0), 0),
    actual:     normalizedTableData.reduce((a, r) => a + (r.within ? (r.actual     || 0) : 0), 0),
  };
  totalNorm.normChange = calcChange(totalNorm.normalized, totalNorm.actual);

  /* ================= CHARTS ============================= */
  const reportingDataMap = new Map(energyData.filter(d => d.Year === reportingYear)
    .map(d => [d.Month.trim(), getValue(d, ["Total Actual Energy Consumption_GJ", "Total Actual Energy Consumption"])]));
  const baselineDataMap = new Map(energyData.filter(d => d.Year === baselineYear)
    .map(d => [d.Month.trim(), getValue(d, ["Total Actual Energy Consumption_GJ", "Total Actual Energy Consumption"])]));
  const chartData = {
    labels: monthsChart,
    datasets: [
      { label: `Actual (${reportingYear})`, data: monthsChart.map(m => reportingDataMap.get(m) ?? 0), backgroundColor: "#2a9df4", order: 10 },
      { label: `Baseline (${baselineYear})`, data: monthsChart.map(m => baselineDataMap.get(m) ?? 0), backgroundColor: "#7cd560", order: 10 },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: "top" }, title: { display: true, text: `Energy Consumption: ${baselineYear} vs ${reportingYear}` } },
    scales: { y: { beginAtZero: true, title: { display: true, text: "Consumption (GJ)" } } }
  };

  const normReportMap = new Map(normalizedData
    .filter(d => d.Year === reportingYear)
    .map(d => [d.Month.trim(), getValue(d, ["Total Normalized Energy Consumption_GJ", "Total Normalized Energy Consumption", "Normalized"])]));
  const actReportMap = new Map(energyData
    .filter(d => d.Year === reportingYear)
    .map(d => [d.Month.trim(), getValue(d, ["Total Actual Energy Consumption_GJ", "Total Actual Energy Consumption"])]));
  const normalizedChartData = {
    labels: monthsChart,
    datasets: [
      { label: `${reportingYear} Actual`,      data: monthsChart.map(m => actReportMap.get(m)  || 0), backgroundColor: "#2a9df4", order: 10 },
      { label: `${reportingYear} Normalized`,  data: monthsChart.map(m => normReportMap.get(m) || 0), backgroundColor: "#FCCD00", order: 11 }
    ],
  };

  const base = showNormalized ? normalizedChartData : chartData;
  const metricName = showNormalized ? "Normalized Consumption" : "Actual Consumption";
  let datasets = base.datasets.map(ds => {
    const isBaseline = (ds.label || "").toLowerCase().includes("baseline");
    const period = isBaseline ? "Baseline Period" : "Reporting Period";
    return {
      ...ds,
      label: `${metricName} - ${period} (GJ)`,
      order: (!ds.type || ds.type === "bar") ? 10 : ds.order,
      customMeta: { metric: metricName, period, unit: "GJ" }
    };
  });

  const cddBaselineMap = new Map(costData.filter(d => d.Year === baselineYear)
    .map(d => [d.Month.trim(), parseNum(d["CDD"])]));
  const cddMap = new Map(costData.filter(d => d.Year === reportingYear)
    .map(d => [d.Month.trim(), parseNum(d["CDD"])]));
  const oatBaselineMap = new Map(energyData.filter(d => d.Year === baselineYear)
    .map(d => [d.Month.trim(), parseNum(d["Avg. OAT"])]));
  const oatMap = new Map(energyData.filter(d => d.Year === reportingYear)
    .map(d => [d.Month.trim(), parseNum(d["Avg. OAT"])]));
    
  if (cddEnabled) {
    datasets.push(
      { type:"line", label:"CDD - Baseline Period", data: monthsChart.map(m => cddBaselineMap.get(m) || 0), yAxisID:"y1", borderColor:"#000", borderDash:[5,5], fill:false, order:1, borderWidth:2, pointRadius:4, pointHoverRadius:6 },
      { type:"line", label:"CDD - Reporting Period", data: monthsChart.map(m => cddMap.get(m) || 0), yAxisID:"y1", borderColor:"#bd9d4b", fill:false, order:2, borderWidth:2, pointRadius:4, pointHoverRadius:6 }
    );
  }
  if (oatEnabled) {
    datasets.push(
      { type:"line", label:"Avg. OAT - Baseline Period", data: monthsChart.map(m => oatBaselineMap.get(m) || 0), yAxisID:"y1", borderColor:"#000", borderDash:[5,5], fill:false, order:1, borderWidth:2, pointRadius:4, pointHoverRadius:6 },
      { type:"line", label:"Avg. OAT - Reporting Period", data: monthsChart.map(m => oatMap.get(m) || 0), yAxisID:"y1", borderColor:"#bd9d4b", fill:false, order:2, borderWidth:2, pointRadius:4, pointHoverRadius:6 }
    );
  }

  const displayChartData = { labels: monthsChart, datasets };
  const displayChartOptions = {
    ...chartOptions,
    interaction: { mode: "nearest", intersect: true },
    scales: {
      ...chartOptions.scales,
      y1: {
        display: (cddEnabled || oatEnabled),
        position: "right",
        grid: { drawOnChartArea: false },
        beginAtZero: true,
        title: {
          display: (cddEnabled || oatEnabled),
          text: cddEnabled ? "Cooling Degree Days" : "Avg. OAT"
        }
      }
    },
    plugins: {
      ...chartOptions.plugins,
      datalabels: { display: false },
      title: { display: false },
      legend: { display: true, position: "bottom", align: "center", labels: { boxWidth: 16, padding: 12, usePointStyle: true } }
    }
  };

  const monthNumber = (name) => MONTHS_ORDER.indexOf(String(name).trim()) + 1;
  const EXCLUDE = new Set(["Month","month","MONTH","Year","year","YEAR","Item","ITEM","Index","#","Total","TOTAL"]);

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
      return (mLower === reportingMonth.toLowerCase() || mLower.slice(0, 3) === reportingMonth.slice(0, 3).toLowerCase());
    });

    if (!row) return { breakdownRows: [], breakdownTotal: 0 };

    const EXCLUDE_COLS = new Set(["month","year","item","index","#","total","miscellaneous"]);
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

    if (!items.length) return { breakdownRows: [], breakdownTotal: 0 };

    const total = items.reduce((sum, item) => sum + item.value, 0);
    const withPercentages = items.map(item => ({ ...item, pct: total > 0 ? (item.value / total) * 100 : 0 }))
                                 .sort((a, b) => b.value - a.value);

    return { breakdownRows: withPercentages, breakdownTotal: total };
  }, [breakdownRaw, reportingMonth, reportingYear]);

  /* ===== Donut data/options ===== */
  const PALETTE = ["#F7D36F","#A5D8F3","#84D2A6","#F29E9E","#CBA6F7","#57C7E3","#F6B26B","#93C47D","#6FA8DC","#E06666","#B4A7D6","#76A5AF","#FFD966","#8E7CC3","#6AA84F","#C27BA0","#A2C4C9","#EAD1DC"];
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
      donutData: { labels, datasets: [{ data: values, backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]), borderWidth: 1 }] },
      donutTotal: total
    };
  }, [breakdownRows]);

  const donutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: "60%",
    plugins: {
      title: { display: false },
      legend: { position: "bottom", align: "center", labels: { boxWidth: 14, padding: 12, usePointStyle: true } },
      tooltip: { callbacks: { label(ctx) { const val = Number(ctx.raw || 0); const total = donutTotal || 0; const p = total ? ((val / total) * 100).toFixed(1) : "0.0"; return `${ctx.label}: ${val.toLocaleString()} GJ (${p}%)`; } } },
      datalabels: { color: "#000", formatter: (value) => { const total = donutTotal || 0; const p = total ? ((value / total) * 100).toFixed(1) : "0.0"; return `${p}%`; }, font: { weight: "bold", size: 11 }, anchor: "center", align: "center" }
    }
  };

  const handleDownloadCSV = () => {
    if (isAll) {
      let csv = "Month,Energy Baseline (GJ),Energy Reporting (GJ),% Change Energy,Cost Baseline (MOP),Cost Reporting (MOP),% Change Cost,% Change CDD\n";
      actualTableData.forEach(r => {
        csv += [
          r.month,
          r.energy24 ?? "",
          r.energy25 ?? "",
          pct(r.energyChange),
          r.mop24 ?? "",
          r.mop25 ?? "",
          pct(r.mopChange),
          pct(r.cddChange)
        ].join(",") + "\n";
      });
      csv += [
        "Total",
        totalActual.energy24,
        totalActual.energy25,
        pct(totalActual.energyChange),
        totalActual.mop24,
        totalActual.mop25,
        pct(totalActual.mopChange),
        pct(totalCddChange)
      ].join(",") + "\n";
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Energy_AllSites_${baselineYear}_vs_${reportingYear}_${reportingMonth}.csv`;
      link.click();
      return;
    }

    if (showNormalized) {
      let csv = `Month,${reportingYear} Normalized Energy (GJ),${reportingYear} Actual Energy (GJ),% Change - Normalized\n`;
      normalizedTableData.forEach(r => {
        csv += [r.month, r.normalized ?? "", r.actual ?? "", pct(r.normChange)].join(",") + "\n";
      });
      csv += ["Total", totalNorm.normalized, totalNorm.actual, pct(totalNorm.normChange)].join(",") + "\n";
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Energy_Normalized_${reportingMonth}_${reportingYear}.csv`;
      link.click();
    } else {
      let csv = "Month,Energy Baseline (GJ),Energy Reporting (GJ),% Change Energy,Cost Baseline (MOP),Cost Reporting (MOP),% Change Cost,% Change CDD\n";
      actualTableData.forEach(r => {
        csv += [r.month, r.energy24 ?? "", r.energy25 ?? "", pct(r.energyChange), r.mop24 ?? "", r.mop25 ?? "", pct(r.mopChange), pct(r.cddChange)].join(",") + "\n";
      });
      csv += ["Total", totalActual.energy24, totalActual.energy25, pct(totalActual.energyChange), totalActual.mop24, totalActual.mop25, pct(totalActual.mopChange), pct(totalCddChange)].join(",") + "\n";
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Energy_Actual_${baselineYear}_vs_${reportingYear}_${reportingMonth}.csv`;
      link.click();
    }
  };

  const handleDownloadBreakdownCSV = () => {
    const siteName = site;
    let csv = "";
    csv += `Site,${escapeCSV(siteName)}\n`;
    csv += `Month,${escapeCSV(reportingMonth)}\n`;
    csv += `Year,${escapeCSV(reportingYear)}\n\n`;
    csv += `Category,Value (GJ),Percent\n`;
    breakdownRows.forEach(r => { csv += [escapeCSV(r.category), r.value ?? "", pctNum(r.pct)].join(",") + "\n"; });
    csv += ["Total", breakdownTotal ?? "", ""].join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Energy_Breakdown_${siteName}_${reportingMonth}_${reportingYear}.csv`;
    link.click();
  };

  return (
    <Container fluid style={{ marginTop:"120px", marginLeft:"80px" }}>
      {currentView === "multiYear" ? (
        <>
          <h1 className="section-title">
            <span className="title-main">Energy</span>
            <span className="title-sub clickable" onClick={() => setCurrentView("yearOnYear")}>
              <i className="fas fa-arrow-right" style={{ color: "orange", marginRight: "1px" }}><ArrowForwardIcon/></i>
              <h6 style={{ marginTop: "20px" }}>Year-on-Year</h6>
            </span>
          </h1>
          <EnergyMultipleYearComparison />
        </>
      ) : (
        <>
          {/* --- FIXED PAGE HEADER --- */}
          <Row className="utility-header align-items-center mb-3">
            <Col xs="auto">
             <div className="d-flex align-items-center gap-2" style={{ position: "relative", zIndex: 2000 }}>
               <img src={checkIcon} alt="Electricity" style={{ width: 36, height: 36, cursor: "pointer" }} onClick={() => navigate("/utility")} />
             
                 <img src={warningIcon} alt="Gas" style={{ width: 36, height: 36, cursor: "pointer" }} onClick={() => navigate("/gas")} />
            
               <img src={infoIcon} alt="Water" style={{ width: 36, height: 36, cursor: "pointer" }} onClick={() => navigate("/water")} />
               <img src={alertIcon} alt="Energy" style={{ width: 36, height: 36, cursor: "pointer" }} onClick={() => navigate("/energy")} />
             </div>
            </Col>

            <Col xs={6}>
            {!isAll && (
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center">
                  <strong style={{ minWidth: 200, fontWeight: 500, textAlign: "right" }}>Normalized Consumption</strong>
                  <Button size="sm" style={showNormalized ? enableBtnStyle : disableBtnStyle} onClick={() => setShowNormalized(true)} className="ms-2">Enable</Button>
                  <Button size="sm" style={showNormalized ? disableBtnStyle : enableBtnStyle} onClick={() => setShowNormalized(false)}>Disable</Button>
                </div>
                <div className="d-flex align-items-center">
                  <strong style={{ minWidth: 200, fontWeight: 500, textAlign: "right" }}>Avg. OAT</strong>
                  <Button size="sm" style={showOat ? enableBtnStyle : disableBtnStyle} onClick={() => { setShowOat(true); setShowCdd(false); }} className="ms-2">Enable</Button>
                  <Button size="sm" style={showOat ? disableBtnStyle : enableBtnStyle} onClick={() => setShowOat(false)}>Disable</Button>
                </div>
              </div>
            )}
            </Col>

            <Col xs="auto">
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center">
                  <Form.Label className="mb-0 me-1"><strong>Baseline</strong></Form.Label>
                  <Form.Select value={baselineYear} onChange={e => setBaselineYear(e.target.value)} style={{ minWidth: 75, fontSize: '0.9rem' }}>
                    {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </Form.Select>
                </div>
                <div className="d-flex align-items-center">
                  <Form.Label className="mb-0 me-1"><strong>Reporting</strong></Form.Label>
                  <Form.Select value={reportingMonth} onChange={e => setReportingMonth(e.target.value)} style={{ minWidth: 100, fontSize: '0.9rem' }}>
                    {MONTHS_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
                  </Form.Select>
                </div>
                <div>
                  <Form.Select value={reportingYear} onChange={e => setReportingYear(e.target.value)} style={{ minWidth: 75, fontSize: '0.9rem' }}>
                    {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </Form.Select>
                </div>
              </div>
            </Col>
          </Row>

          {/* --- MAIN LAYOUT --- */}
          <h1 className="section-title">
            <span className="title-main">Energy</span>
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
                  title={showNormalized ? "Download Normalized CSV" : "Download Actual CSV"} 
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
                    <tr ref={yoyHead1Ref}>
                      <th rowSpan="2" style={{...thHeaderStyle, width: '10%', fontSize: '0.7rem', padding: '4px 2px'}}>Month</th>
                      <th colSpan="3" style={{...thHeaderStyle, textAlign: 'center', fontSize: '0.7rem', padding: '4px 2px'}}>Energy Consumption (GJ)</th>
                      <th colSpan="3" style={{...thHeaderStyle, textAlign: 'center', fontSize: '0.7rem', padding: '4px 2px'}}>Energy Cost (MOP)</th>
                      <th rowSpan="2" style={{...thHeaderStyle, width: '10%', fontSize: '0.7rem', padding: '4px 2px'}}>% Change CDD</th>
                    </tr>
                    <tr ref={yoyHead2Ref}>
                      <th style={{...thHeaderStyle, width: '15%', fontSize: '0.65rem', padding: '2px'}}>{baselineYear}</th>
                      <th style={{...thHeaderStyle, width: '15%', fontSize: '0.65rem', padding: '2px'}}>{reportingYear}</th>
                      <th style={{...thHeaderStyle, width: '8%', fontSize: '0.65rem', padding: '2px'}}>% Change</th>
                      <th style={{...thHeaderStyle, width: '15%', fontSize: '0.65rem', padding: '2px'}}>{baselineYear}</th>
                      <th style={{...thHeaderStyle, width: '15%', fontSize: '0.65rem', padding: '2px'}}>{reportingYear}</th>
                      <th style={{...thHeaderStyle, width: '8%', fontSize: '0.65rem', padding: '2px'}}>% Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actualTableData.map((row, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#F5DEB3' }}>
                        <td style={{ fontSize: '0.7rem', padding: '2px 4px' }}>{row.month.slice(0,3)}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.energy24?.toLocaleString()}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.energy25?.toLocaleString()}</td>
                        <td className={`number-cell ${getColor(row.energyChange)}`} style={{ fontSize: '0.7rem', padding: '2px' }}>{row.energyChange}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.mop24?.toLocaleString()}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.mop25?.toLocaleString()}</td>
                        <td className={`number-cell ${getColor(row.mopChange)}`} style={{ fontSize: '0.7rem', padding: '2px' }}>{row.mopChange}</td>
                        <td className={`number-cell ${getColor(row.cddChange)}`} style={{ fontSize: '0.7rem', padding: '2px' }}>{row.cddChange}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Total</td>
                      <td className="number-cell" title={totalActual.energy24.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalActual.energy24)}</td>
                      <td className="number-cell" title={totalActual.energy25.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalActual.energy25)}</td>
                      <td className={`number-cell ${getColor(totalActual.energyChange)}`} style={{ fontSize: '0.7rem' }}>{totalActual.energyChange}</td>
                      <td className="number-cell" title={totalActual.mop24.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalActual.mop24)}</td>
                      <td className="number-cell" title={totalActual.mop25.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalActual.mop25)}</td>
                      <td className={`number-cell ${getColor(totalActual.mopChange)}`} style={{ fontSize: '0.7rem' }}>{totalActual.mopChange}</td>
                      <td className={`number-cell ${getColor(totalCddChange)}`} style={{ fontSize: '0.7rem' }}>{totalCddChange}</td>
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
                      <th style={{...thHeaderStyle, width: '30%', fontSize: '0.7rem', padding: '4px 2px'}}>{reportingYear} Normalized (GJ)</th>
                      <th style={{...thHeaderStyle, width: '30%', fontSize: '0.7rem', padding: '4px 2px'}}>{reportingYear} Actual (GJ)</th>
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
                  <div><strong>{breakdownTotal ? breakdownTotal.toLocaleString() : "-"} GJ</strong></div>
                </div>
              </div>

              <div style={{ fontSize: "0.75rem" }}>
                <Table bordered className="text-center table-sm shadow-sm"
                  style={{ width: "100%", border: "2px solid #8B4513", borderTop: "none", borderCollapse: "collapse", minHeight: "400px" }}>
                  <thead style={{ background:'#F5DEB3' }}>
                    <tr ref={breakdownHead1Ref}>
                      <th style={{...thHeaderStyle, fontSize: '0.7rem', padding: '4px 2px'}}>Category</th>
                      <th style={{...thHeaderStyle, fontSize: '0.7rem', padding: '4px 2px'}}>{reportingMonth} {reportingYear} (GJ)</th>
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

export default Energy;