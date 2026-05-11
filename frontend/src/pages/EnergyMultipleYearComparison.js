






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

const MONTHS_ORDER = [
  "January","February","March","April",
  "May","June","July","August",
  "September","October","November","December"
];

/* ---------- Aliases / header tolerance ---------- */
const ENERGY_ACT_ALIASES = [
  "Total Actual Energy Consumption_GJ",
  "Total Actual Energy Consumption",
  "Actual Energy (GJ)",
  "Actual Energy"
];

const ENERGY_NORM_ALIASES = [
  "Total Normalized Energy Consumption_GJ",
  "Total Normalized Energy Consumption",
  "Normalized Energy (GJ)",
  "Normalized"
];

const ENERGY_COST_ALIASES = [
  "Energy Cost",
  "Total Energy Cost",
  "Energy (MOP)"
];

const OAT_ALIASES = [
  "Avg. OAT",
  "Average OAT",
  "Avg OAT",
  "OAT"
];

/* ---------- Helpers ---------- */
const toNum = (v) => Number(String(v ?? "").replace(/,/g, "")) || 0;

const normalizeSite = (s) => {
  const x = String(s || "").trim().toLowerCase();
  if (["cotai","coati","cotia"].includes(x)) return "Cotai";
  if (["macho","macau"].includes(x)) return "Macho";
  if (x === "all") return "All";
  return s || "Cotai";
};

const normalizeMonth = (m) => {
  if (!m) return "";
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
  const key = String(m).trim().toLowerCase();
  return map[key] || (MONTHS_ORDER.includes(m) ? m : m);
};

const pick = (row, aliases) => {
  if (!row) return null;
  for (const k of aliases) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
      return toNum(row[k]);
    }
  }
  return null;
};

const escapeCSV = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

/* API-based CSV loader (same pattern as your Utility page) */
const parseCSVByFileName = (fileName) =>
  new Promise((resolve) => {
    Papa.parse(`${process.env.REACT_APP_BE_URL}/api/file/${fileName}?t=${Date.now()}`, {
      download: true,
      header: true,
      transformHeader: (h) => String(h || "").trim(),
      complete: ({ data }) => {
        const cleaned = (data || [])
          .map(row => ({
            ...row,
            Year: row.Year ? String(row.Year).trim() : "",
            Month: row.Month ? normalizeMonth(row.Month) : "",
          }))
          .filter(r => r.Year && r.Month);
        resolve(cleaned);
      }
    });
  });

/* Aggregator for "All": sum and avg fields */
const aggregateAllSites = (rows, { sum = {}, avg = {} }) => {
  const map = new Map();
  rows.forEach(r => {
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
    Object.entries(sum).forEach(([outKey, aliases]) => {
      const v = pick(r, aliases);
      acc[outKey] += v || 0;
    });
    Object.entries(avg).forEach(([outKey, aliases]) => {
      const v = pick(r, aliases);
      if (v !== null) { acc[`__${outKey}`].s += v; acc[`__${outKey}`].c += 1; }
    });
  });
  const out = Array.from(map.values()).map(acc => {
    Object.keys(avg).forEach(k => {
      const { s, c } = acc[`__${k}`];
      acc[k] = c ? Number((s / c).toFixed(1)) : 0;
      delete acc[`__${k}`];
    });
    return acc;
  });
  return out.sort((a,b) =>
    a.Year.localeCompare(b.Year) ||
    MONTHS_ORDER.indexOf(a.Month) - MONTHS_ORDER.indexOf(b.Month)
  );
};

const EnergyMultipleYearComparison = () => {
  const navigate = useNavigate();

  // Data states
  const [energyData, setEnergyData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [normalizedData, setNormalizedData] = useState([]);

  // UI states
  const [showEnergyCost, setShowEnergyCost] = useState(false);
  const [showOat, setShowOat] = useState(true);
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

  // React to external site changes
  useEffect(() => {
    const handleSiteChange = () => setSite(normalizeSite(localStorage.getItem("selectedSite") || "Cotai"));
    window.addEventListener("siteChange", handleSiteChange);
    return () => window.removeEventListener("siteChange", handleSiteChange);
  }, []);

  // Load CSVs via API
  useEffect(() => {
    if (!site) return;

    const loadSingle = async (s) => {
      const [cons, cost] = await Promise.all([
        parseCSVByFileName(`${s}_Cleaned_Consumption.csv`),
        parseCSVByFileName(`${s}_Cost_Corrected_Full.csv`)
      ]);
      setEnergyData(cons);
      setCostData(cost);
      setNormalizedData(cons); // if you have a separate normalized file, switch here
    };

    const loadAll = async () => {
      const [cotaiCons, machoCons, cotaiCost, machoCost] = await Promise.all([
        parseCSVByFileName(`Cotai_Cleaned_Consumption.csv`),
        parseCSVByFileName(`Macho_Cleaned_Consumption.csv`),
        parseCSVByFileName(`Cotai_Cost_Corrected_Full.csv`),
        parseCSVByFileName(`Macho_Cost_Corrected_Full.csv`),
      ]);

      const energyAgg = aggregateAllSites(
        [...cotaiCons, ...machoCons],
        {
          sum: { "Total Actual Energy Consumption": ENERGY_ACT_ALIASES },
          avg: { "Avg. OAT": OAT_ALIASES }
        }
      );

      const costAgg = aggregateAllSites(
        [...cotaiCost, ...machoCost],
        { sum: { "Energy Cost": ENERGY_COST_ALIASES } }
      );

      setEnergyData(energyAgg);
      setCostData(costAgg);
      setNormalizedData(energyAgg);
    };

    if (site === "All") loadAll();
    else loadSingle(site);
  }, [site]);

  const allYears = [...new Set(energyData.map(d => d.Year))].sort();

  // Build date range
  const dateRange = useMemo(() => {
    const fromMonthIdx = MONTHS_ORDER.indexOf(fromMonth);
    const toMonthIdx = MONTHS_ORDER.indexOf(toMonth);
    const fromYearNum = parseInt(fromYear);
    const toYearNum = parseInt(toYear);

    const months = [];
    let cy = fromYearNum;
    let cm = fromMonthIdx;

    while (cy < toYearNum || (cy === toYearNum && cm <= toMonthIdx)) {
      months.push({
        month: MONTHS_ORDER[cm],
        year: cy.toString(),
        label: `${MONTHS_ORDER[cm].slice(0,3)}-${cy.toString().slice(2)}`
      });
      cm++;
      if (cm > 11) { cm = 0; cy++; }
    }
    return months;
  }, [fromMonth, fromYear, toMonth, toYear]);

  // Chart
  const chartData = useMemo(() => {
    if (!dateRange.length) return { labels: [], datasets: [] };

    const labels = dateRange.map(d => d.label);
    const datasets = [];

    const consumptionData = dateRange.map(({ month, year }) => {
      if (showEnergyCost) {
        const row = costData.find(d => normalizeMonth(d.Month) === month && String(d.Year) === year);
        return row ? (pick(row, ENERGY_COST_ALIASES) ?? 0) : 0;
      } else {
        const row = energyData.find(d => normalizeMonth(d.Month) === month && String(d.Year) === year);
        return row ? (pick(row, ENERGY_ACT_ALIASES) ?? 0) : 0;
      }
    });

    datasets.push({
      label: showEnergyCost ? "Energy Cost (MOP)" : "Actual Energy Consumption (GJ)",
      data: consumptionData,
      borderColor: "#FF6B35",
      backgroundColor: "#FF6B35",
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      yAxisID: "y",
    });

    if (showOat || isAll) {
      const oatData = dateRange.map(({ month, year }) => {
        const row = energyData.find(d => normalizeMonth(d.Month) === month && String(d.Year) === year);
        return row ? (pick(row, OAT_ALIASES) ?? 0) : 0;
      });

      datasets.push({
        label: "Avg. OAT",
        data: oatData,
        borderColor: "#1E90FF",
        backgroundColor: "#1E90FF",
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y1",
      });
    }

    return { labels, datasets };
  }, [dateRange, energyData, costData, showEnergyCost, showOat, isAll]);

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
      x: { display: true, title: { display: true, text: "Month-Year" } },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: { display: true, text: showEnergyCost ? "Cost (MOP)" : "Consumption (GJ)" },
        beginAtZero: true,
      },
      y1: {
        type: "linear",
        display: showOat || isAll,
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Avg. OAT" },
        beginAtZero: true,
      },
    },
  };

  // Summary table rows
  const summaryData = useMemo(() => {
    return dateRange.map(({ month, year, label }) => {
      const eRow = energyData.find(d => normalizeMonth(d.Month) === month && String(d.Year) === year);
      const cRow = costData.find(d => normalizeMonth(d.Month) === month && String(d.Year) === year);
      const consumption = eRow ? (pick(eRow, ENERGY_ACT_ALIASES) ?? 0) : 0;
      const energyCost = cRow ? (pick(cRow, ENERGY_COST_ALIASES) ?? 0) : 0;
      const oat = eRow ? (pick(eRow, OAT_ALIASES) ?? 0) : 0;

      return {
        period: label,
        month, year,
        consumption, energyCost, oat,
        displayValue: showEnergyCost ? energyCost : consumption
      };
    });
  }, [dateRange, energyData, costData, showEnergyCost]);

  const totalConsumption = summaryData.reduce((s, r) => s + (r.displayValue || 0), 0);
  const avgOat = (showOat || isAll) && summaryData.length
    ? (summaryData.reduce((s, r) => s + (r.oat || 0), 0) / summaryData.length).toFixed(1)
    : null;

  // CSV exports
  const handleDownloadTrendCSV = () => {
    const valueHeader = showEnergyCost ? "Energy Cost (MOP)" : "Actual Energy Consumption (GJ)";
    const auxHeader = (showOat || isAll) ? "Avg. OAT" : null;

    let csv = "";
    csv += `Site,${escapeCSV(site)}\n`;
    csv += `Range,${fromMonth.slice(0,3)}-${fromYear.slice(2)} to ${toMonth.slice(0,3)}-${toYear.slice(2)}\n\n`;

    csv += `Period,${valueHeader}`;
    if (auxHeader) csv += `,${auxHeader}`;
    csv += `\n`;

    summaryData.forEach(r => {
      const cols = [r.period, r.displayValue];
      if (auxHeader) cols.push((r.oat ?? 0).toFixed(1));
      csv += cols.join(",") + "\n";
    });

    const totalLine = ["Total", totalConsumption];
    if (auxHeader) totalLine.push(avgOat);
    csv += totalLine.join(",") + "\n";

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Energy_Trend_${fromMonth.slice(0,3)}-${fromYear.slice(2)}_to_${toMonth.slice(0,3)}-${toYear.slice(2)}.csv`;
    link.click();
  };

  const handleDownloadBreakdownCSV = () => {
    const valueHeader = showEnergyCost ? "Cost (MOP)" : "GJ";
    const auxHeader = (showOat || isAll) ? "Avg. OAT" : null;

    let csv = "";
    csv += `Site,${escapeCSV(site)}\n`;
    csv += `Range,${fromMonth.slice(0,3)}-${fromYear.slice(2)} to ${toMonth.slice(0,3)}-${toYear.slice(2)}\n\n`;

    csv += `Period,${valueHeader}`;
    if (auxHeader) csv += `,${auxHeader}`;
    csv += `\n`;

    summaryData.forEach(r => {
      const cols = [r.period, r.displayValue];
      if (auxHeader) cols.push((r.oat ?? 0).toFixed(1));
      csv += cols.join(",") + "\n";
    });

    const totalLine = ["Total", totalConsumption];
    if (auxHeader) totalLine.push(avgOat);
    csv += totalLine.join(",") + "\n";

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Energy_Breakdown_${fromMonth.slice(0,3)}-${fromYear.slice(2)}_to_${toMonth.slice(0,3)}-${toYear.slice(2)}.csv`;
    link.click();
  };

  return (
    <div>
      {/* Icon Row */}
      <Row className="mb-2">
        <Col xs="auto">
          <div className="d-flex align-items-center gap-2" style={{ position: "relative", zIndex: 2000 }}>
            <img src={checkIcon} alt="Electricity" style={{ width: 36, height: 36, cursor: "pointer" }} onClick={() => navigate("/utility")} />
            <img src={warningIcon} alt="Gas" style={{ width: 36, height: 36, cursor: "pointer" }} onClick={() => navigate("/gas")} />
            <img src={infoIcon} alt="Water" style={{ width: 36, height: 36, cursor: "pointer" }} onClick={() => navigate("/water")} />
            <img src={alertIcon} alt="Energy" style={{ width: 36, height: 36, cursor: "pointer" }} onClick={() => navigate("/energy")} />
          </div>
        </Col>
      </Row>

      {/* Controls Header */}
      <Row className="utility-header align-items-start mb-4">
        {!isAll && (
          <Col lg={6} className="utility-toggles">
            <div className="d-flex flex-column gap-2">
              <div className="d-flex align-items-center">
                <strong style={toggleLabelStyle} className="me-3">Energy Cost</strong>
                <Button size="sm" style={showEnergyCost ? enableBtnStyle : disableBtnStyle} onClick={() => setShowEnergyCost(true)} className="me-1">Enable</Button>
                <Button size="sm" style={showEnergyCost ? disableBtnStyle : enableBtnStyle} onClick={() => setShowEnergyCost(false)}>Disable</Button>
              </div>
              <div className="d-flex align-items-center">
                <strong style={toggleLabelStyle} className="me-3">Avg. OAT</strong>
                <Button size="sm" style={showOat ? enableBtnStyle : disableBtnStyle} onClick={() => setShowOat(true)} className="me-1">Enable</Button>
                <Button size="sm" style={showOat ? disableBtnStyle : enableBtnStyle} onClick={() => setShowOat(false)}>Disable</Button>
              </div>
            </div>
          </Col>
        )}
        <Col lg={6} className="utility-filters">
          <div className="d-flex align-items-end gap-3">
            <div className="d-flex align-items-center">
              <Form.Label className="mb-0"><strong>From</strong></Form.Label>
              <Form.Select value={fromMonth} onChange={e => setFromMonth(e.target.value)} style={{ minWidth: 110, borderRadius: 20, padding: '8px 12px' }} className="ms-2">
                {MONTHS_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
              </Form.Select>
            </div>
            <div>
              <Form.Select value={fromYear} onChange={e => setFromYear(e.target.value)} style={{ minWidth: 110, borderRadius: 20, padding: '8px 12px' }}>
                {allYears.map(y => <option key={y} value={y}>{y}</option>)}
              </Form.Select>
            </div>
            <div className="d-flex align-items-center">
              <Form.Label className="mb-0"><strong>To</strong></Form.Label>
              <Form.Select value={toMonth} onChange={e => setToMonth(e.target.value)} style={{ minWidth: 110, borderRadius: 20, padding: '8px 12px' }} className="ms-2">
                {MONTHS_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
              </Form.Select>
            </div>
            <div>
              <Form.Select value={toYear} onChange={e => setToYear(e.target.value)} style={{ minWidth: 110, borderRadius: 20, padding: '8px 12px' }}>
                {allYears.map(y => <option key={y} value={y}>{y}</option>)}
              </Form.Select>
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Content */}
      <Row className="g-0" style={{ height: 500 }}>
        <Col xs={8} style={{ height: '100%', overflow: 'visible', paddingRight: 0, position: "relative" }}>
          <div style={{ width: '100%', height: '100%', position: "relative" }}>
            <IconButton
              onClick={handleDownloadTrendCSV}
              title="Download trend CSV"
              size="small"
              style={{ position: "absolute", top: -19, right: 80, background: "white", padding: 4, zIndex: 9999 }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
            <Line data={chartData} options={chartOptions} />
          </div>
        </Col>

        <Col xs={3} style={{ height: '120%', paddingLeft: 0 }}>
          <div className="p-2 bg-light border" style={{ borderBottom: 'none' }}>
            <h5 className="text-danger fw-bold mb-1 d-flex align-items-center">
              Breakdown
              <IconButton
                onClick={handleDownloadBreakdownCSV}
                title="Download breakdown CSV"
                size="small"
                style={{ marginLeft: 8, backgroundColor: "white", padding: 4 }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </h5>
            <div className="text-center">
              <strong>{fromMonth.slice(0,3)}-{fromYear.slice(2)} — {toMonth.slice(0,3)}-{toYear.slice(2)}</strong>
            </div>
            <div className="text-center">
              <strong>{totalConsumption.toLocaleString()} {showEnergyCost ? 'MOP' : 'GJ'}</strong>
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
                  <th style={{...thHeaderStyle, fontSize: "0.75rem", padding: "4px"}}>{showEnergyCost ? "Cost (MOP)" : "GJ"}</th>
                  {(showOat || isAll) && <th style={{...thHeaderStyle, fontSize: "0.75rem", padding: "4px"}}>OAT</th>}
                </tr>
              </thead>
              <tbody>
                {summaryData.map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#D2B48C' }}>
                    <td style={{ padding: "3px", fontSize: "0.75rem" }}>{row.period}</td>
                    <td style={{ padding: "3px", fontSize: "0.75rem" }}>{row.displayValue.toLocaleString()}</td>
                    {(showOat || isAll) && <td style={{ padding: "3px", fontSize: "0.75rem" }}>{(row.oat ?? 0).toFixed(1)}</td>}
                  </tr>
                ))}
                <tr className="fw-bold" style={{ background:'#D2B48C' }}>
                  <td style={{ padding: "3px", fontSize: "0.75rem" }}>Total</td>
                  <td style={{ padding: "3px", fontSize: "0.75rem" }}>{totalConsumption.toLocaleString()}</td>
                  {(showOat || isAll) && <td style={{ padding: "3px", fontSize: "0.75rem" }}>{avgOat}</td>}
                </tr>
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default EnergyMultipleYearComparison;
