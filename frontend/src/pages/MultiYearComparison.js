





import React, { useState, useEffect, useMemo } from "react";
import { Button, Row, Col, Form, Table } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import Papa from "papaparse";
import checkIcon from "../../src/assets/icons/energyDG.png";
import warningIcon from "../../src/assets/icons/gasHovered.png";
import infoIcon from "../../src/assets/icons/waterHovered.png";
import alertIcon from "../../src/assets/icons/electricityHovered.png";
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

/* ────────────────────────────────────────────────────────────────────────── */
/* Aliases so we can survive header differences across sites/files           */
/* ────────────────────────────────────────────────────────────────────────── */
const KWH_ALIASES = [
  "Actual Electricity Consumption",
  "Actual Electricity Consumption (kWh)",
  "Electricity Consumption (kWh)",
  "Electricity Consumption",
  "kWh"
];
const ELEC_COST_ALIASES = ["Elec Cost", "Electricity Cost"];
const CDD_ALIASES = ["CDD", "Cooling Degree Days"];
const OAT_ALIASES = ["Avg. OAT", "Average OAT", "Avg OAT", "OAT"];

const MONTHS_ORDER = [
  "January","February","March","April",
  "May","June","July","August",
  "September","October","November","December"
];

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers (shared with Utility for consistent behavior)                      */
/* ────────────────────────────────────────────────────────────────────────── */
const toNum = (v) => Number(String(v ?? "").replace(/,/g, "")) || 0;

const normalizeMonth = (m) => {
  if (!m) return "";
  const lookup = {
    "1": "January", "01": "January", "jan": "January", "january": "January",
    "2": "February", "02": "February", "feb": "February", "february": "February",
    "3": "March", "03": "March", "mar": "March", "march": "March",
    "4": "April", "04": "April", "apr": "April", "april": "April",
    "5": "May", "05": "May", "may": "May",
    "6": "June", "06": "June", "jun": "June", "june": "June",
    "7": "July", "07": "July", "jul": "July", "july": "July",
    "8": "August", "08": "August", "aug": "August", "august": "August",
    "9": "September", "09": "September", "sep": "September", "september": "September",
    "10": "October", "oct": "October", "october": "October",
    "11": "November", "nov": "November", "november": "November",
    "12": "December", "dec": "December", "december": "December"
  };
  return lookup[String(m).trim().toLowerCase()] || (
    (() => {
      const s = String(m).trim();
      const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      return MONTHS_ORDER.includes(cap) ? cap : s;
    })()
  );
};

// pick first non-empty field in the provided alias list
const pickFieldEnhanced = (row, names) => {
  for (const name of names) {
    if (row?.hasOwnProperty(name) && row[name] != null) {
      const val = String(row[name]).trim();
      if (val !== "" && val !== "-" && val !== "0") return toNum(val);
    }
  }
  return 0;
};

// aggregate rows from multiple sites into one row per (Year, Month)
// "sum" keys are summed, "avg" keys are averaged across sites
const aggregateAllSitesEnhanced = (rows, { sum = {}, avg = {} }) => {
  const map = new Map();
  rows.forEach((r) => {
    const Year = String(r.Year).trim();
    const Month = normalizeMonth(r.Month);
    if (!Year || !Month) return;
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

// reduce helper for All/Single
const sumFor = (rows, { year, month, aliases }) =>
  rows.filter(r => String(r.Year) === String(year) && normalizeMonth(r.Month) === normalizeMonth(month))
      .reduce((a, r) => a + pickFieldEnhanced(r, aliases), 0);

/* ────────────────────────────────────────────────────────────────────────── */
/* API CSV loader (same style as in Utility)                                   */
/* ────────────────────────────────────────────────────────────────────────── */
const parseCSV = (fileName) => new Promise((resolve, reject) => {
  Papa.parse(`${process.env.REACT_APP_BE_URL}/api/file/${fileName}?t=${Date.now()}`, {
    download: true,
    header: true,
    complete: ({ data }) => {
      const cleaned = (data || [])
        .map(row => ({
          ...row,
          Year: row.Year ? String(row.Year).trim() : "",
          Month: normalizeMonth(row.Month),
        }))
        .filter(d => d.Month && d.Year);
      resolve(cleaned);
    },
    error: (err) => reject(err),
  });
});

/* ────────────────────────────────────────────────────────────────────────── */

const MultipleYearComparison = () => {
  const navigate = useNavigate();

  // Data states
  const [kwhData, setKwhData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [normalizedData, setNormalizedData] = useState([]);

  // UI states
  const [showElecCost, setShowElecCost] = useState(false);
  const [showCdd, setShowCdd] = useState(true);
  const [showOat, setShowOat] = useState(false);
  const [fromMonth, setFromMonth] = useState("July");
  const [fromYear, setFromYear] = useState("2024");
  const [toMonth, setToMonth] = useState("July");
  const [toYear, setToYear] = useState("2025");

  const [site, setSite] = useState(localStorage.getItem("selectedSite") || "Cotai");
  const isAll = site === "All";

  const toggleLabelStyle = { width: "160px", fontWeight: 500 };
  const toggleBtnBase = { width:"70px", padding:"2px 6px", fontSize:"0.85rem", marginRight:"8px", borderRadius:"2px" };
  const enableBtnStyle = { ...toggleBtnBase, backgroundColor:"#B1A265", border:"1px solid #8B4513", color:"#000" };
  const disableBtnStyle = { ...toggleBtnBase, backgroundColor:"#6c757d", border:"1px solid #5a6268", color:"#fff" };
  const thHeaderStyle = { backgroundColor:"#F5DEB3", border:"1px solid #8B4513", color:"black" };

  // Listen for site changes (same behavior as before)
  useEffect(() => {
    const handleSiteChange = () => setSite(localStorage.getItem("selectedSite") || "Cotai");
    window.addEventListener("siteChange", handleSiteChange);
    return () => window.removeEventListener("siteChange", handleSiteChange);
  }, []);

  // Live-reload when backend notifies CSV updates
  useEffect(() => {
    const reload = () => {
      loadData(site, setKwhData, setCostData, setNormalizedData);
    };
    window.addEventListener("csvUpdated", reload);
    return () => window.removeEventListener("csvUpdated", reload);
  }, [site]);

  // Initial load / on site change
  useEffect(() => {
    loadData(site, setKwhData, setCostData, setNormalizedData);
  }, [site]);

  const parseNum = (val) => Number(val?.toString().replace(/,/g, "")) || 0;
  const allYears = [...new Set(kwhData.map(d => d.Year))].sort();

  // Generate date range for chart
  const dateRange = useMemo(() => {
    const fromMonthIdx = MONTHS_ORDER.indexOf(fromMonth);
    const toMonthIdx = MONTHS_ORDER.indexOf(toMonth);
    const fromYearNum = parseInt(fromYear);
    const toYearNum = parseInt(toYear);

    const months = [];
    let currentYear = fromYearNum;
    let currentMonth = fromMonthIdx;

    while (currentYear < toYearNum || (currentYear === toYearNum && currentMonth <= toMonthIdx)) {
      months.push({
        month: MONTHS_ORDER[currentMonth],
        year: currentYear.toString(),
        label: `${MONTHS_ORDER[currentMonth].slice(0,3)}-${currentYear.toString().slice(2)}`
      });
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
    return months;
  }, [fromMonth, fromYear, toMonth, toYear]);

  // Prepare chart data (uses aliases + aggregated rows when isAll)
  const chartData = useMemo(() => {
    if (!dateRange.length) return { labels: [], datasets: [] };

    const labels = dateRange.map(d => d.label);
    const datasets = [];

    // Y-left: consumption or cost
    const mainSeries = dateRange.map(({ month, year }) => {
      if (showElecCost) {
        return sumFor(costData, { year, month, aliases: ELEC_COST_ALIASES });
      } else {
        return sumFor(kwhData, { year, month, aliases: KWH_ALIASES });
      }
    });

    datasets.push({
      label: showElecCost ? "Electricity Cost (MOP)" : "Actual Electricity Consumption (kWh)",
      data: mainSeries,
      borderColor: "#FF6B35",
      backgroundColor: "#FF6B35",
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      yAxisID: "y",
    });

    // Y-right: CDD
    if (showCdd) {
      const cddSeries = dateRange.map(({ month, year }) =>
        sumFor(costData, { year, month, aliases: CDD_ALIASES })
      );
      datasets.push({
        label: "CDD",
        data: cddSeries,
        borderColor: "#bd9d4b",
        backgroundColor: "#FFD700",
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y1",
      });
    }

    // Y-right: Avg OAT
    if (showOat) {
      const oatSeries = dateRange.map(({ month, year }) =>
        sumFor(kwhData, { year, month, aliases: OAT_ALIASES }) // avg already baked-in if isAll
      );
      datasets.push({
        label: "Avg. OAT",
        data: oatSeries,
        borderColor: "#bd9d4b",
        backgroundColor: "#FFD700",
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y1",
      });
    }

    return { labels, datasets };
  }, [dateRange, kwhData, costData, showElecCost, showCdd, showOat]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 0 },
    clip: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      datalabels: { display: false },
      legend: {
        position: "bottom",
        align: "center",
        labels: { boxWidth: 16, padding: 12, usePointStyle: true },
      },
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
          text: showElecCost ? "Cost (MOP)" : "Consumption (kWh)",
        },
        beginAtZero: true,
      },
      y1: {
        type: "linear",
        display: showCdd || showOat,
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: showCdd ? "Cooling Degree Days" : "Avg. OAT" },
        beginAtZero: true,
      },
    },
  };

  /* Summary table */
  const summaryData = useMemo(() => {
    return dateRange.map(({ month, year, label }) => {
      const consumption = sumFor(kwhData, { year, month, aliases: KWH_ALIASES });
      const elecCost    = sumFor(costData, { year, month, aliases: ELEC_COST_ALIASES });
      const cddValue    = sumFor(costData, { year, month, aliases: CDD_ALIASES });
      const oatValue    = sumFor(kwhData,  { year, month, aliases: OAT_ALIASES });

      return {
        period: label,
        month,
        year,
        consumption,
        elecCost,
        cdd: cddValue,
        oat: oatValue,
        displayValue: showElecCost ? elecCost : consumption
      };
    });
  }, [dateRange, kwhData, costData, showElecCost]);

  const totalCdd = summaryData.reduce((s, r) => s + (r.cdd || 0), 0);
  const avgOat = summaryData.length > 0
    ? summaryData.reduce((s, r) => s + (r.oat || 0), 0) / summaryData.length
    : 0;
  const totalConsumption = summaryData.reduce((s, r) => s + r.displayValue, 0);

  /* CSV helpers */
  const escapeCSV = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };

  const handleDownloadTrendCSV = () => {
    const siteName = site === "All" ? "All Sites (Cotai + Macho)" : site;
    const valueHeader = showElecCost
      ? "Electricity Cost (MOP)"
      : "Actual Electricity Consumption (kWh)";
    const auxHeader = showCdd ? "CDD" : (showOat ? "Avg. OAT" : null);

    let csv = "";
    csv += `Site,${escapeCSV(siteName)}\n`;
    csv += `Range,${fromMonth.slice(0,3)}-${fromYear.slice(2)} to ${toMonth.slice(0,3)}-${toYear.slice(2)}\n\n`;

    csv += `Period,${valueHeader}`;
    if (auxHeader) csv += `,${auxHeader}`;
    csv += `\n`;

    summaryData.forEach(r => {
      const cols = [r.period, r.displayValue];
      if (showCdd) cols.push(r.cdd);
      if (showOat) cols.push(r.oat);
      csv += cols.join(",") + "\n";
    });

    const totalLine = ["Total", totalConsumption];
    if (showCdd) totalLine.push(totalCdd);
    if (showOat) totalLine.push(avgOat);
    csv += totalLine.join(",") + "\n";

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Electricity_Trend_${fromMonth.slice(0,3)}-${fromYear.slice(2)}_to_${toMonth.slice(0,3)}-${toYear.slice(2)}.csv`;
    link.click();
  };

  const handleDownloadBreakdownCSV = () => {
    const siteName = site === "All" ? "All Sites (Cotai + Macho)" : site;
    const valueHeader = showElecCost ? "Cost (MOP)" : "kWh";
    const auxHeader = showCdd ? "CDD" : (showOat ? "Avg. OAT" : null);

    let csv = "";
    csv += `Site,${escapeCSV(siteName)}\n`;
    csv += `Range,${fromMonth.slice(0,3)}-${fromYear.slice(2)} to ${toMonth.slice(0,3)}-${toYear.slice(2)}\n\n`;

    csv += `Period,${valueHeader}`;
    if (auxHeader) csv += `,${auxHeader}`;
    csv += `\n`;

    summaryData.forEach(r => {
      const cols = [r.period, r.displayValue];
      if (showCdd) cols.push(r.cdd);
      if (showOat) cols.push(r.oat);
      csv += cols.join(",") + "\n";
    });

    const totalLine = ["Total", totalConsumption];
    if (showCdd) totalLine.push(totalCdd);
    if (showOat) totalLine.push(avgOat);
    csv += totalLine.join(",") + "\n";

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Electricity_Breakdown_${fromMonth.slice(0,3)}-${fromYear.slice(2)}_to_${toMonth.slice(0,3)}-${toYear.slice(2)}.csv`;
    link.click();
  };

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

      <Row className="utility-header align-items-start mb-4">
        {!isAll && (
          <Col lg={6} className="utility-toggles">
            <div className="d-flex flex-column gap-2">
              <div className="d-flex align-items-center">
                <strong style={toggleLabelStyle} className="me-3">Electricity Cost</strong>
                <Button size="sm" style={showElecCost ? enableBtnStyle : disableBtnStyle} onClick={() => setShowElecCost(true)} className="me-1">Enable</Button>
                <Button size="sm" style={showElecCost ? disableBtnStyle : enableBtnStyle} onClick={() => setShowElecCost(false)}>Disable</Button>
              </div>
              <div className="d-flex align-items-center">
                <strong style={toggleLabelStyle} className="me-3">CDD</strong>
                <Button size="sm" style={showCdd ? enableBtnStyle : disableBtnStyle} onClick={() => { setShowCdd(true); setShowOat(false); }} className="me-1">Enable</Button>
                <Button size="sm" style={showCdd ? disableBtnStyle : enableBtnStyle} onClick={() => setShowCdd(false)}>Disable</Button>
              </div>
              <div className="d-flex align-items-center">
                <strong style={toggleLabelStyle} className="me-3">Avg. OAT</strong>
                <Button size="sm" style={showOat ? enableBtnStyle : disableBtnStyle} onClick={() => { setShowOat(true); setShowCdd(false); }} className="me-1">Enable</Button>
                <Button size="sm" style={showOat ? disableBtnStyle : enableBtnStyle} onClick={() => setShowOat(false)}>Disable</Button>
              </div>
            </div>
          </Col>
        )}

        <Col lg={6} className="utility-filters">
          <div className="d-flex align-items-end gap-3">
            <div className="d-flex align-items-center">
              <Form.Label className="mb-0"><strong>From</strong></Form.Label>
              <Form.Select value={fromMonth} onChange={e => setFromMonth(e.target.value)} style={{ minWidth: "110px", borderRadius: "20px", padding: "8px 12px" }} className="ms-2">
                {MONTHS_ORDER.map((m) => <option key={m} value={m}>{m}</option>)}
              </Form.Select>
            </div>
            <div>
              <Form.Select value={fromYear} onChange={e => setFromYear(e.target.value)} style={{ minWidth: "110px", borderRadius: "20px", padding: "8px 12px" }}>
                {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </Form.Select>
            </div>

            <div className="d-flex align-items-center">
              <Form.Label className="mb-0"><strong>To</strong></Form.Label>
              <Form.Select value={toMonth} onChange={e => setToMonth(e.target.value)} style={{ minWidth: "110px", borderRadius: "20px", padding: "8px 12px" }} className="ms-2">
                {MONTHS_ORDER.map((m) => <option key={m} value={m}>{m}</option>)}
              </Form.Select>
            </div>
            <div>
              <Form.Select value={toYear} onChange={e => setToYear(e.target.value)} style={{ minWidth: "110px", borderRadius: "20px", padding: "8px 12px" }}>
                {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </Form.Select>
            </div>
          </div>
        </Col>
      </Row>

      {/* Main */}
      <Row className="g-0" style={{ height: "500px" }}>
        {/* Chart */}
        <Col xs={8} style={{ height: "100%", paddingRight: 0, overflow: "visible" }}>
          <div className="chart-wrap" style={{ position: "relative", overflow: "visible" }}>
            <Line data={chartData} options={chartOptions} />
            <IconButton
              onClick={handleDownloadTrendCSV}
              title="Download trend CSV"
              size="small"
              style={{
                position: "absolute",
                top: -20,
                right: 50,
                background: "white",
                border: "1px solid #8B4513",
                padding: 4,
                zIndex: 9999
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </div>
        </Col>

        {/* Summary table */}
        <Col xs={3} style={{ height: "120%", paddingLeft: 0 }}>
          <div className="p-2 bg-light border" style={{ borderBottom: "none" }}>
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
              <strong>{totalConsumption.toLocaleString()} {showElecCost ? "MOP" : "kWh"}</strong>
            </div>
          </div>

          <div style={{ overflow: "visible", maxHeight: "none" }}>
            <Table
              bordered
              className="text-center table-sm shadow-sm mb-0"
              style={{ border: "2px solid #8B4513", borderCollapse: "collapse", width: "100%", fontSize: "0.8rem" }}
            >
              <thead style={{ background: "#F5DEB3" }}>
                <tr>
                  <th style={{ ...thHeaderStyle, fontSize: "0.75rem", padding: "4px" }}>Period</th>
                  <th style={{ ...thHeaderStyle, fontSize: "0.75rem", padding: "4px" }}>
                    {showElecCost ? "Cost (MOP)" : "kWh"}
                  </th>
                  {(showCdd || showOat) && (
                    <th style={{ ...thHeaderStyle, fontSize: "0.75rem", padding: "4px" }}>
                      {showCdd ? "CDD" : "OAT"}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {summaryData.map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "white" : "#D2B48C" }}>
                    <td style={{ padding: "3px", fontSize: "0.75rem" }}>{row.period}</td>
                    <td style={{ padding: "3px", fontSize: "0.75rem" }}>{row.displayValue.toLocaleString()}</td>
                    {showCdd && <td style={{ padding: "3px", fontSize: "0.75rem" }}>{row.cdd.toFixed(1)}</td>}
                    {showOat && <td style={{ padding: "3px", fontSize: "0.75rem" }}>{row.oat.toFixed(1)}</td>}
                  </tr>
                ))}
                <tr className="fw-bold" style={{ background: "#D2B48C" }}>
                  <td style={{ padding: "3px", fontSize: "0.75rem" }}>Total</td>
                  <td style={{ padding: "3px", fontSize: "0.75rem" }}>{totalConsumption.toLocaleString()}</td>
                  {showCdd && <td style={{ padding: "3px", fontSize: "0.75rem" }}>{totalCdd.toFixed(1)}</td>}
                  {showOat && <td style={{ padding: "3px", fontSize: "0.75rem" }}>{avgOat.toFixed(1)}</td>}
                </tr>
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Loader that mirrors Utility’s API-based behavior                            */
/* ────────────────────────────────────────────────────────────────────────── */
async function loadData(site, setKwhData, setCostData, setNormalizedData) {
  if (!site) return;

  if (site !== "All") {
    const [kwh, cost, norm] = await Promise.all([
      parseCSV(`${site}_Cleaned_Consumption.csv`),
      parseCSV(`${site}_Cost_Corrected_Full.csv`),
      parseCSV(`${site}_Cleaned_Consumption.csv`),
    ]);
    setKwhData(kwh);
    setCostData(cost);
    setNormalizedData(norm);
    return;
  }

  // All sites → sum/avg using aliases
  const [kwhCotai, kwhMacho, costCotai, costMacho] = await Promise.all([
    parseCSV(`Cotai_Cleaned_Consumption.csv`),
    parseCSV(`Macho_Cleaned_Consumption.csv`),
    parseCSV(`Cotai_Cost_Corrected_Full.csv`),
    parseCSV(`Macho_Cost_Corrected_Full.csv`),
  ]);

  const kwhAgg = aggregateAllSitesEnhanced(
    [...kwhCotai, ...kwhMacho],
    { sum: { "Actual Electricity Consumption": KWH_ALIASES },
      avg: { "Avg. OAT": OAT_ALIASES } }
  );

  const costAgg = aggregateAllSitesEnhanced(
    [...costCotai, ...costMacho],
    { sum: { "Elec Cost": ELEC_COST_ALIASES },
      avg: { "CDD": CDD_ALIASES } }
  );

  setKwhData(kwhAgg);
  setCostData(costAgg);
  setNormalizedData([]); // not used for All
}

export default MultipleYearComparison;
