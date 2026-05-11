



import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import GaugeChart from "react-gauge-chart";
import { AlertTriangle } from "lucide-react";

const SensorMonitoring = () => {
  const [selectedSite, setSelectedSite] = useState("Cotai");
  const [summary, setSummary] = useState({ Macau: {}, Cotai: {} });
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [totalSensors, setTotalSensors] = useState(0);
  const [issues, setIssues] = useState(0);
  const [loading, setLoading] = useState(false);

  // Toggle states for visibility
  const [showSummary, setShowSummary] = useState(true);
  const [showAlarmConsole, setShowAlarmConsole] = useState(true);

  // Dropdown filters
  const [alarmType, setAlarmType] = useState("All");
  const [pointType, setPointType] = useState("All");
  const [pointStatus, setPointStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("asc");

  // Listen for site change from external selector
  useEffect(() => {
    const handleSiteChange = () => {
      const site = localStorage.getItem("selectedSite") || "All";
      setSelectedSite(site);
    };
    window.addEventListener("siteChange", handleSiteChange);
    return () => window.removeEventListener("siteChange", handleSiteChange);
  }, []);

  const parseCSV = (csvText) =>
    new Promise((resolve, reject) => {
      let lines = csvText.split("\n");
      if (lines[0].toLowerCase().includes('ver:"3.0"')) lines = lines.slice(1);
      const cleanedCSV = lines.join("\n");
      Papa.parse(cleanedCSV, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      });
    });

  const fetchAlertConfig = async (site) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BE_URL}/api/skyspark/alertConfig/${site}`, {
        credentials: "include",
      });
      if (!response.ok) return [];

      const csvText = await response.text();
      const parsedData = await parseCSV(csvText);

      const toBool = (value) => {
        if (typeof value === "boolean") return value;
        const s = String(value).trim().toLowerCase();
        return ["true", "t", "1", "yes"].includes(s);
      };

      const mappedAlerts = parsedData.map((row) => ({
        PointName: row.sensorName || row.point || "N/A",
        AlarmType: row.category || "N/A",
        LastValue: row.lastValue || "N/A",
        Equip: row.equip || "-",
        LastCommunication: row.lastUpdate ? formatDate(row.lastUpdate) : "N/A",
        Location: row.areaServed || "-",
        Site: site,
        RawSite: site,
        IsAlarm: toBool(row.isAlarm),
        PointType: row.pointType || "Temperature",
        Status: row.status || (toBool(row.isAlarm) ? "Not OK" : "OK"),
      }));
      return mappedAlerts;
    } catch (error) {
      console.error("Error fetching alert config:", error);
      return [];
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString.split(" ")[0]);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [macauRes, cotaiRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BE_URL}/api/skyspark/summary/Macau`, { credentials: "include" }),
        fetch(`${process.env.REACT_APP_BE_URL}/api/skyspark/summary/Cotai`, { credentials: "include" }),
      ]);
      const macauData = await macauRes.json();
      const cotaiData = await cotaiRes.json();
      setSummary({ Macau: macauData, Cotai: cotaiData });

      // Total number of sensors
      const totalSensors = macauData.Total + cotaiData.Total;
      setTotalSensors(totalSensors);

      const [macauAlerts, cotaiAlerts] = await Promise.all([
        fetchAlertConfig("Macau"),
        fetchAlertConfig("Cotai"),
      ]);
      const allAlerts = [...macauAlerts, ...cotaiAlerts];

      // Only show alerts with active alarms
      const alarmAlerts = allAlerts.filter((alert) => alert.IsAlarm);

      setAlerts(alarmAlerts);
      setFilteredAlerts(alarmAlerts);
      setIssues(alarmAlerts.length);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logic (includes site-based filtering)
  useEffect(() => {
    let normalizedSite = selectedSite?.toLowerCase().trim() === "macho" ? "Macau" : selectedSite;

    let filtered = alerts;

    // Filter by selected site
    if (normalizedSite && normalizedSite !== "All") {
      filtered = filtered.filter(
        (a) =>
          a.RawSite?.toLowerCase().trim() === normalizedSite.toLowerCase().trim()
      );
    }

    // Apply dropdown filters
    if (alarmType !== "All") filtered = filtered.filter((a) => a.AlarmType === alarmType);
    if (pointType !== "All") filtered = filtered.filter((a) => a.PointType === pointType);
    if (pointStatus !== "All") filtered = filtered.filter((a) => a.Status === pointStatus);

    // Apply sorting
    filtered = filtered.sort((a, b) =>
      sortOrder === "asc"
        ? a.PointName.localeCompare(b.PointName)
        : b.PointName.localeCompare(a.PointName)
    );

    setFilteredAlerts(filtered);
  }, [selectedSite, alarmType, pointType, pointStatus, sortOrder, alerts]);

  // ✅ FIX: Correctly calculate which sites to display
  const displaySitesData = () => {
    const normalizedSite = selectedSite?.toLowerCase().trim() === "macho" ? "Macau" : selectedSite;

    if (normalizedSite === "All") {
      // Show both sites
      return {
        showCotai: true,
        showMacau: true,
        showTotal: true,
      };
    } else if (normalizedSite.toLowerCase() === "cotai") {
      // Show only Cotai
      return {
        showCotai: true,
        showMacau: false,
        showTotal: false,
      };
    } else if (normalizedSite.toLowerCase() === "macau") {
      // Show only Macau
      return {
        showCotai: false,
        showMacau: true,
        showTotal: false,
      };
    }
  };

  const displaySettings = displaySitesData();

  const totalBySite = {
    Macau: {
      Temperature: summary.Macau?.Temperature || 0,
      Irradiance: summary.Macau?.Irradiance || 0,
    },
    Cotai: {
      Temperature: summary.Cotai?.Temperature || 0,
      Irradiance: summary.Cotai?.Irradiance || 0,
    },
  };

  const combinedTotals = {
    Temperature: totalBySite.Macau.Temperature + totalBySite.Cotai.Temperature,
    Irradiance: totalBySite.Macau.Irradiance + totalBySite.Cotai.Irradiance,
  };

  const alarmsWithIssues = filteredAlerts.filter(alert => alert.IsAlarm).length;

  return (
    <div
      style={{
        backgroundColor: "#f4f4f4",
        minHeight: "100vh",
        padding: "100px 60px 40px 80px",
        fontFamily: "Arial, sans-serif",
        margin: "10px 0px 0px 00px"
      }}
    >
      {/* HEADER with Toggle Buttons */}
      <div
        style={{
          background: "#fff",
          padding: "10px 20px",
          border: "2px solid #b9935a",
          borderBottom: "none",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "15px",
        }}
      >
        {/* Refresh Icon */}
        <span
          style={{
            cursor: "pointer",
            fontSize: "20px",
            opacity: loading ? 0.5 : 1,
            marginRight: "10px",
          }}
          onClick={() => loadData()}
          title="Refresh Data"
        >
          ↻
        </span>

        {/* Show Summary Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontSize: "13px", fontWeight: "bold", color: "#333" }}>
            Show Summary
          </span>
          <button
            onClick={() => setShowSummary(true)}
            style={{
              padding: "5px 15px",
              border: "1px solid #999",
              background: showSummary ? "#b9935a" : "#e0e0e0",
              color: showSummary ? "#fff" : "#666",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
              borderRadius: "3px",
            }}
          >
            Enable
          </button>
          <button
            onClick={() => setShowSummary(false)}
            style={{
              padding: "5px 15px",
              border: "1px solid #999",
              background: !showSummary ? "#b9935a" : "#e0e0e0",
              color: !showSummary ? "#fff" : "#666",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
              borderRadius: "3px",
            }}
          >
            Disable
          </button>
        </div>

        {/* Show Alarm Console Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontSize: "13px", fontWeight: "bold", color: "#333" }}>
            Show Alarm Console
          </span>
          <button
            onClick={() => setShowAlarmConsole(true)}
            style={{
              padding: "5px 15px",
              border: "1px solid #999",
              background: showAlarmConsole ? "#b9935a" : "#e0e0e0",
              color: showAlarmConsole ? "#fff" : "#666",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
              borderRadius: "3px",
            }}
          >
            Enable
          </button>
          <button
            onClick={() => setShowAlarmConsole(false)}
            style={{
              padding: "5px 15px",
              border: "1px solid #999",
              background: !showAlarmConsole ? "#b9935a" : "#e0e0e0",
              color: !showAlarmConsole ? "#fff" : "#666",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
              borderRadius: "3px",
            }}
          >
            Disable
          </button>
        </div>
      </div>

      {/* PANEL */}
      <div style={{ background: "#fff", border: "2px solid #b9935a", padding: "0" }}>
        {/* GAUGE ROW - Conditionally Rendered */}
        {showSummary && (
          <>
            {/* ALERT SUMMARY Header */}
            <div
              style={{
                background: "#b9935a",
                color: "#fff",
                padding: "8px 15px",
                fontWeight: "bold",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              ALERT SUMMARY
            </div>

            <div style={{ display: "flex", borderBottom: "2px solid #b9935a" }}>
              {/* Left: Sensors With Issues */}
              <div
                style={{
                  flex: "1",
                  background: "#b9935a",
                  color: "white",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  borderRight: "2px solid #fff",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "15px" }}>
                  Sensors With Issues
                </div>

                <div style={{ width: "250px", maxWidth: "100%" }}>
                  <GaugeChart
                    id="sensor-issues-gauge"
                    nrOfLevels={20}
                    colors={["#4caf50", "#ff9800", "#f44336"]}
                    percent={totalSensors ? alarmsWithIssues / totalSensors : 0}
                    arcWidth={0.3}
                    textColor="#fff"
                    formatTextValue={() => `${alarmsWithIssues} / ${totalSensors}`}
                    needleColor="#fff"
                    arcPadding={0.02}
                  />
                </div>
              </div>

              {/* Right: Point Types with Issues - ✅ FIX: Show only selected site data */}
              <div
                style={{
                  flex: "1",
                  background: "#e8e8e8",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                    textAlign: "center",
                    marginBottom: "15px",
                    color: "#333",
                  }}
                >
                  Point Types with Issues
                </div>

                <table
                  style={{
                    width: "100%",
                    fontSize: "14px",
                    color: "#333",
                    textAlign: "center",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ padding: "5px", textAlign: "right" }}></th>
                      <th style={{ padding: "5px", fontWeight: "bold" }}>Temperature</th>
                      <th style={{ padding: "5px", fontWeight: "bold" }}>Irradiance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displaySettings.showCotai && (
                      <tr>
                        <td style={{ padding: "5px", textAlign: "right", fontWeight: "bold" }}>
                          MGM Cotai
                        </td>
                        <td style={{ padding: "5px" }}>{totalBySite.Cotai.Temperature}</td>
                        <td style={{ padding: "5px" }}>{totalBySite.Cotai.Irradiance}</td>
                      </tr>
                    )}
                    {displaySettings.showMacau && (
                      <tr>
                        <td style={{ padding: "5px", textAlign: "right", fontWeight: "bold" }}>
                          MGM Macau
                        </td>
                        <td style={{ padding: "5px" }}>{totalBySite.Macau.Temperature}</td>
                        <td style={{ padding: "5px" }}>{totalBySite.Macau.Irradiance}</td>
                      </tr>
                    )}
                    {displaySettings.showTotal && (
                      <>
                        <tr>
                          <td colSpan="3" style={{ padding: "8px 5px", borderTop: "2px solid #999" }}></td>
                        </tr>
                        <tr>
                          <td style={{ padding: "5px", textAlign: "right", fontWeight: "bold" }}>
                            TOTAL
                          </td>
                          <td style={{ padding: "5px", fontWeight: "bold" }}>
                            {combinedTotals.Temperature}
                          </td>
                          <td style={{ padding: "5px", fontWeight: "bold" }}>
                            {combinedTotals.Irradiance}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ALARM CONSOLE - Conditionally Rendered */}
        {showAlarmConsole && (
          <div style={{ padding: "20px" }}>
            {/* DROPDOWN FILTERS ROW */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
                fontWeight: "bold",
                color: "#b36b00",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >
              <label>
                Alarm Type Selection{" "}
                <select
                  value={alarmType}
                  onChange={(e) => setAlarmType(e.target.value)}
                  style={{ padding: "4px", border: "1px solid #b9935a", fontWeight: "normal" }}
                >
                  <option>All</option>
                  <option>HighTemp</option>
                  <option>LowBattery</option>
                  <option>LowTemp</option>
                  <option>PointFault</option>
                </select>
              </label>

              <label>
                Point Type Selection{" "}
                <select
                  value={pointType}
                  onChange={(e) => setPointType(e.target.value)}
                  style={{ padding: "4px", border: "1px solid #b9935a", fontWeight: "normal" }}
                >
                  <option>All</option>
                  <option>Temperature</option>
                  <option>Irradiance</option>
                  <option>Voltage</option>
                </select>
              </label>

              <label>
                Point Status Selection{" "}
                <select
                  value={pointStatus}
                  onChange={(e) => setPointStatus(e.target.value)}
                  style={{ padding: "4px", border: "1px solid #b9935a", fontWeight: "normal" }}
                >
                  <option>All</option>
                  <option>OK</option>
                  <option>Not OK</option>
                </select>
              </label>

              <label>
                Sort By{" "}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{ padding: "4px", border: "1px solid #b9935a", fontWeight: "normal" }}
                >
                  <option value="asc">Point Name - ascending</option>
                  <option value="desc">Point Name - descending</option>
                </select>
              </label>
            </div>

            <div style={{ fontSize: "13px", lineHeight: "1.8", textAlign: "center", marginBottom: "15px" }}>
              <div>
                Total Sensors: <b>{totalSensors}</b> | Sensors with Issues: <b>{issues}</b>
              </div>
            </div>

            {/* TABLE */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>Loading data...</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead style={{ background: "#f5f5f5" }}>
                  <tr>
                    <th style={{ padding: "8px", textAlign: "left" }}>Point Name</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>Alarm</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Alarm Type</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Last Value</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Equip</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Last Communication</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: "1px solid #eee",
                          backgroundColor: row.IsAlarm ? "#fff3cd" : "#fff",
                        }}
                      >
                        <td style={{ padding: "8px" }}>{row.PointName}</td>
                        <td style={{ textAlign: "center", padding: "8px" }}>
                          {row.IsAlarm && (
                            <AlertTriangle size={18} color="#ff9800" fill="#ff9800" title="Alert Active" />
                          )}
                        </td>
                        <td style={{ padding: "8px" }}>{row.AlarmType}</td>
                        <td style={{ padding: "8px" }}>{row.LastValue}</td>
                        <td style={{ padding: "8px" }}>{row.Equip}</td>
                        <td style={{ padding: "8px" }}>{row.LastCommunication}</td>
                        <td style={{ padding: "8px" }}>{row.Location}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "10px", color: "#999" }}>
                        No issues found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorMonitoring;