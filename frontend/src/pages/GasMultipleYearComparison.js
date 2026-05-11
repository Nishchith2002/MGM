





import React, { useState, useEffect, useMemo } from "react";
import { Button, Row, Col, Form, Table } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import Papa from "papaparse";
import checkIcon from '../../src/assets/icons/energyDG.png';
import warningIcon from '../../src/assets/icons/gasHovered.png';
import infoIcon from '../../src/assets/icons/waterHovered.png';
import alertIcon from '../../src/assets/icons/electricityHovered.png';
import { useNavigate } from "react-router-dom";
import DownloadIcon from "@mui/icons-material/Download";
import { IconButton } from "@mui/material";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

/* ───────────────────────────────────────────────────────────── */
/* Helpers & constants                                           */
/* ───────────────────────────────────────────────────────────── */

const MONTHS_ORDER = [
  "January","February","March","April",
  "May","June","July","August",
  "September","October","November","December"
];

const GAS_UNITS = ["GJ", "kg", "m3"];

// normalize weird month inputs if any appear later
const normalizeMonth = (m) => {
  const s = String(m ?? "").trim().toLowerCase();
  const map = {
    "1":"January","01":"January","jan":"January","january":"January",
    "2":"February","02":"February","feb":"February","february":"February",
    "3":"March","03":"March","mar":"March","march":"March",
    "4":"April","04":"April","apr":"April","april":"April",
    "5":"May","05":"May","may":"May",
    "6":"June","06":"June","jun":"June","june":"June",
    "7":"July","07":"July","jul":"July","july":"July",
    "8":"August","08":"August","aug":"August","august":"August",
    "9":"September","09":"September","sep":"September","september":"September",
    "10":"October","oct":"October","october":"October",
    "11":"November","nov":"November","november":"November",
    "12":"December","dec":"December","december":"December"
  };
  return map[s] || (MONTHS_ORDER.includes(s.charAt(0).toUpperCase()+s.slice(1)) ? (s.charAt(0).toUpperCase()+s.slice(1)) : m);
};

// number parser that strips commas
const parseNum = (val) => Number(String(val ?? "").replace(/,/g, "")) || 0;

// robust pick: return first present, numeric value among aliases
const pick = (row, aliases) => {
  if (!row) return 0;
  for (const key of aliases) {
    if (row[key] != null && String(row[key]).trim() !== "") {
      return parseNum(row[key]);
    }
  }
  return 0;
};

// escape for CSV
const escapeCSV = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

// normalize site strings coming from localStorage
const normalizeSite = (raw) => {
  const s = String(raw || "").trim().toLowerCase();
  if (["cotai","coati","cotia"].includes(s)) return "Cotai";
  if (["macho","macau"].includes(s)) return "Macho";
  if (s === "all" || s === "all sites") return "All";
  return "Cotai";
};

// central filenames so typos don’t break things
const FILES_BY_SITE = {
  Cotai: {
    consumption: "Cotai_Cleaned_Consumption.csv",
    cost:        "Cotai_Cost_Corrected_Full.csv",
  },
  Macho: {
    consumption: "Macho_Cleaned_Consumption.csv",
    cost:        "Macho_Cost_Corrected_Full.csv",
  },
};

// API CSV fetcher like your Utility page
const parseCSVByFileName = (fileName) =>
  new Promise((resolve) => {
    Papa.parse(`${process.env.REACT_APP_BE_URL}/api/file/${fileName}?t=${Date.now()}`, {
      download: true,
      header: true,
      transformHeader: (h) => String(h || "").trim(),
      complete: ({ data }) => {
        const cleaned = (data || [])
          .map(r => ({
            ...r,
            Year: r.Year ? String(r.Year).trim() : "",
            Month: r.Month ? normalizeMonth(r.Month) : "",
          }))
          .filter(r => r.Year && r.Month);
        resolve(cleaned);
      },
    });
  });

/* Column alias maps:
   - Cotai has natural gas in GJ fields
   - Macho has LPG with multiple units (GJ / kg / m3)
   - include variants to be safe
*/
const GAS_DYNAMIC_COLUMNS = {
  Cotai: {
    actual: {
      GJ: [
        "Actual Natural Gas Consumption_GJ",
        "Actual Natural Gas Consumption",
        "Actual Gas Consumption_GJ",
        "Natural Gas Consumption_GJ",
      ],
    },
    normalized: {
      GJ: [
        "Normalized Natural Gas Consumption_GJ",
        "Normalized Natural Gas Consumption",
        "Normalized Gas Consumption_GJ",
      ],
    },
  },
  Macho: {
    actual: {
      GJ: [
        "Actual  Gas Consumption_GJ",   // note the double space in some files
        "Actual Gas Consumption_GJ",
        "LPG Consumption_GJ",
      ],
      kg: [
        "Actual  Gas Consumption_kg",
        "Actual Gas Consumption_kg",
        "LPG Consumption_kg",
      ],
      m3: [
        "Actual Gas Consumption_m3",
        "Actual  Gas Consumption_m3",
        "LPG Consumption_m3",
      ],
    },
    normalized: {
      GJ: [
        "Normalized Gas Consumption_GJ",
        "Normalized LPG Consumption_GJ",
      ],
      kg: [
        "Normalized Gas Consumption_kg",
        "Normalized LPG Consumption_kg",
      ],
      m3: [
        "Normalized Gas Consumption_m3",
        "Normalized LPG Consumption_m3",
      ],
    },
  },
};

// cost column aliases
const GAS_COST_COLUMNS = {
  Cotai: ["NG Cost", "Natural Gas Cost", "Gas Cost"],
  Macho: ["Gas Cost", "LPG Cost"],
};

// OAT aliases
const MIN_OAT_ALIASES = ["Min OAT", "Min. OAT", "Minimum OAT"];
const AVG_OAT_ALIASES = ["Avg. OAT", "Average OAT", "Avg OAT"];

/* ───────────────────────────────────────────────────────────── */

const GasMultipleYearComparison = () => {
  const navigate = useNavigate();

  // Data states
  const [gasData, setGasData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [normalizedData, setNormalizedData] = useState([]);

  // UI states
  const [showGasCost, setShowGasCost] = useState(false);
  const [showMinOat, setShowMinOat] = useState(true);
  const [showAvgOat, setShowAvgOat] = useState(false);
  const [fromMonth, setFromMonth] = useState("July");
  const [fromYear, setFromYear] = useState("2024");
  const [toMonth, setToMonth] = useState("July");
  const [toYear, setToYear] = useState("2025");
  const [selectedUnit, setSelectedUnit] = useState("GJ");

  // Site with normalization so "coati" doesn’t break it
  const [site, setSite] = useState(
    normalizeSite(localStorage.getItem("selectedSite") || "Cotai")
  );
  const isAll = site === "All";

  const toggleLabelStyle = { width: '160px', fontWeight: 500 };
  const toggleBtnBase = { width:'70px', padding:'2px 6px', fontSize:'0.85rem', marginRight:'8px', borderRadius:'2px' };
  const enableBtnStyle = { ...toggleBtnBase, backgroundColor:'#B1A265', border:'1px solid #8B4513', color:'#000' };
  const disableBtnStyle = { ...toggleBtnBase, backgroundColor:'#6c757d', border:'1px solid #5a6268', color:'#fff' };
  const thHeaderStyle = { backgroundColor:"#F5DEB3", border:"1px solid #8B4513", color:"black" };

  // Keep site normalized on custom event
  useEffect(() => {
    const handleSiteChange = () => {
      const raw = localStorage.getItem("selectedSite") || "Cotai";
      setSite(normalizeSite(raw));
    };
    window.addEventListener("siteChange", handleSiteChange);
    return () => window.removeEventListener("siteChange", handleSiteChange);
  }, []);

  // Load CSV data via API; aggregate when All
  useEffect(() => {
    const siteNorm = normalizeSite(site);
    if (!siteNorm) return;

    const load = async () => {
      if (siteNorm !== "All") {
        const files = FILES_BY_SITE[siteNorm];
        if (!files) return;

        const [cons, cost, norm] = await Promise.all([
          parseCSVByFileName(files.consumption),
          parseCSVByFileName(files.cost),
          parseCSVByFileName(files.consumption),
        ]);

        setGasData(cons);
        setCostData(cost);
        setNormalizedData(norm);
        return;
      }

      // === All Sites: Aggregate Cotai + Macho ===
      const [
        cotaiCons, machoCons,
        cotaiCost, machoCost
      ] = await Promise.all([
        parseCSVByFileName(FILES_BY_SITE.Cotai.consumption),
        parseCSVByFileName(FILES_BY_SITE.Macho.consumption),
        parseCSVByFileName(FILES_BY_SITE.Cotai.cost),
        parseCSVByFileName(FILES_BY_SITE.Macho.cost),
      ]);

      // Merge consumption to GJ
      const mergedConsumption = [...cotaiCons, ...machoCons].reduce((acc, row) => {
        const key = `${normalizeMonth(row.Month)}-${row.Year}`;
        if (!acc[key]) {
          acc[key] = {
            Month: normalizeMonth(row.Month),
            Year: String(row.Year),
            // always store in GJ for All
            "Gas_GJ": 0,
            "__oat_sum": 0,
            "__oat_count": 0,
          };
        }

        // Cotai NG in GJ
        acc[key]["Gas_GJ"] += pick(row, GAS_DYNAMIC_COLUMNS.Cotai.actual.GJ);

        // Macho LPG in GJ (ignore kg/m3 in All to keep one unit)
        acc[key]["Gas_GJ"] += pick(row, GAS_DYNAMIC_COLUMNS.Macho.actual.GJ);

        // OAT average
        const oat = pick(row, AVG_OAT_ALIASES);
        if (oat > 0) {
          acc[key]["__oat_sum"] += oat;
          acc[key]["__oat_count"] += 1;
        }
        return acc;
      }, {});

      // finalize average OAT
      Object.values(mergedConsumption).forEach(r => {
        r["Avg. OAT"] = r["__oat_count"] ? (r["__oat_sum"] / r["__oat_count"]) : 0;
        delete r["__oat_sum"];
        delete r["__oat_count"];
      });

      // Cost merge: sum costs; take Min OAT from Cotai where present
      const mergedCost = cotaiCost.reduce((acc, row) => {
        const key = `${normalizeMonth(row.Month)}-${row.Year}`;
        acc[key] = {
          Month: normalizeMonth(row.Month),
          Year: String(row.Year),
          "NG Cost": pick(row, GAS_COST_COLUMNS.Cotai),
          "Min OAT": pick(row, MIN_OAT_ALIASES) // from Cotai only
        };
        return acc;
      }, {});

      machoCost.forEach(row => {
        const key = `${normalizeMonth(row.Month)}-${row.Year}`;
        if (!mergedCost[key]) {
          mergedCost[key] = {
            Month: normalizeMonth(row.Month),
            Year: String(row.Year),
            "NG Cost": 0,
            "Min OAT": 0,
          };
        }
        mergedCost[key]["NG Cost"] += pick(row, GAS_COST_COLUMNS.Macho);
      });

      setGasData(Object.values(mergedConsumption));
      setCostData(Object.values(mergedCost));
      setNormalizedData(Object.values(mergedConsumption)); // reuse for now
    };

    load().catch(err => console.error("CSV load error (Gas):", err));
  }, [site]);

  const allYears = [...new Set(gasData.map(d => d.Year))].sort();

  // Build date range
  const dateRange = useMemo(() => {
    const fromMonthIdx = MONTHS_ORDER.indexOf(fromMonth);
    const toMonthIdx = MONTHS_ORDER.indexOf(toMonth);
    const fromYearNum = parseInt(fromYear);
    const toYearNum = parseInt(toYear);

    const months = [];
    let y = fromYearNum;
    let m = fromMonthIdx;

    while (y < toYearNum || (y === toYearNum && m <= toMonthIdx)) {
      months.push({
        month: MONTHS_ORDER[m],
        year: String(y),
        label: `${MONTHS_ORDER[m].slice(0,3)}-${String(y).slice(2)}`
      });
      m++;
      if (m > 11) { m = 0; y++; }
    }
    return months;
  }, [fromMonth, fromYear, toMonth, toYear]);

  // gas type label for UI/CSV
  const getGasTypeLabel = () => {
    if (isAll) return "Gas (NG + LPG)";
    return site === "Macho" ? "LPG" : "Natural Gas";
  };

  // Chart data
  const chartData = useMemo(() => {
    if (!dateRange.length) return { labels: [], datasets: [] };

    const labels = dateRange.map(d => d.label);
    const datasets = [];

    // choose consumption columns
    let consAliases = [];
    if (isAll) {
      // aggregated to GJ
      consAliases = ["Gas_GJ"];
    } else {
      const s = site;
      if (s === "Macho") {
        consAliases = GAS_DYNAMIC_COLUMNS.Macho.actual[
          (selectedUnit || "GJ")
        ] || [];
      } else {
        // Cotai
        consAliases = GAS_DYNAMIC_COLUMNS.Cotai.actual.GJ;
      }
    }

    // choose cost columns
    const costAliases = isAll ? ["NG Cost"] : (GAS_COST_COLUMNS[site] || GAS_COST_COLUMNS.Cotai);

    // Main line: consumption or cost
    const mainData = dateRange.map(({ month, year }) => {
      if (showGasCost) {
        const row = costData.find(d => normalizeMonth(d.Month) === month && d.Year === year);
        return pick(row, costAliases);
      } else {
        const row = gasData.find(d => normalizeMonth(d.Month) === month && d.Year === year);
        return pick(row, consAliases);
      }
    });

    datasets.push({
      label: showGasCost
        ? `${getGasTypeLabel()} Cost (MOP)`
        : `Actual ${getGasTypeLabel()} Consumption (${isAll ? 'GJ' : selectedUnit})`,
      data: mainData,
      borderColor: "#FF6B35",
      backgroundColor: "#FF6B35",
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      yAxisID: "y",
    });

    // Min OAT
    if (showMinOat) {
      const minOatSeries = dateRange.map(({ month, year }) => {
        const row = costData.find(d => normalizeMonth(d.Month) === month && d.Year === year);
        return pick(row, MIN_OAT_ALIASES);
      });
      datasets.push({
        label: "Min OAT",
        data: minOatSeries,
        borderColor: "#FFD700",
        backgroundColor: "#FFD700",
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y1",
      });
    }

    // Avg OAT
    if (showAvgOat) {
      const avgOatSeries = dateRange.map(({ month, year }) => {
        const row = gasData.find(d => normalizeMonth(d.Month) === month && d.Year === year);
        return pick(row, AVG_OAT_ALIASES);
      });
      datasets.push({
        label: "Avg. OAT",
        data: avgOatSeries,
        borderColor: "#3FA7F5",
        backgroundColor: "#3FA7F5",
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y1",
      });
    }

    return { labels, datasets };
  }, [dateRange, gasData, costData, showGasCost, showMinOat, showAvgOat, site, selectedUnit, isAll]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 8, right: 28, bottom: 0, left: 0 } },
    clip: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      datalabels: { display: false },
      legend: { position: "bottom", align: "center", labels: { boxWidth: 16, padding: 12, usePointStyle: true } },
      title: { display: false },
    },
    scales: {
      x: {
        display: true,
        title: { display: true, text: "Month-Year" },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: showGasCost ? "Cost (MOP)" : `Consumption (${isAll ? 'GJ' : selectedUnit})`,
        },
        beginAtZero: true,
      },
      y1: {
        type: "linear",
        display: showMinOat || showAvgOat,
        position: "right",
        grid: { drawOnChartArea: false },
        title: {
          display: true,
          text: showMinOat ? "Min OAT" : (showAvgOat ? "Avg OAT" : ""),
        },
        beginAtZero: true,
      },
    },
  };

  // Breakdown table (same source as chart series)
  const summaryData = useMemo(() => {
    let consAliases = [];
    if (isAll) {
      consAliases = ["Gas_GJ"];
    } else if (site === "Macho") {
      consAliases = GAS_DYNAMIC_COLUMNS.Macho.actual[selectedUnit] || [];
    } else {
      consAliases = GAS_DYNAMIC_COLUMNS.Cotai.actual.GJ;
    }
    const costAliases = isAll ? ["NG Cost"] : (GAS_COST_COLUMNS[site] || GAS_COST_COLUMNS.Cotai);

    return dateRange.map(({ month, year, label }) => {
      const consRow = gasData.find(d => normalizeMonth(d.Month) === month && d.Year === year);
      const costRow = costData.find(d => normalizeMonth(d.Month) === month && d.Year === year);

      const consumption = pick(consRow, consAliases);
      const gasCost = pick(costRow, costAliases);
      const minOat = pick(costRow, MIN_OAT_ALIASES);
      const avgOat = pick(consRow, AVG_OAT_ALIASES);

      return {
        period: label,
        month, year,
        consumption,
        gasCost,
        minOat, avgOat,
        displayValue: showGasCost ? gasCost : consumption,
      };
    });
  }, [dateRange, gasData, costData, showGasCost, site, selectedUnit, isAll]);

  const totalConsumption = summaryData.reduce((s, r) => s + (r.displayValue || 0), 0);
  const totalMinOat = showMinOat && summaryData.length ? (summaryData.reduce((s, r) => s + (r.minOat || 0), 0) / summaryData.length).toFixed(1) : null;
  const totalAvgOat = showAvgOat && summaryData.length ? (summaryData.reduce((s, r) => s + (r.avgOat || 0), 0) / summaryData.length).toFixed(1) : null;

  // CSV downloads
  const handleDownloadTrendCSV = () => {
    const siteName = isAll ? "All Sites (Cotai + Macho)" : site;
    const fuel = getGasTypeLabel();
    const unit = isAll ? 'GJ' : selectedUnit;
    const valueHeader = showGasCost
      ? `${fuel} Cost (MOP)`
      : `Actual ${fuel} Consumption (${unit})`;

    let csv = "";
    csv += `Site,${escapeCSV(siteName)}\n`;
    csv += `Fuel,${escapeCSV(fuel)}\n`;
    csv += `Unit,${escapeCSV(unit)}\n`;
    csv += `Range,${fromMonth.slice(0,3)}-${fromYear.slice(2)} to ${toMonth.slice(0,3)}-${toYear.slice(2)}\n\n`;

    csv += `Period,${valueHeader}`;
    if (showMinOat) csv += ",Min OAT";
    if (showAvgOat) csv += ",Avg OAT";
    csv += "\n";

    summaryData.forEach(r => {
      const cols = [r.period, r.displayValue];
      if (showMinOat) cols.push(r.minOat?.toFixed(1));
      if (showAvgOat) cols.push(r.avgOat?.toFixed(1));
      csv += cols.join(",") + "\n";
    });

    const totalLine = ["Total", totalConsumption];
    if (showMinOat) totalLine.push(totalMinOat);
    if (showAvgOat) totalLine.push(totalAvgOat);
    csv += totalLine.join(",") + "\n";

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const fuelSafe = fuel.replace(/\s+/g, "");
    a.download = `Gas_${fuelSafe}_Trend_${unit}_${fromMonth.slice(0,3)}-${fromYear.slice(2)}_to_${toMonth.slice(0,3)}-${toYear.slice(2)}.csv`;
    a.click();
  };

  const handleDownloadBreakdownCSV = () => {
    const siteName = isAll ? "All Sites (Cotai + Macho)" : site;
    const fuel = getGasTypeLabel();
    const unit = isAll ? 'GJ' : selectedUnit;
    const valueHeader = showGasCost ? "Cost (MOP)" : unit;

    let csv = "";
    csv += `Site,${escapeCSV(siteName)}\n`;
    csv += `Fuel,${escapeCSV(fuel)}\n`;
    csv += `Unit,${escapeCSV(unit)}\n`;
    csv += `Range,${fromMonth.slice(0,3)}-${fromYear.slice(2)} to ${toMonth.slice(0,3)}-${toYear.slice(2)}\n\n`;

    csv += `Period,${valueHeader}`;
    if (showMinOat) csv += ",Min OAT";
    if (showAvgOat) csv += ",Avg OAT";
    csv += "\n";

    summaryData.forEach(r => {
      const cols = [r.period, r.displayValue];
      if (showMinOat) cols.push(r.minOat?.toFixed(1));
      if (showAvgOat) cols.push(r.avgOat?.toFixed(1));
      csv += cols.join(",") + "\n";
    });

    const totalLine = ["Total", totalConsumption];
    if (showMinOat) totalLine.push(totalMinOat);
    if (showAvgOat) totalLine.push(totalAvgOat);
    csv += totalLine.join(",") + "\n";

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const fuelSafe = fuel.replace(/\s+/g, "");
    a.download = `Gas_${fuelSafe}_Breakdown_${unit}_${fromMonth.slice(0,3)}-${fromYear.slice(2)}_to_${toMonth.slice(0,3)}-${toYear.slice(2)}.csv`;
    a.click();
  };

  return (
    <div>
      {/* Icons row */}
      <Row className="mb-2">
        <Col xs="auto">
          <div className="d-flex align-items-center gap-2" style={{ position: "relative", zIndex: 2000 }}>
            <img src={checkIcon} alt="Electricity" style={{ width: 36, height: 36, cursor: "pointer" }} onClick={() => navigate("/utility")} />
            <img src={warningIcon} alt="Gas"         style={{ width: 36, height: 36, cursor: "pointer" }} onClick={() => navigate("/gas")} />
            <img src={infoIcon}    alt="Water"       style={{ width: 36, height: 36, cursor: "pointer" }} onClick={() => navigate("/water")} />
            <img src={alertIcon}   alt="Energy"      style={{ width: 36, height: 36, cursor: "pointer" }} onClick={() => navigate("/energy")} />
          </div>
        </Col>
      </Row>

      {/* Controls Header */}
      <Row className="utility-header align-items-start mb-4">
        {!isAll && (
          <Col lg={6} className="utility-toggles">
            <div className="d-flex flex-column gap-2">
              {/* Gas Cost Toggle */}
              <div className="d-flex align-items-center">
                <strong style={toggleLabelStyle} className="me-3">{getGasTypeLabel()} Cost</strong>
                <Button size="sm" style={showGasCost ? enableBtnStyle : disableBtnStyle} onClick={() => setShowGasCost(true)} className="me-1">Enable</Button>
                <Button size="sm" style={showGasCost ? disableBtnStyle : enableBtnStyle} onClick={() => setShowGasCost(false)}>Disable</Button>
              </div>

              {/* Min OAT Toggle */}
              <div className="d-flex align-items-center">
                <strong style={toggleLabelStyle} className="me-3">Min. OAT</strong>
                <Button size="sm" style={showMinOat ? enableBtnStyle : disableBtnStyle} onClick={() => { setShowMinOat(true); setShowAvgOat(false); }} className="me-1">Enable</Button>
                <Button size="sm" style={showMinOat ? disableBtnStyle : enableBtnStyle} onClick={() => setShowMinOat(false)}>Disable</Button>
              </div>

              {/* Avg. OAT Toggle */}
              <div className="d-flex align-items-center">
                <strong style={toggleLabelStyle} className="me-3">Avg. OAT</strong>
                <Button size="sm" style={showAvgOat ? enableBtnStyle : disableBtnStyle} onClick={() => { setShowAvgOat(true); setShowMinOat(false); }} className="me-1">Enable</Button>
                <Button size="sm" style={showAvgOat ? disableBtnStyle : enableBtnStyle} onClick={() => setShowAvgOat(false)}>Disable</Button>
              </div>

              {/* Unit Toggle – only for Macho */}
              {site === "Macho" && (
                <div className="d-flex align-items-center">
                  <strong style={toggleLabelStyle} className="me-3">Unit</strong>
                  {GAS_UNITS.map(u => (
                    <Button
                      key={u}
                      size="sm"
                      style={selectedUnit === u ? enableBtnStyle : disableBtnStyle}
                      onClick={() => setSelectedUnit(u)}
                      className="me-1"
                    >
                      {u}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Col>
        )}

        <Col lg={6} className="utility-filters">
          <div className="d-flex align-items-end gap-3">
            {/* From */}
            <div className="d-flex align-items-center">
              <Form.Label className="mb-0"><strong>From</strong></Form.Label>
              <Form.Select value={fromMonth} onChange={e => setFromMonth(e.target.value)} style={{ minWidth: '110px', borderRadius: '20px', padding: '8px 12px' }} className="ms-2">
                {MONTHS_ORDER.map((month) => (<option key={month} value={month}>{month}</option>))}
              </Form.Select>
            </div>
            <div>
              <Form.Select value={fromYear} onChange={e => setFromYear(e.target.value)} style={{ minWidth: '110px', borderRadius: '20px', padding: '8px 12px' }}>
                {allYears.map((year) => (<option key={year} value={year}>{year}</option>))}
              </Form.Select>
            </div>

            {/* To */}
            <div className="d-flex align-items-center">
              <Form.Label className="mb-0"><strong>To</strong></Form.Label>
              <Form.Select value={toMonth} onChange={e => setToMonth(e.target.value)} style={{ minWidth: '110px', borderRadius: '20px', padding: '8px 12px' }} className="ms-2">
                {MONTHS_ORDER.map((month) => (<option key={month} value={month}>{month}</option>))}
              </Form.Select>
            </div>
            <div>
              <Form.Select value={toYear} onChange={e => setToYear(e.target.value)} style={{ minWidth: '110px', borderRadius: '20px', padding: '8px 12px' }}>
                {allYears.map((year) => (<option key={year} value={year}>{year}</option>))}
              </Form.Select>
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Content */}
      <Row className="g-0" style={{ height: '500px' }}>
        {/* Left: Chart */}
        <Col xs={8} style={{ height: '100%', overflow: 'visible', paddingRight: 0, position: 'relative' }}>
          <div style={{ width: '100%', height: '100%' }}>
            <IconButton
              onClick={handleDownloadTrendCSV}
              title="Download trend CSV"
              size="small"
              style={{ position: "absolute", top: -22, right: 85, padding: 4, zIndex: 9999 }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
            <Line data={chartData} options={chartOptions} />
          </div>
        </Col>

        {/* Right: Breakdown table */}
        <Col xs={3} style={{ height: '120%', paddingLeft: 0 }}>
          <div className="p-2 bg-light border" style={{ borderBottom: 'none' }}>
            <h5 className="text-danger fw-bold mb-1 d-flex align-items-center">
              Breakdown
              <IconButton onClick={handleDownloadBreakdownCSV} title="Download breakdown CSV" size="small" style={{ marginLeft: 8, backgroundColor: "white", padding: 4 }}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </h5>
            <div className="text-center">
              <strong>{fromMonth.slice(0,3)}-{fromYear.slice(2)} — {toMonth.slice(0,3)}-{toYear.slice(2)}</strong>
            </div>
            <div className="text-center">
              <strong>
                {totalConsumption.toLocaleString()} {showGasCost ? 'MOP' : (isAll ? 'GJ' : selectedUnit)}
              </strong>
            </div>
          </div>

          <div style={{ overflow: 'visible', maxHeight: 'none' }}>
            <Table
              bordered
              className="text-center table-sm shadow-sm mb-0"
              style={{ border: "2px solid #8B4513", borderCollapse: "collapse", width: "100%", fontSize: "0.8rem" }}
            >
              <thead style={{ background:'#F5DEB3' }}>
                <tr>
                  <th style={{...thHeaderStyle, fontSize: "0.75rem", padding: "4px"}}>Period</th>
                  <th style={{...thHeaderStyle, fontSize: "0.75rem", padding: "4px"}}>
                    {showGasCost ? "Cost (MOP)" : (isAll ? 'GJ' : selectedUnit)}
                  </th>
                  {showMinOat && (<th style={{...thHeaderStyle, fontSize: "0.75rem", padding: "4px"}}>Min OAT</th>)}
                  {showAvgOat && (<th style={{...thHeaderStyle, fontSize: "0.75rem", padding: "4px"}}>Avg OAT</th>)}
                </tr>
              </thead>
              <tbody>
                {summaryData.map((row, i) => (
                  <tr key={i}>
                    <td>{row.period}</td>
                    <td>{row.displayValue != null ? row.displayValue.toLocaleString() : "-"}</td>
                    {showMinOat && (<td>{row.minOat != null ? row.minOat.toFixed(1) : "-"}</td>)}
                    {showAvgOat && (<td>{row.avgOat != null ? row.avgOat.toFixed(1) : "-"}</td>)}
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td>Total</td>
                  <td>{totalConsumption != null ? totalConsumption.toLocaleString() : "-"}</td>
                  {showMinOat && <td>{totalMinOat ?? "-"}</td>}
                  {showAvgOat && <td>{totalAvgOat ?? "-"}</td>}
                </tr>
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default GasMultipleYearComparison;
