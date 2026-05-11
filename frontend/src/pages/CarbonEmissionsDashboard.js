



import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";

const CarbonEmissionsDashboard = () => {
  const [selectedSite, setSelectedSite] = useState(localStorage.getItem("selectedSite") || "Cotai");
  const [processedData, setProcessedData] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [baselineYear, setBaselineYear] = useState('2019');
  const [comparisonYear, setComparisonYear] = useState('2024');
  const [allYearData, setAllYearData] = useState({});
  const [expandedBaseline, setExpandedBaseline] = useState({ scope1: false, scope2: false });
  const [expandedComparison, setExpandedComparison] = useState({ scope1: false, scope2: false });
  const [detailedData, setDetailedData] = useState({});
  const [sectionExpanded, setSectionExpanded] = useState({
    target: true,
    breakdown: true,
    changeSummary: true
  });

  // Listen for site changes from header
  useEffect(() => {
    const handleSiteChange = () => {
      const newSite = localStorage.getItem("selectedSite") || "Cotai";
      setSelectedSite(newSite);
    };
    window.addEventListener("siteChange", handleSiteChange);
    return () => window.removeEventListener("siteChange", handleSiteChange);
  }, []);

  // Load CSV when site changes
  useEffect(() => {
    if (selectedSite === "All") {
      // Load both CSV files and combine them for All Sites
      Promise.all([
        new Promise((resolve) => {
          Papa.parse("/Data/dataGHGEmissions_Cotai(in).csv", {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => {
              console.error("Error loading Cotai CSV:", error);
              resolve([]);
            }
          });
        }),
        new Promise((resolve) => {
          Papa.parse("/Data/dataGHGEmissions_Macau(in).csv", {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => {
              console.error("Error loading Macau CSV:", error);
              resolve([]);
            }
          });
        })
      ]).then(([cotaiRows, macauRows]) => {
        // Find key rows from both sites
        const cotaiScope1 = cotaiRows.find((r) => r.Descriptions?.toLowerCase().includes("scope 1 emissions total"));
        const cotaiScope2 = cotaiRows.find((r) => r.Descriptions?.toLowerCase().includes("scope 2 emissions total"));
        const cotaiTotal = cotaiRows.find((r) => r.Descriptions?.toLowerCase().includes("total emissions"));
        const cotaiArea = cotaiRows.find((r) => r.Descriptions?.toLowerCase().includes("total area"));

        const macauScope1 = macauRows.find((r) => r.Descriptions?.toLowerCase().includes("scope 1 emissions total"));
        const macauScope2 = macauRows.find((r) => r.Descriptions?.toLowerCase().includes("scope 2 emissions total"));
        const macauTotal = macauRows.find((r) => r.Descriptions?.toLowerCase().includes("total emissions"));
        const macauArea = macauRows.find((r) => r.Descriptions?.toLowerCase().includes("total area"));

        if (!cotaiScope1 || !cotaiScope2 || !cotaiTotal || !cotaiArea ||
            !macauScope1 || !macauScope2 || !macauTotal || !macauArea) {
          console.error("Missing key rows in one or both CSV files");
          return;
        }

        // Get all year columns
        const years = Object.keys(cotaiScope1)
          .filter((k) => k !== "Descriptions" && !isNaN(k))
          .sort();

        setAvailableYears(years);

        // Process combined data for all years (SUM of Cotai + Macau)
        const yearDataMap = {};
        const formattedData = years.map((year) => {
          // Sum Cotai + Macau for each metric
          const s1 = parseFloat(cotaiScope1[year] || 0) + parseFloat(macauScope1[year] || 0);
          const s2 = parseFloat(cotaiScope2[year] || 0) + parseFloat(macauScope2[year] || 0);
          const t = parseFloat(cotaiTotal[year] || 0) + parseFloat(macauTotal[year] || 0);
          const a = parseFloat(cotaiArea[year] || 0) + parseFloat(macauArea[year] || 0);
          const intensity = a > 0 ? (t / a).toFixed(3) : 0;

          // Calculate 2030 target: 25% reduction from 2019 baseline
          const baseline2019 = parseFloat(cotaiTotal["2019"] || 0) + parseFloat(macauTotal["2019"] || 0);
          const yearNum = Number(year);
          const target = baseline2019 * (1 - 0.25 * (yearNum - 2019) / (2030 - 2019));

          const yearData = {
            year: yearNum,
            actual: t,
            target: Number(target.toFixed(0)),
            Scope1: s1,
            Scope2: s2,
            Total: t,
            Intensity: Number(intensity)
          };

          yearDataMap[year] = {
            scope1: s1,
            scope2: s2,
            total: t,
            intensity: Number(intensity)
          };

          return yearData;
        });

        // Add future years for target projection (2025-2030)
        const lastYear = Number(years[years.length - 1]);
        const baseline2019 = parseFloat(cotaiTotal["2019"] || 0) + parseFloat(macauTotal["2019"] || 0);
        for (let year = lastYear + 1; year <= 2030; year++) {
          const target = baseline2019 * (1 - 0.25 * (year - 2019) / (2030 - 2019));
          formattedData.push({
            year: year,
            actual: null,
            target: Number(target.toFixed(0)),
            Scope1: 0,
            Scope2: 0,
            Total: 0,
            Intensity: 0
          });
        }

        setProcessedData(formattedData);
        setAllYearData(yearDataMap);

        // Store detailed breakdown data
        const detailedBreakdown = {};
        years.forEach(year => {
          detailedBreakdown[year] = {
            scope1Details: {
              stationaryCombustion: parseFloat(cotaiRows.find(r => r.Descriptions?.includes("Stationary Combustion Sources"))?.[year] || 0) + 
                                   parseFloat(macauRows.find(r => r.Descriptions?.includes("Stationary Combustion Sources"))?.[year] || 0),
              naturalGas: parseFloat(cotaiRows.find(r => r.Descriptions?.includes("Natural Gas"))?.[year] || 0) + 
                         parseFloat(macauRows.find(r => r.Descriptions?.includes("Natural Gas"))?.[year] || 0),
              lpg: parseFloat(cotaiRows.find(r => r.Descriptions?.includes("LPG"))?.[year] || 0) + 
                  parseFloat(macauRows.find(r => r.Descriptions?.includes("LPG"))?.[year] || 0),
              diesel: parseFloat(cotaiRows.find(r => r.Descriptions?.toLowerCase().includes("diesel") && !r.Descriptions?.toLowerCase().includes("vehicle"))?.[year] || 0) + 
                     parseFloat(macauRows.find(r => r.Descriptions?.toLowerCase().includes("diesel") && !r.Descriptions?.toLowerCase().includes("vehicle"))?.[year] || 0),
              mobileCombustion: parseFloat(cotaiRows.find(r => r.Descriptions?.includes("Mobile Combustion Sources"))?.[year] || 0) + 
                               parseFloat(macauRows.find(r => r.Descriptions?.includes("Mobile Combustion Sources"))?.[year] || 0),
              gasolineVehicle: parseFloat(cotaiRows.find(r => r.Descriptions?.includes("Gasoline Vehicle"))?.[year] || 0) + 
                              parseFloat(macauRows.find(r => r.Descriptions?.includes("Gasoline Vehicle"))?.[year] || 0),
              dieselVehicle: parseFloat(cotaiRows.find(r => r.Descriptions?.includes("Diesel Vehicle"))?.[year] || 0) + 
                            parseFloat(macauRows.find(r => r.Descriptions?.includes("Diesel Vehicle"))?.[year] || 0),
              fugitiveEmissions: parseFloat(cotaiRows.find(r => r.Descriptions?.includes("Fugitive Emissions"))?.[year] || 0) + 
                                parseFloat(macauRows.find(r => r.Descriptions?.includes("Fugitive Emissions"))?.[year] || 0),
              refrigerantR134a: parseFloat(cotaiRows.find(r => r.Descriptions?.includes("Refrigerant (R-134a)"))?.[year] || 0) + 
                               parseFloat(macauRows.find(r => r.Descriptions?.includes("Refrigerant (R-134a)"))?.[year] || 0),
              refrigerantR404a: parseFloat(cotaiRows.find(r => r.Descriptions?.includes("Refrigerant (R-404a)"))?.[year] || 0) + 
                               parseFloat(macauRows.find(r => r.Descriptions?.includes("Refrigerant (R-404a)"))?.[year] || 0),
              refrigerantR410a: parseFloat(cotaiRows.find(r => r.Descriptions?.includes("Refrigerant (R-410a)"))?.[year] || 0) + 
                               parseFloat(macauRows.find(r => r.Descriptions?.includes("Refrigerant (R-410a)"))?.[year] || 0)
            },
            scope2Details: {
              electricityPurchased: parseFloat(cotaiRows.find(r => r.Descriptions?.includes("Electricity Purchased"))?.[year] || 0) + 
                                   parseFloat(macauRows.find(r => r.Descriptions?.includes("Electricity Purchased"))?.[year] || 0)
            }
          };
        });
        setDetailedData(detailedBreakdown);

        // Set default years if they exist
        if (years.includes('2019')) setBaselineYear('2019');
        if (years.includes('2024')) setComparisonYear('2024');
        else if (years.length > 0) setComparisonYear(years[years.length - 1]);
      });
    } else {
      // Load single site CSV (Cotai or Macau)
      const filePath =
        selectedSite === "Macho"
          ? "/Data/dataGHGEmissions_Macau(in).csv"
          : "/Data/dataGHGEmissions_Cotai(in).csv";

      Papa.parse(filePath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data;

          // Find key rows
          const scope1Row = rows.find((r) => r.Descriptions?.toLowerCase().includes("scope 1 emissions total"));
          const scope2Row = rows.find((r) => r.Descriptions?.toLowerCase().includes("scope 2 emissions total"));
          const totalRow = rows.find((r) => r.Descriptions?.toLowerCase().includes("total emissions"));
          const areaRow = rows.find((r) => r.Descriptions?.toLowerCase().includes("total area"));

          if (!scope1Row || !scope2Row || !totalRow || !areaRow) {
            console.error("Missing key rows in CSV");
            return;
          }

          // Get all year columns
          const years = Object.keys(scope1Row)
            .filter((k) => k !== "Descriptions" && !isNaN(k))
            .sort();

          setAvailableYears(years);

          // Process data for all years
          const yearDataMap = {};
          const formattedData = years.map((year) => {
            const s1 = parseFloat(scope1Row[year] || 0);
            const s2 = parseFloat(scope2Row[year] || 0);
            const t = parseFloat(totalRow[year] || 0);
            const a = parseFloat(areaRow[year] || 1);
            const intensity = a > 0 ? (t / a).toFixed(3) : 0;

            // Calculate 2030 target: 25% reduction from 2019 baseline
            const baseline2019 = parseFloat(totalRow["2019"] || t);
            const yearNum = Number(year);
            const target = baseline2019 * (1 - 0.25 * (yearNum - 2019) / (2030 - 2019));

            const yearData = {
              year: yearNum,
              actual: t,
              target: Number(target.toFixed(0)),
              Scope1: s1,
              Scope2: s2,
              Total: t,
              Intensity: Number(intensity)
            };

            yearDataMap[year] = {
              scope1: s1,
              scope2: s2,
              total: t,
              intensity: Number(intensity)
            };

            return yearData;
          });

          // Add future years for target projection (2025-2030)
          const lastYear = Number(years[years.length - 1]);
          const baseline2019 = parseFloat(totalRow["2019"] || 0);
          for (let year = lastYear + 1; year <= 2030; year++) {
            const target = baseline2019 * (1 - 0.25 * (year - 2019) / (2030 - 2019));
            formattedData.push({
              year: year,
              actual: null,
              target: Number(target.toFixed(0)),
              Scope1: 0,
              Scope2: 0,
              Total: 0,
              Intensity: 0
            });
          }

          setProcessedData(formattedData);
          setAllYearData(yearDataMap);

          // Store detailed breakdown data
          const detailedBreakdown = {};
          years.forEach(year => {
            detailedBreakdown[year] = {
              scope1Details: {
                stationaryCombustion: parseFloat(rows.find(r => r.Descriptions?.includes("Stationary Combustion Sources"))?.[year] || 0),
                naturalGas: parseFloat(rows.find(r => r.Descriptions?.includes("Natural Gas"))?.[year] || 0),
                lpg: parseFloat(rows.find(r => r.Descriptions?.includes("LPG"))?.[year] || 0),
                diesel: parseFloat(rows.find(r => r.Descriptions?.toLowerCase().includes("diesel") && !r.Descriptions?.toLowerCase().includes("vehicle"))?.[year] || 0),
                mobileCombustion: parseFloat(rows.find(r => r.Descriptions?.includes("Mobile Combustion Sources"))?.[year] || 0),
                gasolineVehicle: parseFloat(rows.find(r => r.Descriptions?.includes("Gasoline Vehicle"))?.[year] || 0),
                dieselVehicle: parseFloat(rows.find(r => r.Descriptions?.includes("Diesel Vehicle"))?.[year] || 0),
                fugitiveEmissions: parseFloat(rows.find(r => r.Descriptions?.includes("Fugitive Emissions"))?.[year] || 0),
                refrigerantR134a: parseFloat(rows.find(r => r.Descriptions?.includes("Refrigerant (R-134a)"))?.[year] || 0),
                refrigerantR404a: parseFloat(rows.find(r => r.Descriptions?.includes("Refrigerant (R-404a)"))?.[year] || 0),
                refrigerantR410a: parseFloat(rows.find(r => r.Descriptions?.includes("Refrigerant (R-410a)"))?.[year] || 0)
              },
              scope2Details: {
                electricityPurchased: parseFloat(rows.find(r => r.Descriptions?.includes("Electricity Purchased"))?.[year] || 0)
              }
            };
          });
          setDetailedData(detailedBreakdown);

          // Set default years if they exist
          if (years.includes('2019')) setBaselineYear('2019');
          if (years.includes('2024')) setComparisonYear('2024');
          else if (years.length > 0) setComparisonYear(years[years.length - 1]);
        },
        error: (error) => {
          console.error("Error loading CSV:", error);
        }
      });
    }
  }, [selectedSite]);

  if (processedData.length === 0 || availableYears.length === 0) {
    return (
      <div style={{ padding: '2rem', marginTop: '80px', textAlign: 'center' }}>
        <h3>Loading CSV data for {selectedSite}...</h3>
      </div>
    );
  }

  console.log("Detailed Data:", detailedData);
  console.log("Baseline Year:", baselineYear);
  console.log("Comparison Year:", comparisonYear);
  console.log("Expanded Baseline:", expandedBaseline);
  console.log("Expanded Comparison:", expandedComparison);

  // Get baseline and comparison data
  const baseline = allYearData[baselineYear] || { scope1: 0, scope2: 0, total: 0, intensity: 0 };
  const comparison = allYearData[comparisonYear] || { scope1: 0, scope2: 0, total: 0, intensity: 0 };

  const pieColors = ['#E87722', '#FFD93D'];

  // Calculate changes
  const scope1Change = comparison.scope1 - baseline.scope1;
  const scope2Change = comparison.scope2 - baseline.scope2;
  const totalChange = comparison.total - baseline.total;
  const intensityChange = comparison.intensity - baseline.intensity;

  const scope1PercentChange = baseline.scope1 !== 0 ? ((scope1Change / baseline.scope1) * 100).toFixed(1) : '0.0';
  const scope2PercentChange = baseline.scope2 !== 0 ? ((scope2Change / baseline.scope2) * 100).toFixed(1) : '0.0';
  const totalPercentChange = baseline.total !== 0 ? ((totalChange / baseline.total) * 100).toFixed(1) : '0.0';
  const intensityPercentChange = baseline.intensity !== 0 ? ((intensityChange / baseline.intensity) * 100).toFixed(1) : '0.0';

  const baselinePieData = [
    { name: 'Scope 1', value: baseline.scope1 },
    { name: 'Scope 2', value: baseline.scope2 }
  ];

  const comparisonPieData = [
    { name: 'Scope 1', value: comparison.scope1 },
    { name: 'Scope 2', value: comparison.scope2 }
  ];

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#e8e8e8',
      padding: '1.5rem',
      margin: '80px 0px 0px 100px'
    },
    section: {
      backgroundColor: '#f5f5f5',
      padding: '1.5rem',
      marginBottom: '1rem',
      borderRadius: '4px'
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    sectionTitle: {
      color: '#E87722',
      fontSize: '1.125rem',
      fontWeight: 'bold',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    arrow: {
      color: '#E87722',
      fontSize: '1rem',
      display: 'inline-block',
      fontWeight: 'normal',
      fontFamily: 'Arial, sans-serif'
    },
    reportingText: {
      color: '#333',
      fontSize: '0.9rem'
    },
    targetBox: {
      backgroundColor: 'white',
      padding: '1.5rem',
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: '2rem',
      alignItems: 'center'
    },
    leftSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    },
    targetItem: {
      textAlign: 'center'
    },
    targetLabel: {
      color: '#E87722',
      fontSize: '1rem',
      fontWeight: '600',
      marginBottom: '0.5rem'
    },
    targetValue: {
      fontSize: '3rem',
      fontWeight: 'bold',
      lineHeight: 1
    },
    emissionsLabel: {
      color: '#333',
      fontSize: '0.95rem',
      marginBottom: '1rem'
    },
    chartBox: {
      backgroundColor: 'white',
      padding: '1rem'
    },
    chartTitle: {
      color: '#E87722',
      fontSize: '0.9rem',
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: '0.5rem'
    },
    pieSection: {
      backgroundColor: 'white',
      padding: '1.5rem'
    },
    pieGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '2rem'
    },
    pieChartContainer: {
      textAlign: 'center'
    },
    selectContainer: {
      display: 'flex',
      gap: '1.5rem',
      alignItems: 'center'
    },
    selectLabel: {
      color: '#333',
      fontSize: '0.9rem',
      fontWeight: '600',
      marginRight: '0.5rem'
    },
    select: {
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '0.4rem 0.8rem',
      fontSize: '0.9rem',
      backgroundColor: 'white'
    },
    tableGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '2rem',
      marginTop: '1.5rem'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'white'
    },
    tableHeader: {
      backgroundColor: '#fef3c7',
      textAlign: 'left',
      padding: '0.75rem',
      fontWeight: '600',
      borderBottom: '1px solid #e0e0e0'
    },
    tableHeaderRight: {
      backgroundColor: '#fef3c7',
      textAlign: 'right',
      padding: '0.75rem',
      fontWeight: '600',
      borderBottom: '1px solid #e0e0e0'
    },
    tableCellLeft: {
      padding: '0.75rem',
      backgroundColor: '#fffbeb',
      borderBottom: '1px solid #f0f0f0'
    },
    tableCellRight: {
      padding: '0.75rem',
      textAlign: 'right',
      backgroundColor: '#fffbeb',
      borderBottom: '1px solid #f0f0f0'
    },
    tableCellBold: {
      padding: '0.75rem',
      backgroundColor: '#fde68a',
      fontWeight: 'bold',
      borderBottom: '1px solid #e0e0e0'
    },
    tableCellBoldRight: {
      padding: '0.75rem',
      textAlign: 'right',
      backgroundColor: '#fde68a',
      fontWeight: 'bold',
      borderBottom: '1px solid #e0e0e0'
    },
    summaryTable: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'white',
      marginTop: '1rem'
    },
    summaryHeader: {
      backgroundColor: '#d97706',
      color: 'white',
      textAlign: 'center',
      padding: '0.875rem',
      fontWeight: '600',
      fontSize: '0.95rem'
    },
    summaryCell: {
      padding: '0.875rem',
      textAlign: 'center',
      borderBottom: '1px solid #e0e0e0',
      fontSize: '0.95rem'
    }
  };

  const customLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#333"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '0.85rem', fontWeight: '600' }}
      >
        {`${name}`}
        <tspan x={x} dy="1.2em" style={{ fontSize: '0.8rem' }}>
          {`${value.toLocaleString()} (${(percent * 100).toFixed(2)}%)`}
        </tspan>
      </text>
    );
  };

  return (
    <div style={styles.container}>
      {/* Target Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 
            style={{
              ...styles.sectionTitle, 
              cursor: 'pointer', 
              userSelect: 'none',
              outline: 'none',
              textDecoration: 'none',
              color: '#E87722'
            }}
            onClick={() => setSectionExpanded({...sectionExpanded, target: !sectionExpanded.target})}
          >
            2030 GHG (Scope 1 & 2) Reduction Target <span style={styles.arrow}>{sectionExpanded.target ? '▼' : '▶'}</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={styles.reportingText}>Reporting</span>
            <select 
              value={comparisonYear} 
              onChange={(e) => setComparisonYear(e.target.value)} 
              style={{...styles.select, fontWeight: 'bold'}}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

       {sectionExpanded.target && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#fff",
      padding: "1.5rem 2rem",
      borderRadius: "6px",
      gap: "2rem",
    }}
  >
    {/* LEFT SIDE TEXT SECTION */}
   {/* === Scope 1 & 2 Emissions Summary (Styled like Image #1) === */}
<div
  style={{
    // backgroundColor: "#f5f5f5",
    borderRadius: "4px",
    padding: "1.8rem 2rem",
    marginBottom: "1.5rem",
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
    {/* Left label */}
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontWeight: "600",
          color: "#333",
          fontSize: "1rem",
        }}
      >
        Scope 1 & 2 Emissions (tCO₂-e)
      </div>
    </div>

    {/* 2030 Target */}
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          color: "#E87722",
          fontWeight: "600",
          fontSize: "1rem",
          marginBottom: "0.3rem",
        }}
      >
        2030 Reduction Target
      </div>
      <div
        style={{
          fontSize: "3rem",
          fontWeight: "bold",
          color: "#333",
          lineHeight: "1",
        }}
      >
        -25.0%
      </div>
    </div>

    {/* Comparison (e.g. 2024) */}
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          color: "#E87722",
          fontWeight: "600",
          fontSize: "1rem",
          marginBottom: "0.3rem",
        }}
      >
        {comparisonYear} Reduction
      </div>
      <div
        style={{
          fontSize: "3rem",
          fontWeight: "bold",
          color: totalChange < 0 ? "#16a34a" : "#dc2626",
          lineHeight: "1",
        }}
      >
        {totalPercentChange}%
      </div>
    </div>
  </div>
</div>


    {/* RIGHT SIDE CHART */}
    <div style={{ flex: 2, paddingLeft: "1rem" }}>
      <div
        style={{
          color: "#E87722",
          fontSize: "0.9rem",
          fontWeight: "600",
          textAlign: "center",
          marginBottom: "0.5rem",
        }}
      >
        Actual vs Target GHG Scope 1 & 2 Emissions for MGM{" "}
        {selectedSite === "All"
          ? "ALL SITES"
          : selectedSite === "Macho"
          ? "MACAU"
          : "COTAI"}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={processedData.filter((d) => d.year <= 2030)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={{ stroke: "#ccc" }} />
          <YAxis
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: "#ccc" }}
            label={{
              value: "Scope 1 & 2 GHG Emissions (tCO₂-e)",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11 },
            }}
          />
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} iconType="square" />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#E87722"
            strokeWidth={2.5}
            name="Actual"
            dot={{ fill: "#E87722", r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#20B2AA"
            strokeWidth={2.5}
            name="Target"
            dot={{ fill: "#20B2AA", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
)}

      </div>

      {/* Pie Charts Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 
            style={{
              ...styles.sectionTitle, 
              cursor: 'pointer', 
              userSelect: 'none',
              outline: 'none',
              textDecoration: 'none',
              color: '#E87722'
            }}
            onClick={() => setSectionExpanded({...sectionExpanded, breakdown: !sectionExpanded.breakdown})}
          >
            GHG Emissions Breakdown Comparison <span style={styles.arrow}>{sectionExpanded.breakdown ? '▼' : '▶'}</span>
          </h3>
          <div style={styles.selectContainer}>
            <div>
              <label style={styles.selectLabel}>Baseline Year</label>
              <select value={baselineYear} onChange={(e) => setBaselineYear(e.target.value)} style={styles.select}>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={styles.selectLabel}>Comparison Year</label>
              <select value={comparisonYear} onChange={(e) => setComparisonYear(e.target.value)} style={styles.select}>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {sectionExpanded.breakdown && (
        <div style={styles.pieSection}>
          <div style={styles.pieGrid}>
            {/* Baseline Pie Chart */}
            <div style={styles.pieChartContainer}>
              <div style={{...styles.chartTitle, marginBottom: '1rem'}}>
                Baseline {baselineYear} GHG Emissions Breakdown by Scope
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span><span style={{ color: '#E87722', fontSize: '1.2rem' }}>■</span> Scope 1 Emissions</span>
                <span><span style={{ color: '#FFD93D', fontSize: '1.2rem' }}>■</span> Scope 2 Emissions</span>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={baselinePieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    label={customLabel}
                    labelLine={{ stroke: '#999', strokeWidth: 1 }}
                  >
                    {baselinePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison Pie Chart */}
            <div style={styles.pieChartContainer}>
              <div style={{...styles.chartTitle, marginBottom: '1rem'}}>
                Comparison {comparisonYear} GHG Emissions Breakdown by Scope
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span><span style={{ color: '#E87722', fontSize: '1.2rem' }}>■</span> Scope 1 Emissions</span>
                <span><span style={{ color: '#FFD93D', fontSize: '1.2rem' }}>■</span> Scope 2 Emissions</span>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={comparisonPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    label={customLabel}
                    labelLine={{ stroke: '#999', strokeWidth: 1 }}
                  >
                    {comparisonPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Tables */}
          <div style={styles.tableGrid}>
            {/* Baseline Table */}
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Description</th>
                  <th style={styles.tableHeaderRight}>tCO₂-e</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  style={{ cursor: 'pointer', backgroundColor: '#fffbeb' }}
                  onClick={() => {
                    console.log("Clicked Baseline Scope 1");
                    setExpandedBaseline({...expandedBaseline, scope1: !expandedBaseline.scope1});
                  }}
                >
                  <td style={{...styles.tableCellLeft, userSelect: 'none'}}>
                    <span style={{ marginRight: '8px', display: 'inline-block', width: '12px' }}>
                      {expandedBaseline.scope1 ? '▼' : '▶'}
                    </span>
                    Scope 1 Emissions
                  </td>
                  <td style={styles.tableCellRight}>{baseline.scope1.toLocaleString()}</td>
                </tr>
                {expandedBaseline.scope1 && detailedData[baselineYear] && (
                  <>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '2.5rem', fontSize: '0.9rem' }}>
                        Stationary Combustion Sources
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[baselineYear].scope1Details.stationaryCombustion.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Natural Gas
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[baselineYear].scope1Details.naturalGas.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        LPG
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[baselineYear].scope1Details.lpg.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Diesel
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[baselineYear].scope1Details.diesel.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '2.5rem', fontSize: '0.9rem' }}>
                        Mobile Combustion Sources
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[baselineYear].scope1Details.mobileCombustion.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Gasoline Vehicle
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[baselineYear].scope1Details.gasolineVehicle.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Diesel Vehicle
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[baselineYear].scope1Details.dieselVehicle.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '2.5rem', fontSize: '0.9rem' }}>
                        Fugitive Emissions
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[baselineYear].scope1Details.fugitiveEmissions.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Refrigerant (R-134a)
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[baselineYear].scope1Details.refrigerantR134a.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Refrigerant (R-404a)
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[baselineYear].scope1Details.refrigerantR404a.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Refrigerant (R-410a)
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[baselineYear].scope1Details.refrigerantR410a.toLocaleString()}</td>
                    </tr>
                  </>
                )}
                <tr 
                  style={{ cursor: 'pointer', backgroundColor: '#fffbeb' }}
                  onClick={() => {
                    console.log("Clicked Baseline Scope 2");
                    setExpandedBaseline({...expandedBaseline, scope2: !expandedBaseline.scope2});
                  }}
                >
                  <td style={{...styles.tableCellLeft, userSelect: 'none'}}>
                    <span style={{ marginRight: '8px', display: 'inline-block', width: '12px' }}>
                      {expandedBaseline.scope2 ? '▼' : '▶'}
                    </span>
                    Scope 2 Emissions
                  </td>
                  <td style={styles.tableCellRight}>{baseline.scope2.toLocaleString()}</td>
                </tr>
                {expandedBaseline.scope2 && detailedData[baselineYear] && (
                  <tr style={{ backgroundColor: '#fefce8' }}>
                    <td style={{ ...styles.tableCellLeft, paddingLeft: '2.5rem', fontSize: '0.9rem' }}>
                      Electricity Purchased
                    </td>
                    <td style={styles.tableCellRight}>{detailedData[baselineYear].scope2Details.electricityPurchased.toLocaleString()}</td>
                  </tr>
                )}
                <tr>
                  <td style={styles.tableCellBold}>Overall Total Emissions</td>
                  <td style={styles.tableCellBoldRight}>{baseline.total.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={styles.tableCellBold}>GHG Intensity (tCO₂-e/m²)</td>
                  <td style={styles.tableCellBoldRight}>{baseline.intensity}</td>
                </tr>
              </tbody>
            </table>

            {/* Comparison Table */}
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Description</th>
                  <th style={styles.tableHeaderRight}>tCO₂-e</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  style={{ cursor: 'pointer', backgroundColor: '#fffbeb' }}
                  onClick={() => {
                    console.log("Clicked Comparison Scope 1");
                    setExpandedComparison({...expandedComparison, scope1: !expandedComparison.scope1});
                  }}
                >
                  <td style={{...styles.tableCellLeft, userSelect: 'none'}}>
                    <span style={{ marginRight: '8px', display: 'inline-block', width: '12px' }}>
                      {expandedComparison.scope1 ? '▼' : '▶'}
                    </span>
                    Scope 1 Emissions
                  </td>
                  <td style={styles.tableCellRight}>{comparison.scope1.toLocaleString()}</td>
                </tr>
                {expandedComparison.scope1 && detailedData[comparisonYear] && (
                  <>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '2.5rem', fontSize: '0.9rem' }}>
                        Stationary Combustion Sources
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[comparisonYear].scope1Details.stationaryCombustion.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Natural Gas
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[comparisonYear].scope1Details.naturalGas.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        LPG
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[comparisonYear].scope1Details.lpg.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Diesel
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[comparisonYear].scope1Details.diesel.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '2.5rem', fontSize: '0.9rem' }}>
                        Mobile Combustion Sources
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[comparisonYear].scope1Details.mobileCombustion.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Gasoline Vehicle
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[comparisonYear].scope1Details.gasolineVehicle.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Diesel Vehicle
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[comparisonYear].scope1Details.dieselVehicle.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '2.5rem', fontSize: '0.9rem' }}>
                        Fugitive Emissions
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[comparisonYear].scope1Details.fugitiveEmissions.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Refrigerant (R-134a)
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[comparisonYear].scope1Details.refrigerantR134a.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Refrigerant (R-404a)
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[comparisonYear].scope1Details.refrigerantR404a.toLocaleString()}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fefce8' }}>
                      <td style={{ ...styles.tableCellLeft, paddingLeft: '3.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Refrigerant (R-410a)
                      </td>
                      <td style={styles.tableCellRight}>{detailedData[comparisonYear].scope1Details.refrigerantR410a.toLocaleString()}</td>
                    </tr>
                  </>
                )}
                <tr 
                  style={{ cursor: 'pointer', backgroundColor: '#fffbeb' }}
                  onClick={() => {
                    console.log("Clicked Comparison Scope 2");
                    setExpandedComparison({...expandedComparison, scope2: !expandedComparison.scope2});
                  }}
                >
                  <td style={{...styles.tableCellLeft, userSelect: 'none'}}>
                    <span style={{ marginRight: '8px', display: 'inline-block', width: '12px' }}>
                      {expandedComparison.scope2 ? '▼' : '▶'}
                    </span>
                    Scope 2 Emissions
                  </td>
                  <td style={styles.tableCellRight}>{comparison.scope2.toLocaleString()}</td>
                </tr>
                {expandedComparison.scope2 && detailedData[comparisonYear] && (
                  <tr style={{ backgroundColor: '#fefce8' }}>
                    <td style={{ ...styles.tableCellLeft, paddingLeft: '2.5rem', fontSize: '0.9rem' }}>
                      Electricity Purchased
                    </td>
                    <td style={styles.tableCellRight}>{detailedData[comparisonYear].scope2Details.electricityPurchased.toLocaleString()}</td>
                  </tr>
                )}
                <tr>
                  <td style={styles.tableCellBold}>Overall Total Emissions</td>
                  <td style={styles.tableCellBoldRight}>{comparison.total.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={styles.tableCellBold}>GHG Intensity (tCO₂-e/m²)</td>
                  <td style={styles.tableCellBoldRight}>{comparison.intensity}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* Change Summary Section */}
      <div style={styles.section}>
        <h3 
          style={{
            ...styles.sectionTitle, 
            cursor: 'pointer', 
            userSelect: 'none',
            outline: 'none',
            textDecoration: 'none',
            color: '#E87722'
          }}
          onClick={() => setSectionExpanded({...sectionExpanded, changeSummary: !sectionExpanded.changeSummary})}
        >
          GHG Emissions Change Summary <span style={styles.arrow}>{sectionExpanded.changeSummary ? '▼' : '▶'}</span>
        </h3>
        {sectionExpanded.changeSummary && (
        <table style={styles.summaryTable}>
          <thead>
            <tr>
              <th style={styles.summaryHeader}>{baselineYear} vs {comparisonYear}</th>
              <th style={styles.summaryHeader}>Absolute Change</th>
              <th style={styles.summaryHeader}>% Change</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.summaryCell}>Scope 1 (tCO₂-e)</td>
              <td style={styles.summaryCell}>{scope1Change.toFixed(1)}</td>
              <td style={styles.summaryCell}>{scope1PercentChange}%</td>
            </tr>
            <tr>
              <td style={styles.summaryCell}>Scope 2 (tCO₂-e)</td>
              <td style={styles.summaryCell}>{scope2Change.toFixed(1)}</td>
              <td style={styles.summaryCell}>{scope2PercentChange}%</td>
            </tr>
            <tr>
              <td style={styles.summaryCell}>Total GHG (tCO₂-e)</td>
              <td style={styles.summaryCell}>{totalChange.toFixed(1)}</td>
              <td style={styles.summaryCell}>{totalPercentChange}%</td>
            </tr>
            <tr>
              <td style={styles.summaryCell}>GHG Intensity (tCO₂-e/m²)</td>
              <td style={styles.summaryCell}>{intensityChange.toFixed(3)}</td>
              <td style={styles.summaryCell}>{intensityPercentChange}%</td>
            </tr>
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

export default CarbonEmissionsDashboard;