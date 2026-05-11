




import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import GaugeChart from "react-gauge-chart";
import { RadialBarChart, RadialBar } from "recharts";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  LineChart,
} from "recharts";

const MacauChillerDashboard = () => {
  const [consumptionData, setConsumptionData] = useState([]);
  const [baselineConsumptionData, setBaselineConsumptionData] = useState([]);
  const [reportingConsumptionData, setReportingConsumptionData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [baselinePerformanceData, setBaselinePerformanceData] = useState([]);
  const [reportingPerformanceData, setReportingPerformanceData] = useState([]);
  const [coolingDemandData, setCoolingDemandData] = useState([]);
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedMonth, setSelectedMonth] = useState("January");
  const [baselineYear, setBaselineYear] = useState("2024");
  const [reportingYear, setReportingYear] = useState("2025");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Months list
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];


const chillerMiniData = [
  { id: "CH-1", loading: 81, cop: 4.3 },
  { id: "CH-2", loading: null, cop: null },   // "-" case
  { id: "CH-3", loading: 73, cop: 4.0 },
  { id: "CH-4", loading: 100, cop: 5.0 },
  { id: "CH-5", loading: null, cop: null },
  { id: "CH-6", loading: 100, cop: 5.2 },
  { id: "CH-7", loading: 73, cop: 4.1 },
  { id: "CH-8", loading: 81, cop: 4.5 },
  { id: "CH-9", loading: 100, cop: 5.3 },
  { id: "CH-10", loading: 73, cop: 4.0 },
];



  // Fetch Baseline Consumption Data
  useEffect(() => {
    const fetchConsumptionData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const fileName = `Monthly Consumption ${baselineYear}.csv`;
        const filePath = `/Data/macau/${fileName}`;

        console.log("Fetching baseline consumption data from:", filePath);

        const response = await fetch(filePath);

        if (!response.ok) {
          throw new Error(`Failed to load ${fileName}`);
        }

        const text = await response.text();

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            if (result.data && result.data.length > 0) {
              console.log("✅ Baseline consumption data loaded:", result.data.length);
              setBaselineConsumptionData(result.data);
              setErrorMessage("");
            }
          },
          error: (err) => {
            throw new Error(`CSV parsing failed: ${err.message}`);
          },
        });
      } catch (err) {
        console.error("❌ Error:", err.message);
        setErrorMessage(`❌ ${err.message}`);
        setBaselineConsumptionData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConsumptionData();
  }, [baselineYear]);

  // Fetch Reporting Consumption Data
  useEffect(() => {
    const fetchConsumptionData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const fileName = `Monthly Consumption ${reportingYear}.csv`;
        const filePath = `/Data/macau/${fileName}`;

        console.log("Fetching reporting consumption data from:", filePath);

        const response = await fetch(filePath);

        if (!response.ok) {
          throw new Error(`Failed to load ${fileName}`);
        }

        const text = await response.text();

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            if (result.data && result.data.length > 0) {
              console.log("✅ Reporting consumption data loaded:", result.data.length);
              setReportingConsumptionData(result.data);
              setErrorMessage("");
            }
          },
          error: (err) => {
            throw new Error(`CSV parsing failed: ${err.message}`);
          },
        });
      } catch (err) {
        console.error("❌ Error:", err.message);
        setErrorMessage(`❌ ${err.message}`);
        setReportingConsumptionData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConsumptionData();
  }, [reportingYear]);

  // Fetch Baseline Performance Data
  useEffect(() => {
    const fetchBaselinePerformanceData = async () => {
      try {
        const fileName = `Monthly Performance Comparison ${baselineYear}.csv`;
        const filePath = `/Data/macau/${fileName}`;

        const response = await fetch(filePath);

        if (!response.ok) {
          console.log("⚠️ Baseline performance data not found");
          return;
        }

        const text = await response.text();

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            if (result.data && result.data.length > 0) {
              console.log("✅ Baseline performance data loaded:", result.data.length);
              setBaselinePerformanceData(result.data);
            }
          },
          error: (err) => {
            console.error("❌ Error parsing CSV:", err.message);
          },
        });
      } catch (err) {
        console.error("❌ Error:", err.message);
      }
    };

    fetchBaselinePerformanceData();
  }, [baselineYear]);

  // Fetch Reporting Performance Data
  useEffect(() => {
    const fetchReportingPerformanceData = async () => {
      try {
        const fileName = `Monthly Performance Comparison ${reportingYear}.csv`;
        const filePath = `/Data/macau/${fileName}`;

        const response = await fetch(filePath);

        if (!response.ok) {
          console.log("⚠️ Reporting performance data not found");
          return;
        }

        const text = await response.text();

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            if (result.data && result.data.length > 0) {
              console.log("✅ Reporting performance data loaded:", result.data.length);
              setReportingPerformanceData(result.data);
            }
          },
          error: (err) => {
            console.error("❌ Error parsing CSV:", err.message);
          },
        });
      } catch (err) {
        console.error("❌ Error:", err.message);
      }
    };

    fetchReportingPerformanceData();
  }, [reportingYear]);

  // Fetch Cooling Demand Data (Hourly) - from reporting year
  useEffect(() => {
    const fetchCoolingDemandData = async () => {
      try {
        const fileName = `Cooling Demand ${reportingYear}-${selectedMonth.padStart(2, '0')}.csv`;
        const filePath = `/Data/macau/${fileName}`;

        const response = await fetch(filePath);

        if (!response.ok) {
          // If file not found, use sample data
          console.log("⚠️ Cooling demand data not found, using placeholder");
          setSampleCoolingDemandData();
          return;
        }

        const text = await response.text();

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            if (result.data && result.data.length > 0) {
              console.log("✅ Cooling demand data loaded:", result.data.length);
              const processed = result.data.map((item) => ({
                time: item.time || "",
                totalCoolingDemand: parseFloat(item.totalCoolingDemand) || 0,
                outdoorTemp: parseFloat(item.outdoorTemp) || 0,
              }));
              setCoolingDemandData(processed);
            }
          },
          error: (err) => {
            console.error("❌ Error parsing CSV:", err.message);
            setSampleCoolingDemandData();
          },
        });
      } catch (err) {
        console.error("❌ Error:", err.message);
        setSampleCoolingDemandData();
      }
    };

    fetchCoolingDemandData();
  }, [reportingYear, selectedMonth]);

  // Sample Cooling Demand Data (Placeholder)
  const setSampleCoolingDemandData = () => {
    const sampleData = [];
    for (let hour = 0; hour < 24; hour++) {
      sampleData.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        totalCoolingDemand: 1500 + Math.random() * 800 + (Math.sin(hour / 24 * Math.PI * 2) * 400),
        outdoorTemp: 26 + Math.sin(hour / 24 * Math.PI * 2) * 4,
      });
    }
    setCoolingDemandData(sampleData);
  };

  // Get current month data
  const currentReportingConsumption = reportingConsumptionData.find(
    (item) => item.month === selectedMonth
  ) || {};

  const currentPerformance = performanceData.find(
    (item) => item.month === selectedMonth
  ) || {};

  const avgCOP = parseFloat(currentReportingConsumption.cop) || 0;
  const totalConsumption = (
    parseFloat(currentReportingConsumption.chiller) +
    parseFloat(currentReportingConsumption.chwp) +
    parseFloat(currentReportingConsumption.cdwp) +
    parseFloat(currentReportingConsumption.ct)
  ).toFixed(0);

  // Process data for monthly consumption chart - combine baseline and reporting with TOTAL consumption
  const processedConsumptionData = months.map((month) => {
    const baselineData = baselineConsumptionData.find((item) => item.month === month) || {};
    const reportingData = reportingConsumptionData.find((item) => item.month === month) || {};

    // Calculate totals for baseline
    const baselineTotal = 
      (parseFloat(baselineData.chiller) || 0) +
      (parseFloat(baselineData.chwp) || 0) +
      (parseFloat(baselineData.cdwp) || 0) +
      (parseFloat(baselineData.ct) || 0);

    // Calculate totals for reporting
    const reportingTotal = 
      (parseFloat(reportingData.chiller) || 0) +
      (parseFloat(reportingData.chwp) || 0) +
      (parseFloat(reportingData.cdwp) || 0) +
      (parseFloat(reportingData.ct) || 0);

    return {
      month: month.slice(0, 3),
      // Baseline total consumption
      [`${baselineYear}_total`]: baselineTotal,
      [`${baselineYear}_cop`]: parseFloat(baselineData.cop) || 0,
      // Reporting total consumption
      [`${reportingYear}_total`]: reportingTotal,
      [`${reportingYear}_cop`]: parseFloat(reportingData.cop) || 0,
    };
  }).filter((item, index) => {
    // Only include months up to and including selected month
    const selectedMonthIndex = months.indexOf(selectedMonth);
    return index <= selectedMonthIndex;
  });

  const processedPerformanceData = performanceData.map((item) => ({
    month: item.month.slice(0, 3),
    chiller: parseFloat(item.chiller) || 0,
    chwp: parseFloat(item.chwp) || 0,
    cdwp: parseFloat(item.cdwp) || 0,
    ct: parseFloat(item.ct) || 0,
  }));

  return (
    <div
      style={{
        padding: "20px 40px",
        background: "#f5f5f5",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        margin: "100px 0px 0px 80px",
      }}
    >
      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div
          style={{
            background: "#ffebee",
            border: "2px solid #f44336",
            borderRadius: "4px",
            padding: "15px",
            marginBottom: "20px",
            color: "#c62828",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          background: "#fff",
          padding: "15px 20px",
          borderRadius: "4px",
        }}
      >
        <h2 style={{ margin: 0, color: "#ff5722", fontSize: "20px" }}>
          Chiller Plant Summary - Macau
        </h2>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {/* Baseline Year */}
          <div>
            <label style={{ marginRight: "10px", fontWeight: "600" }}>
              Baseline:
            </label>
            <select
              value={baselineYear}
              onChange={(e) => setBaselineYear(e.target.value)}
              style={{
                padding: "6px 10px",
                fontSize: "14px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                marginRight: "20px",
              }}
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Month */}
          <div>
            <label style={{ marginRight: "10px", fontWeight: "600" }}>
              Month:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: "6px 10px",
                fontSize: "14px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                marginRight: "20px",
              }}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* Reporting Year */}
          <div>
            <label style={{ marginRight: "10px", fontWeight: "600" }}>
              Reporting:
            </label>
            <select
              value={reportingYear}
              onChange={(e) => setReportingYear(e.target.value)}
              style={{
                padding: "6px 10px",
                fontSize: "14px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", color: "#999", padding: "20px" }}>
          ⏳ Loading data...
        </div>
      )}

      {/* MAIN LAYOUT */}
{baselineConsumptionData.length > 0 && reportingConsumptionData.length > 0 && (
  <>


    {/* TOP ROW - COP LEFT + RIGHT SIDE STACKED */}
    <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>

      {/* LEFT CARD – COP + MINI CHILLERS */}
      <div
        style={{
          background: "#fff",
          border: "2px solid #c8a000",
          borderRadius: "8px",
          padding: "20px",
          flex: "0 0 360px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#666",
            marginBottom: "15px",
          }}
        >
          Chiller Plant COP
        </div>

        <div style={{ width: "100%", height: "200px", position: "relative" }}>
          <GaugeChart
            id="macau-plant-cop"
            nrOfLevels={500}
            arcsLength={[0.25, 0.25, 0.25, 0.25]}
            colors={["#ff3b30", "#ffcc00", "#34c759", "#007aff"]}
            percent={avgCOP ? Math.min(avgCOP / 7, 1) : 0}
            arcPadding={0}
            arcWidth={0.32}
            needleColor="#000"
            needleBaseColor="#000"
            textColor="transparent"
          />

          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "40px",
              fontWeight: "900",
              color: "#000",
            }}
          >
            {avgCOP ? avgCOP.toFixed(2) : "--"}
          </div>
        </div>

        <div style={{ margin: "15px 0 10px", borderTop: "1px solid #ddd" }} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px 10px",
            paddingTop: "5px",
          }}
        >
          {chillerMiniData.map((ch) => (
            <div key={ch.id} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", fontWeight: 600 }}>{ch.id}</div>
              <div style={{ fontSize: "9px", color: "#666", marginBottom: "4px" }}>
                % Loading
              </div>

              <div style={{ width: "60px", height: "60px", margin: "0 auto", position: "relative" }}>
                <RadialBarChart
                  width={65}
                  height={65}
                  cx="50%"
                  cy="50%"
                  innerRadius="80%"
                  outerRadius="100%"
                  barSize={8}
                  startAngle={90}
                  endAngle={-270}
                  data={[
                    {
                      name: ch.id,
                      value: ch.loading || 0,
                      fill: "#3abef9",
                    },
                  ]}
                >
                  <RadialBar minAngle={15} background clockWise dataKey="value" />
                </RadialBarChart>

                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#000",
                  }}
                >
                  {ch.loading != null ? ch.loading : "-"}
                </div>
              </div>

              <div
                style={{
                  marginTop: "4px",
                  height: "6px",
                  borderRadius: "4px",
                  background:
                    "linear-gradient(to right, #ff3b30, #ff9500, #ffcc00, #34c759)",
                }}
              />

              <div style={{ marginTop: "3px", fontSize: "9px", color: "#444", lineHeight: 1.1 }}>
                COP <br />
                <span style={{ fontWeight: 600 }}>
                  {ch.cop != null ? ch.cop.toFixed(1) : "-"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE - STACKED */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* TOP - WATER DELTA T + PERFORMANCE SIDE BY SIDE */}
        <div style={{ display: "flex", gap: "20px" }}>

          {/* WATER DELTA T CARD - EXACT MATCH TO IMAGE */}
          <div
            style={{
              background: "#fff",
              border: "2px solid #c8a000",
              borderRight: "6px solid #ff5722",
              borderRadius: "8px",
              padding: "20px",
              flex: "0 0 45%",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                marginBottom: "20px",
                color: "#333",
                textAlign: "left",
              }}
            >
              Chilled & Condenser Water Delta T
            </div>

            {[
              { label: "CHW", value: "5°C", color: "#23C7C9" },
              { label: "CDW", value: "5°C", color: "#23C7C9" },
              { label: "Approach", value: "1°C", color: "#FF5722" },
            ].map((row, i) => (
              <div key={i} style={{ marginBottom: "25px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#000", minWidth: "70px", paddingTop: "8px" }}>
                  {row.label}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ position: "relative", height: "45px", display: "flex", alignItems: "center" }}>
                    {/* Bar container */}
                    <div
                      style={{
                        width: "100%",
                        height: "22px",
                        background: "#005DAB",
                        borderRadius: "2px",
                        display: "flex",
                        alignItems: "center",
                        position: "relative",
                        overflow: "visible",
                      }}
                    >
                      {/* Left blue section (~50%) */}
                      <div
                        style={{
                          width: "50%",
                          height: "100%",
                          background: "#005DAB",
                          borderRadius: "2px 0 0 2px",
                        }}
                      />
                      
                      {/* Colored middle section (~20%) */}
                      <div
                        style={{
                          width: "20%",
                          height: "100%",
                          background: row.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: "11px",
                        }}
                      >
                        {row.value}
                      </div>
                      
                      {/* Right blue section (~30%) */}
                      <div
                        style={{
                          width: "30%",
                          height: "100%",
                          background: "#005DAB",
                          borderRadius: "0 2px 2px 0",
                        }}
                      />

                      {/* Bottom triangle at 50% mark */}
                      <div
                        style={{
                          position: "absolute",
                          left: "50%",
                          bottom: "-6px",
                          width: 0,
                          height: 0,
                          borderLeft: "5px solid transparent",
                          borderRight: "5px solid transparent",
                          borderBottom: "6px solid #999",
                        }}
                      />

                      {/* Bottom triangle at 70% mark */}
                      <div
                        style={{
                          position: "absolute",
                          left: "70%",
                          bottom: "-6px",
                          width: 0,
                          height: 0,
                          borderLeft: "5px solid transparent",
                          borderRight: "5px solid transparent",
                          borderBottom: "6px solid #999",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PERFORMANCE CARD */}
          <div
            style={{
              background: "#fff",
              border: "2px solid #c8a000",
              borderRadius: "8px",
              padding: "20px",
              flex: "1",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                marginBottom: "15px",
                color: "#333",
                textAlign: "center",
              }}
            >
              Monthly Performance Comparison in kW/TR
            </div>
            <ResponsiveContainer width="100%" height={270}>
              <BarChart
                data={
                  baselinePerformanceData.length > 0 && reportingPerformanceData.length > 0
                    ? [
                        {
                          name: "Baseline",
                          chiller: parseFloat(
                            baselinePerformanceData.find((item) => item.month === selectedMonth)?.chiller || 0
                          ),
                          chwp: parseFloat(
                            baselinePerformanceData.find((item) => item.month === selectedMonth)?.chwp || 0
                          ),
                          cdwp: parseFloat(
                            baselinePerformanceData.find((item) => item.month === selectedMonth)?.cdwp || 0
                          ),
                          ct: parseFloat(
                            baselinePerformanceData.find((item) => item.month === selectedMonth)?.ct || 0
                          ),
                        },
                        {
                          name: "Reporting",
                          chiller: parseFloat(
                            reportingPerformanceData.find((item) => item.month === selectedMonth)?.chiller || 0
                          ),
                          chwp: parseFloat(
                            reportingPerformanceData.find((item) => item.month === selectedMonth)?.chwp || 0
                          ),
                          cdwp: parseFloat(
                            reportingPerformanceData.find((item) => item.month === selectedMonth)?.cdwp || 0
                          ),
                          ct: parseFloat(
                            reportingPerformanceData.find((item) => item.month === selectedMonth)?.ct || 0
                          ),
                        },
                      ]
                    : [
                        { name: "No Data", chiller: 0, chwp: 0, cdwp: 0, ct: 0 },
                      ]
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: "kW/TR", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="chiller" stackId="a" fill="#1976d2" name="Chiller" />
                <Bar dataKey="chwp" stackId="a" fill="#00bcd4" name="CHWP" />
                <Bar dataKey="cdwp" stackId="a" fill="#ff9800" name="CDWP" />
                <Bar dataKey="ct" stackId="a" fill="#8bc34a" name="CT" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM - MONTHLY CONSUMPTION CHART */}
        <div
          style={{
            background: "#fff",
            border: "2px solid #c8a000",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#333", fontSize: "13px", fontWeight: "bold", textAlign: "center" }}>
            Monthly Consumption in kWh
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={processedConsumptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              
              {/* Total Consumption Bars */}
              <Bar yAxisId="left" dataKey={`${baselineYear}_total`} fill="#1976d2" name={`${baselineYear} Consumption`} />
              <Bar yAxisId="left" dataKey={`${reportingYear}_total`} fill="#ff9800" name={`${reportingYear} Consumption`} />
              
              {/* COP Lines */}
              <Line yAxisId="right" type="monotone" dataKey={`${baselineYear}_cop`} stroke="#000000" strokeWidth={2} name={`${baselineYear} COP`} dot={{ r: 2 }} />
              <Line yAxisId="right" type="monotone" dataKey={`${reportingYear}_cop`} stroke="#f44336" strokeWidth={2} name={`${reportingYear} COP`} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>


    {/* COOLING DEMAND SECTION */}
    <div style={{ marginTop: "20px" }}>
      <div
        style={{
          background: "#fff",
          border: "2px solid #c8a000",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "15px",
            color: "#333",
            textAlign: "center",
          }}
        >
          Cooling Demand
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={coolingDemandData || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: "kW", angle: -90, position: "insideLeft" }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: "°C", angle: 90, position: "insideRight" }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar yAxisId="left" dataKey="totalCoolingDemand" fill="#00bcd4" name="Total Cooling Demand" />
            <Line yAxisId="right" type="monotone" dataKey="outdoorTemp" stroke="#ff5722" strokeWidth={2} name="Outdoor Air Dry-bulb Temperature" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>

  </>
)}

    </div>
  );
};

export default MacauChillerDashboard;