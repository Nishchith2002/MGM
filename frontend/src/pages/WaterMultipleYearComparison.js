




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

/* ───────────────────────── helpers & constants ───────────────────────── */

const MONTHS_ORDER = [
  "January","February","March","April",
  "May","June","July","August",
  "September","October","November","December"
];

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
  if (map[s]) return map[s];
  const cap = s.charAt(0).toUpperCase() + s.slice(1);
  return MONTHS_ORDER.includes(cap) ? cap : String(m ?? "");
};

const parseNum = (v) => Number(String(v ?? "").replace(/,/g, "")) || 0;

const pick = (row, aliases) => {
  if (!row) return 0;
  for (const key of aliases) {
    if (row[key] != null && String(row[key]).trim() !== "") {
      return parseNum(row[key]);
    }
  }
  return 0;
};

const escapeCSV = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

const normalizeSite = (raw) => {
  const s = String(raw || "").trim().toLowerCase();
  if (["cotai","coati","cotia"].includes(s)) return "Cotai";
  if (["macho","macau"].includes(s)) return "Macho";
  if (s === "all" || s === "all sites") return "All";
  return "Cotai";
};

// central file map
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

// API CSV fetcher (same style as your Utility loader)
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

/* column alias sets (robust across minor header name changes) */
const WATER_COLUMNS = {
  Cotai: {
    actual:     ["Actual Water Consumption", "Actual Water Consumption_m3", "Water Consumption", "Water (m3)"],
    normalized: ["Normalized Water Consumption", "Normalized Water Consumption_m3", "Normalized Water (m3)"],
  },
  Macho: {
    actual:     ["Actual Water Consumption", "Actual Water Consumption_m3", "Water Consumption", "Water (m3)"],
    normalized: ["Normalized Water Consumption", "Normalized Water Consumption_m3", "Normalized Water (m3)"],
  }
};

const WATER_COST_COLUMNS = {
  Cotai: ["Water Cost", "WaterCost", "Water (MOP)"],
  Macho: ["Water Cost", "WaterCost", "Water (MOP)"],
};

const CDD_ALIASES = ["CDD", "Cooling Degree Days"];
const FOOD_COVER_ALIASES = ["Food Cover", "FoodCover"];

/* ───────────────────────── component ───────────────────────── */

const WaterMultipleYearComparison = () => {
  const navigate = useNavigate();

  // Data states
  const [waterData, setWaterData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [normalizedData, setNormalizedData] = useState([]);

  // UI states
  const [showWaterCost, setShowWaterCost] = useState(false);
  const [showCdd, setShowCdd] = useState(true);
  const [showFoodCover, setShowFoodCover] = useState(false);

  const [fromMonth, setFromMonth] = useState("July");
  const [fromYear, setFromYear] = useState("2024");
  const [toMonth, setToMonth] = useState("July");
  const [toYear, setToYear] = useState("2025");

  const [site, setSite] = useState(normalizeSite(localStorage.getItem("selectedSite") || "Cotai"));
  const isAll = site === "All";

  const toggleLabelStyle = { width: '160px', fontWeight: 500 };
  const toggleBtnBase = { width:'70px', padding:'2px 6px', fontSize:'0.85rem', marginRight:'8px', borderRadius:'2px' };
  const enableBtnStyle = { ...toggleBtnBase, backgroundColor:'#B1A265', border:'1px solid #8B4513', color:'#000' };
  const disableBtnStyle = { ...toggleBtnBase, backgroundColor:'#6c757d', border:'1px solid #5a6268', color:'#fff' };
  const thHeaderStyle = { backgroundColor:"#F5DEB3", border:"1px solid #8B4513", color:"black" };

  // Listen for external site changes
  useEffect(() => {
    const handleSiteChange = () => setSite(normalizeSite(localStorage.getItem("selectedSite") || "Cotai"));
    window.addEventListener("siteChange", handleSiteChange);
    return () => window.removeEventListener("siteChange", handleSiteChange);
  }, []);

  // When switching to All: default to FoodCover (on) and CDD (off)
  useEffect(() => {
    if (isAll) {
      setShowFoodCover(true);
      setShowCdd(false);
    } else {
      setShowCdd(true);
      setShowFoodCover(false);
    }
  }, [isAll]);

  // Load via API; aggregate when All
  useEffect(() => {
    const load = async () => {
      const s = normalizeSite(site);
      if (s !== "All") {
        const files = FILES_BY_SITE[s];
        if (!files) return;
        const [cons, cost, norm] = await Promise.all([
          parseCSVByFileName(files.consumption),
          parseCSVByFileName(files.cost),
          parseCSVByFileName(files.consumption),
        ]);
        setWaterData(cons);
        setCostData(cost);
        setNormalizedData(norm);
        return;
      }

      // All Sites: load both then merge
      const [cotaiCons, machoCons, cotaiCost, machoCost] = await Promise.all([
        parseCSVByFileName(FILES_BY_SITE.Cotai.consumption),
        parseCSVByFileName(FILES_BY_SITE.Macho.consumption),
        parseCSVByFileName(FILES_BY_SITE.Cotai.cost),
        parseCSVByFileName(FILES_BY_SITE.Macho.cost),
      ]);

      // Consumption merge (sum m3)
      const mergedConsumption = [...cotaiCons, ...machoCons].reduce((acc, row) => {
        const key = `${normalizeMonth(row.Month)}-${row.Year}`;
        if (!acc[key]) {
          acc[key] = {
            Month: normalizeMonth(row.Month),
            Year: String(row.Year),
            "Actual Water Consumption": 0,
          };
        }
        // sum using aliases from either site
        acc[key]["Actual Water Consumption"] += pick(row, WATER_COLUMNS.Cotai.actual) || pick(row, WATER_COLUMNS.Macho.actual);
        return acc;
      }, {});
      const waterMerged = Object.values(mergedConsumption);

      // Cost merge:
      //  - Water Cost: sum Cotai + Macho
      //  - CDD: take from Cotai only
      //  - Food Cover: sum Cotai + Macho
      const mergedCost = cotaiCost.reduce((acc, row) => {
        const key = `${normalizeMonth(row.Month)}-${row.Year}`;
        acc[key] = {
          Month: normalizeMonth(row.Month),
          Year: String(row.Year),
          "Water Cost": pick(row, WATER_COST_COLUMNS.Cotai),
          "CDD": pick(row, CDD_ALIASES),               // CDD from Cotai
          "Food Cover": pick(row, FOOD_COVER_ALIASES), // start Food Cover
        };
        return acc;
      }, {});
      machoCost.forEach(row => {
        const key = `${normalizeMonth(row.Month)}-${row.Year}`;
        if (!mergedCost[key]) {
          mergedCost[key] = {
            Month: normalizeMonth(row.Month),
            Year: String(row.Year),
            "Water Cost": 0,
            "CDD": 0,
            "Food Cover": 0,
          };
        }
        mergedCost[key]["Water Cost"] += pick(row, WATER_COST_COLUMNS.Macho);
        mergedCost[key]["Food Cover"] += pick(row, FOOD_COVER_ALIASES);
      });

      setWaterData(waterMerged);
      setCostData(Object.values(mergedCost));
      setNormalizedData(waterMerged); // reuse for now
    };

    load().catch(err => console.error("CSV load error (Water):", err));
  }, [site]);

  const allYears = [...new Set(waterData.map(d => d.Year))].sort();

  // Date range list
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

  /* ───────────────────────── chart ───────────────────────── */

  const chartData = useMemo(() => {
    if (!dateRange.length) return { labels: [], datasets: [] };

    const labels = dateRange.map(d => d.label);
    const datasets = [];

    const waterCols = (WATER_COLUMNS[site] || WATER_COLUMNS.Cotai).actual;
    const costCols = WATER_COST_COLUMNS[site] || WATER_COST_COLUMNS.Cotai;

    const mainData = dateRange.map(({ month, year }) => {
      if (showWaterCost) {
        const r = costData.find(d => normalizeMonth(d.Month) === month && d.Year === year);
        return pick(r, costCols);
      } else {
        const r = waterData.find(d => normalizeMonth(d.Month) === month && d.Year === year);
        return pick(r, waterCols);
      }
    });

    datasets.push({
      label: showWaterCost ? "Water Cost (MOP)" : "Actual Water Consumption (m³)",
      data: mainData,
      borderColor: "#FF6B35",
      backgroundColor: "#FF6B35",
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      yAxisID: "y",
    });

    if (showCdd) {
      const cddSeries = dateRange.map(({ month, year }) => {
        const r = costData.find(d => normalizeMonth(d.Month) === month && d.Year === year);
        return pick(r, CDD_ALIASES);
      });
      datasets.push({
        label: "CDD",
        data: cddSeries,
        borderColor: "#FFD700",
        backgroundColor: "#FFD700",
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y1",
      });
    }

    if (showFoodCover) {
      const fcSeries = dateRange.map(({ month, year }) => {
        const r = costData.find(d => normalizeMonth(d.Month) === month && d.Year === year);
        return pick(r, FOOD_COVER_ALIASES);
      });
      datasets.push({
        label: "Food Cover",
        data: fcSeries,
        borderColor: "#3FA7F5",
        backgroundColor: "#3FA7F5",
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y1",
      });
    }

    return { labels, datasets };
  }, [dateRange, waterData, costData, showWaterCost, showCdd, showFoodCover, site]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 0 },
    clip: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      datalabels: { display: false },
      legend: { position: "bottom", align: "center", labels: { boxWidth: 16, padding: 12, usePointStyle: true } },
      title: { display: false },
    },
    scales: {
      x: { display: true, title: { display: true, text: "Month-Year" } },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: { display: true, text: showWaterCost ? "Cost (MOP)" : "Consumption (m³)" },
        beginAtZero: true,
      },
      y1: {
        type: "linear",
        display: showCdd || showFoodCover,
        position: "right",
        grid: { drawOnChartArea: false },
        title: {
          display: true,
          text: showCdd ? "Cooling Degree Days" : (showFoodCover ? "Food Cover" : ""),
        },
        beginAtZero: true,
      },
    },
  };

  /* ───────────────────────── table & CSV ───────────────────────── */

  const summaryData = useMemo(() => {
    const waterCols = (WATER_COLUMNS[site] || WATER_COLUMNS.Cotai).actual;
    const costCols = WATER_COST_COLUMNS[site] || WATER_COST_COLUMNS.Cotai;

    return dateRange.map(({ month, year, label }) => {
      const consRow = waterData.find(d => normalizeMonth(d.Month) === month && d.Year === year);
      const costRow = costData.find(d => normalizeMonth(d.Month) === month && d.Year === year);

      const consumption = pick(consRow, waterCols);
      const waterCost = pick(costRow, costCols);
      const cdd = pick(costRow, CDD_ALIASES);
      const foodCover = pick(costRow, FOOD_COVER_ALIASES);

      return {
        period: label,
        month, year,
        consumption, waterCost, cdd, foodCover,
        displayValue: showWaterCost ? waterCost : consumption,
      };
    });
  }, [dateRange, waterData, costData, showWaterCost, site]);

  const totalConsumption = summaryData.reduce((s, r) => s + (r.displayValue || 0), 0);
  const totalCdd = summaryData.reduce((s, r) => s + (r.cdd || 0), 0);
  const totalFoodCover = summaryData.reduce((s, r) => s + (r.foodCover || 0), 0);

  const handleDownloadTrendCSV = () => {
    const siteName = isAll ? "All Sites (Cotai + Macho)" : site;
    const valueHeader = showWaterCost ? "Water Cost (MOP)" : "Actual Water Consumption (m³)";
    const auxHeader = showCdd ? "CDD" : (showFoodCover ? "Food Cover" : null);

    let csv = "";
    csv += `Site,${escapeCSV(siteName)}\n`;
    csv += `Range,${fromMonth.slice(0,3)}-${fromYear.slice(2)} to ${toMonth.slice(0,3)}-${toYear.slice(2)}\n\n`;

    csv += `Period,${valueHeader}`;
    if (auxHeader) csv += `,${auxHeader}`;
    csv += `\n`;

    summaryData.forEach(r => {
      const cols = [r.period, r.displayValue];
      if (showCdd) cols.push(r.cdd);
      if (showFoodCover) cols.push(r.foodCover);
      csv += cols.join(",") + "\n";
    });

    const totalLine = ["Total", totalConsumption];
    if (showCdd) totalLine.push(totalCdd);
    if (showFoodCover) totalLine.push(totalFoodCover);
    csv += totalLine.join(",") + "\n";

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `Water_Trend_${fromMonth.slice(0,3)}-${fromYear.slice(2)}_to_${toMonth.slice(0,3)}-${toYear.slice(2)}.csv`;
    a.click();
  };

  const handleDownloadBreakdownCSV = () => {
    const siteName = isAll ? "All Sites (Cotai + Macho)" : site;
    const valueHeader = showWaterCost ? "Cost (MOP)" : "m³";
    const auxHeader = showCdd ? "CDD" : (showFoodCover ? "Food Cover" : null);

    let csv = "";
    csv += `Site,${escapeCSV(siteName)}\n`;
    csv += `Range,${fromMonth.slice(0,3)}-${fromYear.slice(2)} to ${toMonth.slice(0,3)}-${toYear.slice(2)}\n\n`;

    csv += `Period,${valueHeader}`;
    if (auxHeader) csv += `,${auxHeader}`;
    csv += `\n`;

    summaryData.forEach(r => {
      const cols = [r.period, r.displayValue];
      if (showCdd) cols.push(r.cdd);
      if (showFoodCover) cols.push(r.foodCover);
      csv += cols.join(",") + "\n";
    });

    const totalLine = ["Total", totalConsumption];
    if (showCdd) totalLine.push(totalCdd);
    if (showFoodCover) totalLine.push(totalFoodCover);
    csv += totalLine.join(",") + "\n";

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `Water_Breakdown_${fromMonth.slice(0,3)}-${fromYear.slice(2)}_to_${toMonth.slice(0,3)}-${toYear.slice(2)}.csv`;
    a.click();
  };

  /* ───────────────────────── render ───────────────────────── */

  return (
    <div>
      {/* Icons */}
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

      {/* Controls */}
      <Row className="utility-header align-items-start mb-4">
        {!isAll && (
          <Col lg={6} className="utility-toggles">
            <div className="d-flex flex-column gap-2">
              {/* Water Cost */}
              <div className="d-flex align-items-center">
                <strong style={toggleLabelStyle} className="me-3">Water Cost</strong>
                <Button size="sm" style={showWaterCost ? enableBtnStyle : disableBtnStyle} onClick={() => setShowWaterCost(true)} className="me-1">Enable</Button>
                <Button size="sm" style={showWaterCost ? disableBtnStyle : enableBtnStyle} onClick={() => setShowWaterCost(false)}>Disable</Button>
              </div>

              {/* CDD */}
              <div className="d-flex align-items-center">
                <strong style={toggleLabelStyle} className="me-3">CDD</strong>
                <Button size="sm" style={showCdd ? enableBtnStyle : disableBtnStyle} onClick={() => { setShowCdd(true); setShowFoodCover(false); }} className="me-1">Enable</Button>
                <Button size="sm" style={showCdd ? disableBtnStyle : enableBtnStyle} onClick={() => setShowCdd(false)}>Disable</Button>
              </div>

              {/* Food Cover */}
              <div className="d-flex align-items-center">
                <strong style={toggleLabelStyle} className="me-3">Food Cover</strong>
                <Button size="sm" style={showFoodCover ? enableBtnStyle : disableBtnStyle} onClick={() => { setShowFoodCover(true); setShowCdd(false); }} className="me-1">Enable</Button>
                <Button size="sm" style={showFoodCover ? disableBtnStyle : enableBtnStyle} onClick={() => setShowFoodCover(false)}>Disable</Button>
              </div>
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

      {/* Main */}
      <Row className="g-0" style={{ height: '500px' }}>
        {/* Chart */}
        <Col xs={8} style={{ height: '100%', overflow: 'visible', paddingRight: 0, position: "relative" }}>
          <div style={{ width: '100%', height: '100%', position: "relative" }}>
            <IconButton
              onClick={handleDownloadTrendCSV}
              title="Download trend CSV"
              size="small"
              style={{ position: "absolute", top: -14, right: 55, background: "white", padding: 4, zIndex: 9999 }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
            <Line data={chartData} options={chartOptions} />
          </div>
        </Col>

        {/* Table */}
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
              <strong>{totalConsumption.toLocaleString()} {showWaterCost ? 'MOP' : 'm³'}</strong>
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
                    {showWaterCost ? "Cost (MOP)" : "m³"}
                  </th>
                  {showCdd && (
                    <th style={{...thHeaderStyle, fontSize: "0.75rem", padding: "4px"}}>CDD</th>
                  )}
                  {showFoodCover && (
                    <th style={{...thHeaderStyle, fontSize: "0.75rem", padding: "4px"}}>Food Cover</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {summaryData.map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#D2B48C' }}>
                    <td style={{ padding: "3px", fontSize: "0.75rem" }}>{row.period}</td>
                    <td style={{ padding: "3px", fontSize: "0.75rem" }}>{row.displayValue.toLocaleString()}</td>
                    {showCdd && <td style={{ padding: "3px", fontSize: "0.75rem" }}>{row.cdd.toLocaleString()}</td>}
                    {showFoodCover && <td style={{ padding: "3px", fontSize: "0.75rem" }}>{row.foodCover.toLocaleString()}</td>}
                  </tr>
                ))}
                <tr className="fw-bold" style={{ background:'#D2B48C' }}>
                  <td style={{ padding: "3px", fontSize: "0.75rem" }}>Total</td>
                  <td style={{ padding: "3px", fontSize: "0.75rem" }}>{totalConsumption.toLocaleString()}</td>
                  {showCdd && <td style={{ padding: "3px", fontSize: "0.75rem" }}>{totalCdd.toLocaleString()}</td>}
                  {showFoodCover && (
                    <td style={{ padding: "3px", fontSize: "0.75rem" }}>
                      {totalFoodCover.toLocaleString()}
                    </td>
                  )}
                </tr>
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default WaterMultipleYearComparison;
