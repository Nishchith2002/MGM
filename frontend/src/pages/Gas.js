




import React, { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import "../pages/UtilityLayout.css";
import ChartDataLabels from "chartjs-plugin-datalabels";
import GasMultipleYearComparison from "./GasMultipleYearComparison";
import Papa from "papaparse";
import { Bar, Doughnut } from "react-chartjs-2";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from "react-router-dom";

// icons
import checkIcon from '../../src/assets/icons/energyDG.png';
import warningIcon from '../../src/assets/icons/gasHovered.png';
import infoIcon from '../../src/assets/icons/waterHovered.png';
import alertIcon from '../../src/assets/icons/electricityHovered.png';

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
import DownloadIcon from "@mui/icons-material/Download";
import { IconButton } from "@mui/material";

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

const GAS_UNITS = ["GJ", "kg", "m3"];

/* ---------- Aliases so all CSV header variants work ---------- */
/* We’ll aggregate in GJ for “All” to avoid mixed units */
const GAS_ACT_GJ_ALIASES = [
  "Actual Natural Gas Consumption_GJ",
  "Actual Natural Gas Consumption (GJ)",
  "Actual Natural Gas Consumption",
  "Actual  Gas Consumption_GJ",
  "Actual Gas Consumption_GJ",
  "Actual Gas Consumption (GJ)",
  "Actual Gas Consumption_Gj"
];

const GAS_NORM_GJ_ALIASES = [
  "Normalized Natural Gas Consumption_GJ",
  "Normalized Natural Gas Consumption (GJ)",
  "Normalized Natural Gas Consumption",
  "Normalized Gas Consumption_GJ",
  "Normalized  Gas Consumption_GJ",
  "Normalized Gas Consumption (GJ)",
  "Normalized Gas Consumption_Gj"
];

/* Macho specific extra units for single-site mode only */
const GAS_ACT_KG_ALIASES = [
  "Actual  Gas Consumption_kg",
  "Actual Gas Consumption_kg",
  "Actual Gas (kg)"
];
const GAS_NORM_KG_ALIASES = [
  "Normalized Gas Consumption_kg",
  "Normalized  Gas Consumption_kg",
  "Normalized Gas (kg)"
];
const GAS_ACT_M3_ALIASES = [
  "Actual Gas Consumption_m3",
  "Actual  Gas Consumption_m3",
  "Actual Gas (m3)"
];
const GAS_NORM_M3_ALIASES = [
  "Normalized Gas Consumption_m3",
  "Normalized  Gas Consumption_m3",
  "Normalized Gas (m3)"
];

const GAS_COST_ALIASES = [
  "NG Cost",
  "Gas Cost",
  "Natural Gas Cost",
  "Actual Gas Cost (MOP)"
];

const MIN_OAT_ALIASES = ["Min OAT", "Minimum OAT", "Min. OAT"];
const AVG_OAT_ALIASES = ["Avg. OAT", "Average OAT", "Avg OAT"];

/* Site-specific dynamic maps (kept for single-site mode) */
const GAS_DYNAMIC_COLUMNS = {
  Cotai: {
    actual: {
      GJ: ["Actual Natural Gas Consumption_GJ", "Actual Natural Gas Consumption"]
    },
    normalized: {
      GJ: ["Normalized Natural Gas Consumption_GJ", "Normalized Natural Gas Consumption"]
    }
  },
  Macho: {
    actual: {
      GJ: ["Actual  Gas Consumption_GJ", "Actual Gas Consumption_GJ"],
      kg: ["Actual  Gas Consumption_kg", "Actual Gas Consumption_kg"],
      m3: ["Actual Gas Consumption_m3", "Actual  Gas Consumption_m3"]
    },
    normalized: {
      GJ: ["Normalized Gas Consumption_GJ", "Normalized  Gas Consumption_GJ"],
      kg: ["Normalized Gas Consumption_kg", "Normalized  Gas Consumption_kg"],
      m3: ["Normalized Gas Consumption_m3", "Normalized  Gas Consumption_m3"]
    }
  }
};

const GAS_COST_COLUMNS = {
  Cotai: ["NG Cost"],
  Macho: ["Gas Cost"]
};

/* We have per-site gas breakdown files only (no 'All') */
const BREAKDOWN_FILES = {
  Cotai: "Cotai_Gas_Breakdown.csv",
  Macho: "Macho_Gas_Breakdown.csv",
}

/** ---- sync three header areas' heights ---- */
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

/* -------- helpers shared with Water logic -------- */
const parseNum = (val) => Number(String(val ?? "").replace(/,/g, "")) || 0;

const normalizeMonth = (m) => {
  if (!m) return "";
  const s = String(m).trim();
  const n = Number(s);
  if (Number.isFinite(n) && n >= 1 && n <= 12) return MONTHS_ORDER[n - 1];
  const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return MONTHS_ORDER.includes(cap) ? cap : s;
};

const pickFieldEnhanced = (row, aliases) => {
  if (!row) return 0;
  for (const name of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, name)) {
      const raw = String(row[name] ?? "").trim();
      if (raw !== "" && raw !== "-" && raw !== "0") return parseNum(raw);
    }
  }
  return 0;
};

const sumFor = (rows, { year, month, aliases }) =>
  rows
    .filter(r => String(r.Year).trim() === String(year).trim() && normalizeMonth(r.Month) === normalizeMonth(month))
    .reduce((a, r) => a + pickFieldEnhanced(r, aliases), 0);

const makeMonthMap = (rows, { year, aliases }) => {
  const m = new Map();
  MONTHS_ORDER.forEach(month => {
    const v = rows
      .filter(r => String(r.Year).trim() === String(year).trim() && normalizeMonth(r.Month) === month)
      .reduce((a, r) => a + pickFieldEnhanced(r, aliases), 0);
    m.set(month, v);
  });
  return m;
};

/* Sum + avg aggregator for “All” (Cotai + Macho) */
const aggregateAllSitesEnhanced = (rows, { sum = {}, avg = {} }) => {
  const map = new Map();
  rows.forEach((r) => {
    const Year = String(r.Year).trim();
    const Month = normalizeMonth(r.Month);
    const key = `${Year}|${Month}`;
    if (!map.has(key)) {
      const init = { Year, Month };
      Object.keys(sum).forEach(k => (init[k] = 0));
      Object.keys(avg).forEach(k => (init[`__${k}`] = { s: 0, c: 0 }));
      map.set(key, init);
    }
    const acc = map.get(key);
    Object.entries(sum).forEach(([outKey, srcAliases]) => {
      acc[outKey] += pickFieldEnhanced(r, srcAliases);
    });
    Object.entries(avg).forEach(([outKey, srcAliases]) => {
      const v = pickFieldEnhanced(r, srcAliases);
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

const Gas = ({ onNavigateToUtility }) => {
  const navigate = useNavigate();
  const [selectedUnit, setSelectedUnit] = useState("GJ");

  const [gasData, setGasData] = useState([]);          // main (actual/normalized for single-site OR aggregated for All)
  const [costData, setCostData] = useState([]);        // costs & OAT(s)
  const [normalizedData, setNormalizedData] = useState([]); // single-site normalized source (not used for All)
  const [breakdownRaw, setBreakdownRaw] = useState([]);

  const [site, setSite] = useState(localStorage.getItem("selectedSite") || "Cotai");
  const isAll = site === "All";

  const [showNormalized, setShowNormalized] = useState(false);
  const [showCdd, setShowCdd] = useState(false);   // not used on Gas; kept for parity if needed later
  const [showOat, setShowOat] = useState(true);
  const [showMinOat, setShowMinOat] = useState(false);

  const [reportingYear, setReportingYear] = useState("2025");
  const [reportingMonth, setReportingMonth] = useState("December");
  const [currentView, setCurrentView] = useState("yearOnYear");
  const [baselineYear, setBaselineYear] = useState("2024");

  const thHeaderStyle = { backgroundColor:"#F5DEB3", border:"1px solid #8B4513", color:"black" };
  const toggleBtnBase = { width:'70px', padding:'2px 6px', fontSize:'0.85rem', marginRight:'8px', borderRadius:'2px' };
  const enableBtnStyle = { ...toggleBtnBase, backgroundColor:'#B1A265', border:'1px solid #8B4513', color:'#000' };
  const disableBtnStyle = { ...toggleBtnBase, backgroundColor:'#6c757d', border:'1px solid #5a6268', color:'#fff' };





  // Use the same API as Utility/Water, with cache-busting and basic cleaning
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


  // header row refs
  const yoyHead1Ref = useRef(null);
  const yoyHead2Ref = useRef(null);
  const normHead1Ref = useRef(null);
  const normHead2Ref = useRef(null);
  const breakdownHead1Ref = useRef(null);
  const breakdownHead2Ref = useRef(null);

  // keep headers aligned
  useSyncHeaderHeights(
    yoyHead1Ref, yoyHead2Ref,
    normHead1Ref, normHead2Ref,
    breakdownHead1Ref, breakdownHead2Ref,
    [baselineYear, reportingYear, selectedUnit, site]
  );


  // when switching to All, force unit to GJ and disable normalized toggle
useEffect(() => {
  if (isAll) {
    setSelectedUnit("GJ");
    setShowNormalized(false);
    setShowOat(false);        // Hide Avg OAT
    setShowMinOat(true);      // Show Min OAT by default
  }
}, [isAll]);
 

  useEffect(() => {
    if (!breakdownRaw.length) return;
    const years = [...new Set(breakdownRaw.map(r => String(r.Year).trim()))];
    if (years.length && !years.includes(reportingYear)) {
      setReportingYear(years[years.length - 1]);
    }
  }, [breakdownRaw, reportingYear]);

  useEffect(() => {
    if (!gasData.length) return;
    const years = [...new Set(gasData.map(d => d.Year))];
    if (!years.includes(baselineYear)) {
      const prev = (parseInt(reportingYear) - 1).toString();
      setBaselineYear(years.includes(prev) ? prev : years[0]);
    }
  }, [gasData, reportingYear, baselineYear]);

  useEffect(() => {
    if (!reportingYear) return;
    const desired = String(Number(reportingYear) - 1);
    const years = [...new Set(gasData.map(d => d.Year))];
    let pick = desired;
    if (years.length && !years.includes(desired)) {
      const sorted = years.map(Number).sort((a, b) => a - b);
      const smaller = sorted.filter(y => y < Number(reportingYear));
      if (smaller.length) pick = String(smaller[smaller.length - 1]);
    }
    if (pick !== baselineYear) setBaselineYear(pick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingYear, gasData]);

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
        parseCsv(`${site}_Cleaned_Consumption.csv`) // if normalized lives here
      ]).then(([cons, cost, norm]) => {
        setGasData(cons);
        setCostData(cost);
        setNormalizedData(norm);
      });
    } else {
      Promise.all([
        parseCsv(`Cotai_Cleaned_Consumption.csv`),
        parseCsv(`Macho_Cleaned_Consumption.csv`),
        parseCsv(`Cotai_Cost_Corrected_Full.csv`),
        parseCsv(`Macho_Cost_Corrected_Full.csv`)
      ]).then(([consCotai, consMacho, costCotai, costMacho]) => {
        const consAgg = aggregateAllSitesEnhanced(
          [...consCotai, ...consMacho],
          { sum: { "Actual Gas GJ": GAS_ACT_GJ_ALIASES, "Normalized Gas GJ": GAS_NORM_GJ_ALIASES },
            avg: { "Avg. OAT": AVG_OAT_ALIASES } }
        );
        const costAgg = aggregateAllSitesEnhanced(
          [...costCotai, ...costMacho],
          { sum: { "Gas Cost": GAS_COST_ALIASES },
            avg: { "Min OAT": MIN_OAT_ALIASES, "Avg. OAT": AVG_OAT_ALIASES } }
        );
        setGasData(consAgg);
        setCostData(costAgg);
        setNormalizedData([]); // not used in "All"
      });
    }
  };

  window.addEventListener("csvUpdated", reload);
  return () => window.removeEventListener("csvUpdated", reload);
}, [site]);



  // load csvs (single-site vs All)
useEffect(() => {
  let mounted = true;
  if (!site) return;

  const load = async () => {
    if (site !== "All") {
      const [cons, cost, norm] = await Promise.all([
        parseCsv(`${site}_Cleaned_Consumption.csv`),
        parseCsv(`${site}_Cost_Corrected_Full.csv`),
        parseCsv(`${site}_Cleaned_Consumption.csv`) // adjust if normalized is a different file
      ]);
      if (!mounted) return;
      setGasData(cons);
      setCostData(cost);
      setNormalizedData(norm);
      return;
    }

    // === All sites: aggregate Cotai + Macho in GJ ===
    const [consCotai, consMacho, costCotai, costMacho] = await Promise.all([
      parseCsv(`Cotai_Cleaned_Consumption.csv`),
      parseCsv(`Macho_Cleaned_Consumption.csv`),
      parseCsv(`Cotai_Cost_Corrected_Full.csv`),
      parseCsv(`Macho_Cost_Corrected_Full.csv`)
    ]);
    if (!mounted) return;

    const consAgg = aggregateAllSitesEnhanced(
      [...consCotai, ...consMacho],
      { sum: { "Actual Gas GJ": GAS_ACT_GJ_ALIASES, "Normalized Gas GJ": GAS_NORM_GJ_ALIASES },
        avg: { "Avg. OAT": AVG_OAT_ALIASES } }
    );
    const costAgg = aggregateAllSitesEnhanced(
      [...costCotai, ...costMacho],
      { sum: { "Gas Cost": GAS_COST_ALIASES },
        avg: { "Min OAT": MIN_OAT_ALIASES, "Avg. OAT": AVG_OAT_ALIASES } }
    );

    setGasData(consAgg);
    setCostData(costAgg);
    setNormalizedData([]); // not used in "All"
  };

  load();
  return () => { mounted = false; };
}, [site]);


  // load breakdown only for single sites
 useEffect(() => {
  if (isAll) { setBreakdownRaw([]); return; }
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
}, [site, isAll]);

  const breakdownYears = [...new Set(breakdownRaw.map(r => r.Year))];
  const allYears = [...new Set([...gasData.map(d => d.Year), ...breakdownYears])].sort();

  const getValue = (row, keys) => {
    if (!row || !Array.isArray(keys)) return null;
    for (let k of keys) {
      if (row[k] !== undefined && row[k] !== "") return parseNum(row[k]);
    }
    return null;
  };

  const fmt = (v) => (v === null || v === undefined || Number.isNaN(v)) ? "" : v.toLocaleString();
  const pct = (s) => (s && s !== "NaN%" && s !== "Infinity%" && s !== "-Infinity%") ? s : "";
  const pctNum = (n) => (Number.isFinite(n) ? `${n.toFixed(1)}%` : "");
  const getColor = (val) => (!val || typeof val !== "string") ? "" : val.startsWith("-") ? "text-success" : "text-danger";
  const calcChange = (a, b) => (a != null && b != null && a !== 0) ? `${(((b - a) / a) * 100).toFixed(1)}%` : "";

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

    if (isAll) {
      // All-sites: use aggregated maps (GJ only)
      const gas24 = within ? sumFor(gasData, { year: baselineYear, month, aliases: ["Actual Gas GJ"] }) : null;
      const gas25 = within ? sumFor(gasData, { year: reportingYear, month, aliases: ["Actual Gas GJ"] }) : null;

      const mop24 = within ? sumFor(costData, { year: baselineYear, month, aliases: ["Gas Cost"] }) : null;
      const mop25 = within ? sumFor(costData, { year: reportingYear, month, aliases: ["Gas Cost"] }) : null;

      const oat24 = within ? sumFor(costData, { year: baselineYear, month, aliases: MIN_OAT_ALIASES }) : null;
      const oat25 = within ? sumFor(costData, { year: reportingYear, month, aliases: MIN_OAT_ALIASES }) : null;

     const avgOat24 = within ? sumFor(gasData, { year: baselineYear, month, aliases: ["Avg. OAT"] }) : null;
const avgOat25 = within ? sumFor(gasData, { year: reportingYear, month, aliases: ["Avg. OAT"] }) : null;

      return {
        month, within,
        gas24, gas25, mop24, mop25,
        oat24, oat25, avgOat24, avgOat25,
        gasChange: calcChange(gas24, gas25),
        mopChange: calcChange(mop24, mop25),
        oatChange: calcChange(oat24, oat25),
        avgOatChange: calcChange(avgOat24, avgOat25)
      };
    }

    // single-site (original logic)
    const base = within ? gasData.find(d => normalizeMonth(d.Month) === month && String(d.Year).trim() === String(baselineYear).trim()) : null;
    const report = within ? gasData.find(d => normalizeMonth(d.Month) === month && String(d.Year).trim() === String(reportingYear).trim()) : null;
    const baseCost = within ? costData.find(d => normalizeMonth(d.Month) === month && String(d.Year).trim() === String(baselineYear).trim()) : null;
    const reportCost = within ? costData.find(d => normalizeMonth(d.Month) === month && String(d.Year).trim() === String(reportingYear).trim()) : null;

    const gasCols = GAS_DYNAMIC_COLUMNS[site]?.actual[selectedUnit] || [];
    const gas24 = base ? getValue(base, gasCols) : null;
    const gas25 = report ? getValue(report, gasCols) : null;

    const costCols = GAS_COST_COLUMNS[site] || GAS_COST_COLUMNS.Cotai;
    const mop24 = baseCost ? getValue(baseCost, costCols) : null;
    const mop25 = reportCost ? getValue(reportCost, costCols) : null;

    const oat24 = baseCost ? pickFieldEnhanced(baseCost, MIN_OAT_ALIASES) : null;
    const oat25 = reportCost ? pickFieldEnhanced(reportCost, MIN_OAT_ALIASES) : null;

   const avgOat24 = within ? sumFor(gasData, { year: baselineYear, month, aliases: ["Avg. OAT"] }) : null;
const avgOat25 = within ? sumFor(gasData, { year: reportingYear, month, aliases: ["Avg. OAT"] }) : null;
    return {
      month, within,
      gas24, gas25, mop24, mop25,
      oat24, oat25, avgOat24, avgOat25,
      gasChange: calcChange(gas24, gas25),
      mopChange: calcChange(mop24, mop25),
      oatChange: calcChange(oat24, oat25),
      avgOatChange: calcChange(avgOat24, avgOat25)
    };
  });

  const totalActual = {
    gas24: sumLimited(actualTableData, "gas24"),
    gas25: sumLimited(actualTableData, "gas25"),
    mop24: sumLimited(actualTableData, "mop24"),
    mop25: sumLimited(actualTableData, "mop25"),
  };
  totalActual.gasChange = calcChange(totalActual.gas24, totalActual.gas25);
  totalActual.mopChange = calcChange(totalActual.mop24, totalActual.mop25);

  const totalOATBaseline  = sumLimited(actualTableData, "oat24");
  const totalOATReporting = sumLimited(actualTableData, "oat25");
  const totalOatChange = totalOATBaseline > 0 ? `${(((totalOATReporting - totalOATBaseline) / totalOATBaseline) * 100).toFixed(1)}%` : "-";

  const totalAvgOATBaseline  = sumLimited(actualTableData, "avgOat24");
  const totalAvgOATReporting = sumLimited(actualTableData, "avgOat25");
  const totalAvgOatChange = totalAvgOATBaseline > 0 ? `${(((totalAvgOATReporting - totalAvgOATBaseline) / totalAvgOATBaseline) * 100).toFixed(1)}%` : "-";

  /* ================= NORMALIZED TABLE (hidden for All) ================= */
  const normalizedTableData = monthsTable.map((month, idx) => {
    const within = idx <= reportingMonthIndex;
    if (!within) return { month, within, normalized: null, actual: null, normChange: "" };

    if (isAll) {
      // We won’t render this table for All, but keep data consistent if you ever export
      const normalized = sumFor(gasData, { year: reportingYear, month, aliases: ["Normalized Gas GJ"] });
      const actual     = sumFor(gasData, { year: reportingYear, month, aliases: ["Actual Gas GJ"] });
      return { month, within, normalized, actual, normChange: calcChange(normalized, actual) };
    }

    const normAliases = selectedUnit === "GJ" ? GAS_NORM_GJ_ALIASES
                        : selectedUnit === "kg" ? GAS_NORM_KG_ALIASES
                        : GAS_NORM_M3_ALIASES;

    const actAliases  = selectedUnit === "GJ" ? GAS_ACT_GJ_ALIASES
                        : selectedUnit === "kg" ? GAS_ACT_KG_ALIASES
                        : GAS_ACT_M3_ALIASES;

    // single-site: read from appropriate arrays
    const normRow = normalizedData.find(d => normalizeMonth(d.Month) === month && String(d.Year).trim() === String(reportingYear).trim());
    const actualRow = gasData.find(d => normalizeMonth(d.Month) === month && String(d.Year).trim() === String(reportingYear).trim());

    const normalized = pickFieldEnhanced(normRow, normAliases);
    const actual     = pickFieldEnhanced(actualRow, actAliases);

    return { month, within, normalized, actual, normChange: calcChange(normalized, actual) };
  });

  const totalNorm = {
    normalized: normalizedTableData.reduce((a, r) => a + (r.within ? (r.normalized || 0) : 0), 0),
    actual:     normalizedTableData.reduce((a, r) => a + (r.within ? (r.actual     || 0) : 0), 0),
  };
  totalNorm.normChange = calcChange(totalNorm.normalized, totalNorm.actual);

  /* ================= CHARTS ================= */
  const yAxisUnitLabel = (isAll || selectedUnit === "GJ") ? "GJ" : selectedUnit;

  const reportingDataMap = isAll
    ? makeMonthMap(gasData, { year: reportingYear, aliases: ["Actual Gas GJ"] })
    : makeMonthMap(gasData, {
        year: reportingYear,
        aliases: selectedUnit === "GJ" ? GAS_ACT_GJ_ALIASES
               : selectedUnit === "kg" ? GAS_ACT_KG_ALIASES
               : GAS_ACT_M3_ALIASES
      });

  const baselineDataMap = isAll
    ? makeMonthMap(gasData, { year: baselineYear, aliases: ["Actual Gas GJ"] })
    : makeMonthMap(gasData, {
        year: baselineYear,
        aliases: selectedUnit === "GJ" ? GAS_ACT_GJ_ALIASES
               : selectedUnit === "kg" ? GAS_ACT_KG_ALIASES
               : GAS_ACT_M3_ALIASES
      });

  const chartData = {
    labels: monthsChart,
    datasets: [
      { label: `Actual (${reportingYear})`, data: monthsChart.map(m => reportingDataMap.get(m) ?? 0), backgroundColor: "#2a9df4", order: 10 },
      { label: `Baseline (${baselineYear})`, data: monthsChart.map(m => baselineDataMap.get(m) ?? 0), backgroundColor: "#7cd560", order: 10 },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: "top" }, title: { display: true, text: `Gas Consumption: ${baselineYear} vs ${reportingYear}` } },
    scales: { y: { beginAtZero: true, title: { display: true, text: `Consumption (${yAxisUnitLabel})` } } }
  };

  const normReportMap = isAll
    ? makeMonthMap(gasData, { year: reportingYear, aliases: ["Normalized Gas GJ"] })
    : makeMonthMap(normalizedData, {
        year: reportingYear,
        aliases: selectedUnit === "GJ" ? GAS_NORM_GJ_ALIASES
               : selectedUnit === "kg" ? GAS_NORM_KG_ALIASES
               : GAS_NORM_M3_ALIASES
      });

  const normalizedChartData = {
    labels: monthsChart,
    datasets: [
      { label: `${reportingYear} Actual`,     data: monthsChart.map(m => (reportingDataMap.get(m) || 0)), backgroundColor: "#2a9df4", order: 10 },
      { label: `${reportingYear} Normalized`, data: monthsChart.map(m => (normReportMap.get(m) || 0)),     backgroundColor: "#FCCD00", order: 11 }
    ]
  };

  const base = isAll ? chartData : (showNormalized ? normalizedChartData : chartData);
  const metricName = showNormalized ? "Normalized Consumption" : "Actual Consumption";
  let datasets = base.datasets.map(ds => {
    const isBaseline = (ds.label || "").toLowerCase().includes("baseline");
    const period = isBaseline ? "Baseline Period" : "Reporting Period";
    return {
      ...ds,
      label: `${metricName} - ${period} (${yAxisUnitLabel})`,
      customMeta: { metric: metricName, period, unit: yAxisUnitLabel }
    };
  });

  // OAT overlays (single-site only)
 // For All sites, both Min OAT and Avg OAT should come from costData
const oatBaselineMap = isAll 
  ? makeMonthMap(costData, { year: baselineYear, aliases: MIN_OAT_ALIASES })
  : makeMonthMap(costData, { year: baselineYear, aliases: MIN_OAT_ALIASES });

const oatMap = isAll
  ? makeMonthMap(costData, { year: reportingYear, aliases: MIN_OAT_ALIASES })
  : makeMonthMap(costData, { year: reportingYear, aliases: MIN_OAT_ALIASES });

const avgOatBaseMap = isAll
  ? makeMonthMap(costData, { year: baselineYear, aliases: AVG_OAT_ALIASES })  // Changed from gasData to costData
  : makeMonthMap(gasData, { year: baselineYear, aliases: AVG_OAT_ALIASES });

const avgOatMap = isAll
  ? makeMonthMap(costData, { year: reportingYear, aliases: AVG_OAT_ALIASES })  // Changed from gasData to costData
  : makeMonthMap(gasData, { year: reportingYear, aliases: AVG_OAT_ALIASES });

if (showOat) {
    datasets.push(
      { type:"line", label:"Avg. OAT - Baseline Period", data: monthsChart.map(m => avgOatBaseMap.get(m) || 0), yAxisID:"y1", borderColor:"#000", borderDash:[5,5], fill:false, order:1, borderWidth:2, pointRadius:4, pointHoverRadius:6, customMeta:{metric:"Avg. OAT",period:"Baseline Period",unit:""} },
      { type:"line", label:"Avg. OAT - Reporting Period", data: monthsChart.map(m => avgOatMap.get(m) || 0), yAxisID:"y1", borderColor:"#bd9d4b", fill:false, order:2, borderWidth:2, pointRadius:4, pointHoverRadius:6, customMeta:{metric:"Avg. OAT",period:"Reporting Period",unit:""} }
    );
  }
  if (showMinOat) {
    datasets.push(
      { type:"line", label:"Min OAT - Baseline Period", data: monthsChart.map(m => oatBaselineMap.get(m) || 0), yAxisID:"y1", borderColor:"#000", borderDash:[5,5], fill:false, order:1, borderWidth:2, pointRadius:4, pointHoverRadius:6, customMeta:{metric:"Min OAT",period:"Baseline Period",unit:""} },
      { type:"line", label:"Min OAT - Reporting Period", data: monthsChart.map(m => oatMap.get(m) || 0), yAxisID:"y1", borderColor:"#bd9d4b", fill:false, order:2, borderWidth:2, pointRadius:4, pointHoverRadius:6, customMeta:{metric:"Min OAT",period:"Reporting Period",unit:""} }
    );
  }

  const displayChartData = { labels: monthsChart, datasets };
  const displayChartOptions = {
    ...chartOptions,
    interaction: { mode: "nearest", intersect: true },
    scales: {
      ...chartOptions.scales,
     y1: { display: (showOat || showMinOat),  position: "right", grid: { drawOnChartArea: false }, beginAtZero: true, title: { display: !isAll && (showOat || showMinOat), text: showMinOat ? "Min OAT" : "Avg. OAT" } }
    },
    plugins: {
      ...chartOptions.plugins,
      datalabels: { display: false },
      title: { display: false },
      legend: { display: true, position: "bottom", align: "center", labels: { boxWidth: 16, padding: 12, usePointStyle: true } }
    }
  };

  // ===== BREAKDOWN (single-site only) =====
  const EXCLUDE = new Set(["Month","month","MONTH","Year","year","YEAR","Item","ITEM","Index","#","Total","TOTAL"]);
  const { breakdownRows, breakdownTotal } = useMemo(() => {
    if (isAll || !breakdownRaw?.length) return { breakdownRows: [], breakdownTotal: 0 };
    let items = [];
    const row = breakdownRaw.find(r => String(r.Year).trim() === reportingYear && normalizeMonth(r.Month) === reportingMonth);
    if (row) {
      // Cotai: auto-detect numeric columns; Macho: specific categories per unit
      let categoryColumns = [];
      if (site === "Macho") {
        const u = selectedUnit;
        if (u === "kg") categoryColumns = ["Boiler", "Kitchen", "Hotel Upper Zone DHW"];
        else if (u === "GJ") categoryColumns = ["Boiler_GJ", "Kitchen_GJ", "Hotel Upper Zone DHW_GJ"];
        else if (u === "m3") categoryColumns = ["Boiler_m3", "Kitchen_m3", "Hotel Upper Zone DHW_m3"];
      } else {
        categoryColumns = Object.keys(row).filter(key => {
          if (EXCLUDE.has(key)) return false;
          return !isNaN(parseNum(row[key]));
        });
      }
      items = categoryColumns
        .filter(col => row[col] !== undefined && row[col] !== "")
        .map(col => ({ category: col.replace(/_gj|_m3/gi, "").trim(), value: parseNum(row[col]) }));
    }
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const withPct = items.map(it => ({ ...it, pct: total > 0 ? (it.value / total) * 100 : 0 }));
    return { breakdownRows: withPct, breakdownTotal: total };
  }, [breakdownRaw, reportingMonth, reportingYear, selectedUnit, site, isAll]);

  const PALETTE = ["#F7D36F","#A5D8F3","#84D2A6","#F29E9E","#CBA6F7","#57C7E3","#F6B26B","#93C47D","#6FA8DC","#E06666","#B4A7D6","#76A5AF","#FFD966","#8E7CC3","#6AA84F","#C27BA0","#A2C4C9","#EAD1DC"];
  const TOP_N = 12;

  const { donutData, donutTotal } = useMemo(() => {
    if (isAll || !breakdownRows?.length) return { donutData: null, donutTotal: 0 };
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
  }, [breakdownRows, isAll]);

  const donutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: "60%",
    plugins: {
      title: { display: false },
      legend: { position: "bottom", align: "center", labels: { boxWidth: 14, padding: 12, usePointStyle: true } },
      tooltip: { callbacks: { label(ctx) {
        const val = Number(ctx.raw || 0); const total = donutTotal || 0; const p = total ? ((val / total) * 100).toFixed(1) : "0.0";
        return `${ctx.label}: ${val.toLocaleString()} ${selectedUnit} (${p}%)`; } } },
      datalabels: { color: "#000", formatter: (value) => { const total = donutTotal || 0; const p = total ? ((value / total) * 100).toFixed(1) : "0.0"; return `${p}%`; }, font: { weight: "bold", size: 11 }, anchor: "center", align: "center" }
    }
  };

  const getGasTypeLabel = () => {
    if (isAll) return "Gas";
    return (site === "Macho" ? "LPG" : "Natural Gas");
  };

  // CSV helpers
  const escapeCSV = (v) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };

  const handleDownloadCSV = () => {
    const gasLabel = `${getGasTypeLabel()} (${yAxisUnitLabel})`;

    if (!isAll && showNormalized) {
      let csv = `Month,${reportingYear} Normalized ${gasLabel},${reportingYear} Actual ${gasLabel},% Change - Normalized\n`;
      normalizedTableData.filter(r => r.within).forEach(r => {
        csv += [r.month, r.normalized ?? "", r.actual ?? "", pct(r.normChange)].join(",") + "\n";
      });
      csv += ["Total", totalNorm.normalized, totalNorm.actual, pct(totalNorm.normChange)].join(",") + "\n";
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Gas_Normalized_${site}_${yAxisUnitLabel}_${reportingMonth}_${reportingYear}.csv`;
      link.click();
    } else {
      let csv = `Month,${gasLabel} Baseline,${gasLabel} Reporting,% Change ${gasLabel},Cost Baseline (MOP),Cost Reporting (MOP),% Change Cost,% Change Min OAT,% Change Avg OAT\n`;
      actualTableData.filter(r => r.within).forEach(r => {
        csv += [
          r.month, r.gas24 ?? "", r.gas25 ?? "", pct(r.gasChange),
          r.mop24 ?? "", r.mop25 ?? "", pct(r.mopChange),
          pct(r.oatChange), pct(r.avgOatChange)
        ].join(",") + "\n";
      });
      csv += ["Total", totalActual.gas24, totalActual.gas25, pct(totalActual.gasChange), totalActual.mop24, totalActual.mop25, pct(totalActual.mopChange), pct(totalOatChange), pct(totalAvgOatChange)].join(",") + "\n";
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Gas_Actual_${site}_${yAxisUnitLabel}_${baselineYear}_vs_${reportingYear}_${reportingMonth}.csv`;
      link.click();
    }
  };

  const handleDownloadBreakdownCSV = () => {
    if (isAll) return;
    const siteName = site;
    const gasLabel = getGasTypeLabel();
    const unit = selectedUnit;
    let csv = "";
    csv += `Site,${escapeCSV(siteName)}\n`;
    csv += `Fuel,${escapeCSV(gasLabel)}\n`;
    csv += `Month,${escapeCSV(reportingMonth)}\n`;
    csv += `Year,${escapeCSV(reportingYear)}\n\n`;
    csv += `Category,Value (${unit}),Percent\n`;
    breakdownRows.forEach(r => { csv += [escapeCSV(r.category), r.value ?? "", pctNum(r.pct)].join(",") + "\n"; });
    csv += ["Total", breakdownTotal ?? "", ""].join(",") + "\n";

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Gas_Breakdown_${siteName}_${gasLabel}_${unit}_${reportingMonth}_${reportingYear}.csv`;
    link.click();
  };

  return (
    <Container fluid style={{ marginTop:"120px", marginLeft:"80px" }}>
      {currentView === "multiYear" ? (
        <>
          <h1 className="section-title">
            <span className="title-main">Gas</span>
            <span className="title-sub clickable" onClick={() => setCurrentView("yearOnYear")}>
              <i className="fas fa-arrow-right" style={{ color: "orange", marginRight: "1px" }}><ArrowForwardIcon/></i>
              <h6 style={{ marginTop: "20px" }}>Year-on-Year</h6>
            </span>
          </h1>
          <GasMultipleYearComparison />
        </>
      ) : (
        <>
          {/* header bar */}
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
  {!isAll ? (
    // Controls for single sites (Cotai/Macho)
    <div className="d-flex flex-column gap-2">
      <div className="d-flex align-items-center">
        <strong style={{ minWidth: 200, fontWeight: 500, textAlign: "right" }}>Normalized Consumption</strong>
        <Button size="sm" style={showNormalized ? enableBtnStyle : disableBtnStyle} onClick={() => setShowNormalized(true)} className="ms-2">Enable</Button>
        <Button size="sm" style={showNormalized ? disableBtnStyle : enableBtnStyle} onClick={() => setShowNormalized(false)}>Disable</Button>
      </div>

      <div className="d-flex align-items-center">
        <strong style={{ minWidth: 200, fontWeight: 500, textAlign: "right" }}>Min OAT</strong>
        <Button size="sm" style={showMinOat ? enableBtnStyle : disableBtnStyle} onClick={() => { setShowMinOat(true); setShowOat(false); }} className="ms-2">Enable</Button>
        <Button size="sm" style={showMinOat ? disableBtnStyle : enableBtnStyle} onClick={() => setShowMinOat(false)}>Disable</Button>
      </div>

      <div className="d-flex align-items-center">
        <strong style={{ minWidth: 200, fontWeight: 500, textAlign: "right" }}>Avg. OAT</strong>
        <Button size="sm" style={showOat ? enableBtnStyle : disableBtnStyle} onClick={() => { setShowOat(true); setShowMinOat(false); }} className="ms-2">Enable</Button>
        <Button size="sm" style={showOat ? disableBtnStyle : enableBtnStyle} onClick={() => setShowOat(false)}>Disable</Button>
      </div>

      {site === "Macho" && (
        <div className="d-flex align-items-center">
          <strong style={{ minWidth: 200, fontWeight: 500, textAlign: "right" }}>Unit</strong>
          {GAS_UNITS.map(u => (
            <Button key={u} size="sm" style={selectedUnit === u ? enableBtnStyle : disableBtnStyle} onClick={() => setSelectedUnit(u)} className="ms-2">
              {u}
            </Button>
          ))}
        </div>
      )}
    </div>
  ) : (
    // For "All" sites - hide controls, Min OAT will be shown by default
    <div></div>
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

          {/* title + chart */}
          <h1 className="section-title">
            <span className="title-main">Gas</span>
            <span className="title-sub clickable" onClick={() => setCurrentView("multiYear")}>
              <i className="fas fa-arrow-right" style={{ color: "orange", marginRight: "1px" }}><ArrowForwardIcon/></i>
              <h6 style={{ marginTop: "20px" }}>Multiple Year Comparison</h6>
            </span>
          </h1>

          {/* Charts Section */}
          <Row className="gx-3 gy-3 mb-4">
            <Col xl={isAll ? 12 : 8} lg={isAll ? 12 : 8} className="chart-section">
              <div style={{ position: "relative" }}>
                <IconButton
                  onClick={handleDownloadCSV}
                  title={!isAll && showNormalized ? "Download Normalized CSV" : "Download Actual CSV"}
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

            {/* Donut hidden for All */}
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

          {/* Tables */}
          <Row className="g-2">
            {/* Actual Consumption Table */}
            <Col xl={5} lg={isAll ? 12 : 5} md={12} className="table-card">
              <h5 className="text-danger fw-bold">Actual Consumption</h5>
              <div style={{ fontSize: "0.75rem" }}>
                <Table bordered className="text-center w-100 table-sm shadow-sm"
                  style={{ border:'2px solid #8B4513', borderCollapse:'collapse', tableLayout:'fixed', width:'100%', minHeight: "450px" }}>
                  <thead style={{ backgroundColor:'#D4B56A' }}>
                    <tr ref={yoyHead1Ref}>
                      <th rowSpan="2" style={{...thHeaderStyle, width: '10%', fontSize: '0.7rem', padding: '4px 2px'}}>Month</th>
                      <th colSpan="3" style={{...thHeaderStyle, textAlign: 'center', fontSize: '0.7rem', padding: '4px 2px'}}>{getGasTypeLabel()} Consumption ({yAxisUnitLabel})</th>
                      <th colSpan="3" style={{...thHeaderStyle, textAlign: 'center', fontSize: '0.7rem', padding: '4px 2px'}}>{getGasTypeLabel()} Cost (MOP)</th>
                      <th rowSpan="2" style={{...thHeaderStyle, width: '10%', fontSize: '0.7rem', padding: '4px 2px'}}>% Change Min OAT</th>
                      <th rowSpan="2" style={{...thHeaderStyle, width: '10%', fontSize: '0.7rem', padding: '4px 2px'}}>% Change Avg OAT</th>
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
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.gas24?.toLocaleString()}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.gas25?.toLocaleString()}</td>
                        <td className={`number-cell ${getColor(row.gasChange)}`} style={{ fontSize: '0.7rem', padding: '2px' }}>{row.gasChange}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.mop24?.toLocaleString()}</td>
                        <td className="number-cell" style={{ fontSize: '0.7rem', padding: '2px' }}>{row.mop25?.toLocaleString()}</td>
                        <td className={`number-cell ${getColor(row.mopChange)}`} style={{ fontSize: '0.7rem', padding: '2px' }}>{row.mopChange}</td>
                        <td className={`number-cell ${getColor(row.oatChange)}`} style={{ fontSize: '0.7rem', padding: '2px' }}>{row.oatChange}</td>
                        <td className={`number-cell ${getColor(row.avgOatChange)}`} style={{ fontSize: '0.7rem', padding: '2px' }}>{row.avgOatChange}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Total</td>
                      <td className="number-cell" title={totalActual.gas24.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalActual.gas24)}</td>
                      <td className="number-cell" title={totalActual.gas25.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalActual.gas25)}</td>
                      <td className={`number-cell ${getColor(totalActual.gasChange)}`} style={{ fontSize: '0.7rem' }}>{totalActual.gasChange}</td>
                      <td className="number-cell" title={totalActual.mop24.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalActual.mop24)}</td>
                      <td className="number-cell" title={totalActual.mop25.toLocaleString()} style={{ fontSize: '0.7rem' }}>{fmt8(totalActual.mop25)}</td>
                      <td className={`number-cell ${getColor(totalActual.mopChange)}`} style={{ fontSize: '0.7rem' }}>{totalActual.mopChange}</td>
                      <td className={`number-cell ${getColor(totalOatChange)}`} style={{ fontSize: '0.7rem' }}>{totalOatChange}</td>
                      <td className={`number-cell ${getColor(totalAvgOatChange)}`} style={{ fontSize: '0.7rem' }}>{totalAvgOatChange}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </Col>

            {/* Normalized Consumption Table (hidden for All) */}
            {!isAll && (
              <Col xl={3} lg={3} md={12} className="table-card">
                <h5 className="text-danger fw-bold">Normalized Consumption</h5>
                <div style={{ fontSize: "0.75rem" }}>
                  <Table bordered className="text-center w-100 table-sm shadow-sm"
                    style={{ border:'2px solid #8B4513', borderCollapse:'collapse', tableLayout:'fixed', width:'100%', minHeight: "450px" }}>
                    <thead style={{ background:'#F5DEB3' }}>
                      <tr ref={normHead1Ref}>
                        <th style={{...thHeaderStyle, width: '25%', fontSize: '0.7rem', padding: '4px 2px'}}>Month</th>
                        <th style={{...thHeaderStyle, width: '30%', fontSize: '0.7rem', padding: '4px 2px'}}>{reportingYear} Normalized ({yAxisUnitLabel})</th>
                        <th style={{...thHeaderStyle, width: '30%', fontSize: '0.7rem', padding: '4px 2px'}}>{reportingYear} Actual ({yAxisUnitLabel})</th>
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

            {/* Breakdown Table (hidden for All) */}
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
                    <div><strong>{breakdownTotal ? breakdownTotal.toLocaleString() : "-"} {selectedUnit}</strong></div>
                  </div>
                </div>

                <div style={{ fontSize: "0.75rem" }}>
                  <Table bordered className="text-center table-sm shadow-sm"
                    style={{ width: "100%", border: "2px solid #8B4513", borderTop: "none", borderCollapse: "collapse", minHeight: "400px" }}>
                    <thead style={{ background:'#F5DEB3' }}>
                      <tr ref={breakdownHead1Ref}>
                        <th style={{...thHeaderStyle, fontSize: '0.7rem', padding: '4px 2px'}}>Category</th>
                        <th style={{...thHeaderStyle, fontSize: '0.7rem', padding: '4px 2px'}}>{reportingMonth} {reportingYear} ({selectedUnit})</th>
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

export default Gas;
