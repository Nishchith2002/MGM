


import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import WineSummaryGraph from '../components/WineSummaryGraph';
import CoastSummaryGraph from '../components/CoastSummaryGraph';
import GrillSummaryGraph from '../components/GrillSummaryGraph';
import ABASummaryGraph from '../components/ABASummaryGraph';

const WineCellur = () => {
  // ======= CONFIG =======
  const INSTANT_URL = `${process.env.REACT_APP_BE_URL}/proxy/skyspark/coastWine`; // AJI / Grill 58 / Coast feed (unchanged)
  const THRESHOLDS_URL = `${process.env.REACT_APP_BE_URL}/proxy/skyspark/wineCellerSummary`;


  // Display-name -> logName for thresholds lookup (unchanged)
  const ABA_NAME_TO_LOG = {
    "ABA Wine Cellar 1": "MFB22-4",
    "ABA Wine Cellar 2": "MFB22-3",
    "ABA Wine Cellar 3": "MFB22-2",
    "ABA Wine Cellar 4": "MFB22-1",
    "ABA Wine Cellar 5": "C22", // adjust if needed
  };

  // Equipment code -> ABA tile name (used only for ABA)
  const EQUIPMENT_TO_ABA_NAME = {
    "TH-0001": "ABA Wine Cellar 1",
    "TH-0002": "ABA Wine Cellar 2",
    "TH-0003": "ABA Wine Cellar 3",
    "TH-0004": "ABA Wine Cellar 4",
    "TH-0005": "ABA Wine Cellar 5",
  };

  // ======= STATE =======
  const [selectedDate, setSelectedDate] = useState(new Date("2024-07-20"));
  const [instantData, setInstantData] = useState({ ABA: [], AJI: [], 'Grill 58': [], Coast: [] });
  const [view, setView] = useState("instant"); // "instant" | "summary"
  const [thresholdsByLogName, setThresholdsByLogName] = useState({});

  // ======= STYLES =======
  const inlineCSS = `
    .status-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .badge-red  { color: #fff; background: red; }
    .badge-blue { color: #fff; background: blue; }
  `;

  // ======= HELPERS =======
  const normalizeKey = (s) => String(s || "").replace(/"/g, "").trim();

  const keyForLookup = (group, name) => {
    const n = normalizeKey(name);

    if (group === "ABA") {
      return normalizeKey(ABA_NAME_TO_LOG[n] || n).toUpperCase();
    }
    const feb = n.match(/FEB\d{2}-\d{1,2}/i);
    if (feb) return feb[0].toUpperCase();
    const mfb = n.match(/MFB\d{2}-\d{1,2}/i);
    if (mfb) return mfb[0].toUpperCase();
    const cxx = n.match(/\bC\d{2}\b/i);
    if (cxx) return cxx[0].toUpperCase();
    const parts = n.split(/\s+/);
    return (parts[parts.length - 1] || "").toUpperCase();
  };

  // ======= FETCH: thresholds (hi/low) =======
  const fetchThresholds = async () => {
    try {
      const res = await fetch(THRESHOLDS_URL, { credentials: "include" });
      const text = await res.text();
      const lines = text.trim().split(/\r?\n/);
      const headerIdx = lines.findIndex(l => /(^|,)logname(,|$)/i.test(l));
      if (headerIdx < 0) return;

      const csvBody = lines.slice(headerIdx).join("\n");
      const parsed = Papa.parse(csvBody, { header: true, skipEmptyLines: true });

      const map = {};
      (parsed.data || []).forEach(row => {
        const key = normalizeKey(row.logName || row.LogName).toUpperCase();
        const hi = Number(row.hi ?? row.HI ?? row.Hi);
        const low = Number(row.low ?? row.LOW ?? row.Low);
        if (key && Number.isFinite(hi) && Number.isFinite(low)) {
          map[key] = { hi, low };
        }
      });
      setThresholdsByLogName(map);
    } catch (e) {
      console.error("Thresholds fetch error:", e);
    }
  };

  // ======= ABA helper: ONLY TH-0001..TH-0005, order 1..5 =======
  async function fetchABAForDate(formattedDate) {
    const url = `${process.env.REACT_APP_BE_URL}/proxy/skyspark/wineABA?date=${formattedDate}`;

    const res = await fetch(url, { credentials: "include" });
    const text = await res.text();

    // handle ver:"3.0"
    const lines = text.trim().split(/\r?\n/);
    const headerIdx = lines.findIndex(l => /(^|,)timeStamp(,|$)/i.test(l));
    if (headerIdx < 0) return [];

    const csvBody = lines.slice(headerIdx).join("\n");
    const parsed = Papa.parse(csvBody, { header: true, skipEmptyLines: true });

    // keep only selected date + 15:00:00 rows
    const rows = (parsed.data || []).filter(r =>
      String(r.date || "").trim() === formattedDate &&
      String(r.ts   || "").startsWith("15:00:00")
    );

    // group by equipment
    const byEquip = rows.reduce((acc, r) => {
      const k = String(r.equipment || "").replace(/"/g, "").trim();
      (acc[k] ||= []).push(r);
      return acc;
    }, {});

    // render only these five, in this order
    const ORDER = ["TH-0001","TH-0002","TH-0003","TH-0004","TH-0005"];
    const out = [];

    ORDER.forEach(eq => {
      const list = byEquip[eq];
      if (!list || list.length === 0) return;
      const r = list[0]; // at 15:00 there should be at most one
      const temp = Number(r.temperature);
      if (!Number.isFinite(temp)) return;
      const name = EQUIPMENT_TO_ABA_NAME[eq] || eq;
      out.push({ name, value: `${temp.toFixed(1)}°C` });
    });

    return out; // ABA 1..5
  }

  // ======= FETCH: instantaneous readings =======
  const fetchInstantData = async () => {
    const formattedDate = "2024-07-20"; // keep your fixed sample date/time
    try {
      const response = await fetch(`${INSTANT_URL}?date=${formattedDate}`, { credentials: "include" });
      const rawText = await response.text();
      const lines = rawText.trim().split("\n");
      if (lines.length < 2) return;

      // drop header
      lines.shift();

      const grouped = { ABA: [], AJI: [], "Grill 58": [], Coast: [] };

      // AJI / Grill 58 / Coast (unchanged)
      lines.forEach((line) => {
        const [ts, dateStr, timeStamp, equipment, temperature, humidity, location, name] = line.split(",");
        if (normalizeKey(dateStr) !== formattedDate || !String(timeStamp).includes("15:00:00")) return;

        const cleanedTemp = parseFloat((temperature || "").trim());
        const label = normalizeKey(name);
        const loc = (location || "").toLowerCase();

        const sensor = { name: label, value: `${cleanedTemp.toFixed(1)}°C` };

        if (loc.includes("aji")) grouped.AJI.push(sensor);
        else if (loc.includes("grill")) grouped["Grill 58"].push(sensor);
        else if (loc.includes("coast")) grouped.Coast.push(sensor);
      });

      // Grill sorting (unchanged)
      grouped["Grill 58"].sort((a, b) => {
        const extract = str => {
          const parts = String(str).match(/FEB(\d+)-(\d+)/);
          if (!parts) return [0, 0];
          return [parseInt(parts[1], 10), parseInt(parts[2], 10)];
        };
        const [aMonth, aNum] = extract(a.name);
        const [bMonth, bNum] = extract(b.name);
        return aMonth === bMonth ? aNum - bNum : aMonth - bMonth;
      });

      // ✅ ABA once (from its dedicated proxy) — only TH-0001..TH-0005
      const abaSensors = await fetchABAForDate(formattedDate);
      grouped.ABA = abaSensors;

      setInstantData(grouped);
    } catch (err) {
      console.error("Instant fetch error:", err);
    }
  };

  // ======= SUMMARY (graphs) fetch stub =======
  const fetchSummaryData = async (_reportDate) => {
    // handled inside child components
  };

  // ======= EFFECTS =======
  useEffect(() => {
    fetchInstantData();     // readings
    fetchThresholds();      // hi/low table
  }, []);

  useEffect(() => {
    fetchSummaryData(selectedDate);
  }, [selectedDate]);

  // ======= RENDER =======
  const renderSensor = (group, sensor, idx) => {
    const temp = parseFloat(sensor.value);
    const key  = keyForLookup(group, sensor.name);
    const thr  = thresholdsByLogName[key];

    if (!thr || !Number.isFinite(temp)) {
      return (
        <div key={idx} className="sensor-box">
          <div style={{ fontSize: 13, fontWeight: "bold" }}>{sensor.name}</div>
          <div className="sensor-value" style={{ fontSize: 14, fontWeight: "bold" }}>
            {sensor.value}
          </div>
        </div>
      );
    }

    const { hi, low } = thr;
    let blinkClass = "";
    let badgeClass = "";
    let badgeText  = "";

    if (temp >= hi) {
      blinkClass = "blink-red";
      badgeClass = "badge-red";
      badgeText  = "HIGH";
    } else if (temp <= low) {
      blinkClass = "blink-blue";
      badgeClass = "badge-blue";
      badgeText  = "LOW";
    }

    return (
      <div key={idx} className={`sensor-box ${blinkClass}`}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>{sensor.name}</div>
          {badgeText && <span className={`status-badge ${badgeClass}`}>{badgeText}</span>}
        </div>
        <div className="sensor-value" style={{ fontSize: 14, fontWeight: "bold" }}>
          {temp.toFixed(1)}°C
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        padding: "30px 50px",
        backgroundColor: "white",
        minHeight: "100vh",
        marginTop: "80px",
        marginLeft: "40px",
      }}
    >
      <style>{inlineCSS}</style>

      {/* Header: View Toggle + Calendar */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", alignItems: "center" }}>
        {/* Toggle Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setView("summary")}
            style={{
              backgroundColor: view === "summary" ? "#f39c12" : "#eee",
              color: view === "summary" ? "white" : "black",
              padding: "8px 14px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
             Summary
          </button>
          <button
            onClick={() => setView("instant")}
            style={{
              backgroundColor: view === "instant" ? "#f39c12" : "#eee",
              color: view === "instant" ? "white" : "black",
              padding: "8px 14px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ⚡ Instantaneous
          </button>
        </div>

        {/* Calendar */}
        <div>
          <label style={{ marginRight: "10px", fontWeight: "bold", color: "#555" }}>Report Date:</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            maxDate={new Date()}
          />
        </div>
      </div>

      {/* Summary View */}
      {view === "summary" && (
        <div style={{ padding: "20px" }}>
            <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        padding: "20px",
      }}
    >
      <ABASummaryGraph date={selectedDate} />
      <WineSummaryGraph date={selectedDate} /> {/* AJI */}
    </div>
          <GrillSummaryGraph date={selectedDate} />
          <CoastSummaryGraph date={selectedDate} />
        </div>
      )}

      {/* Instant View */}
      {view === "instant" &&
        Object.entries(instantData).map(([group, sensors]) => (
          <div key={group} style={{ marginBottom: "40px", background: "#f7f7f7", borderRadius: 8 }}>
            <h3
              style={{
                color: "orangered",
                fontWeight: "bold",
                fontSize: "16px",
                padding: "10px 15px",
                marginBottom: 0,
                borderBottom: "1px solid #ccc",
              }}
            >
              {group}
            </h3>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                padding: "20px",
                gap: "40px",
                minHeight: "80px",
              }}
            >
              {sensors.map((sensor, idx) => renderSensor(group, sensor, idx))}
            </div>
          </div>
        ))}
    </div>
  );
};

export default WineCellur;
