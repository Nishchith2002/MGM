


import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import GaugeChart from "react-gauge-chart";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";

const ChillerDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  });
  const [csvData, setCsvData] = useState([]);
  const [plantCOP, setPlantCOP] = useState(null);
  const [chillers, setChillers] = useState([]);
  const [summaryRows, setSummaryRows] = useState([]);
  const [closestSummary, setClosestSummary] = useState(null);
  const [coolingData, setCoolingData] = useState([]);
  const [loadingCOP, setLoadingCOP] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
 


  // ===== COTAI: Fetch chiller COP data from API =====
  useEffect(() => {
   

    const fetchChillerCOP = async () => {
      try {
        setLoadingCOP(true);
        const apiUrl = `${process.env.REACT_APP_BE_URL}/api/chiller-cop?date=${selectedDate}`;
        
        console.log(" Fetching COP from:", apiUrl);
        
        const response = await fetch(apiUrl, {
          credentials: 'include'
        });
        
        console.log(" COP Response status:", response.status);
        
        if (!response.ok) {
          console.error("❌ Chiller COP API response error:", response.status);
          return;
        }
        
        const text = await response.text();
        console.log(" COP Raw response length:", text.length);
        
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            console.log("✅ Chiller COP data loaded:", result.data.length, "rows");
            console.log(" COP Column names:", result.meta?.fields);
            console.log(" COP First row:", result.data[0]);
            
            setCsvData(result.data);
          },
          error: (err) => {
            console.error("❌ CSV parse error:", err);
          },
        });
      } catch (err) {
        console.error("❌ Chiller COP API error:", err);
      } finally {
        setLoadingCOP(false);
      }
    };

    fetchChillerCOP();
  }, [selectedDate]);

 

  // ===== COTAI: Fetch chiller plant summary data from API =====
  useEffect(() => {
   

    const fetchChillerPlantSummary = async () => {
      try {
        setLoadingSummary(true);
        const apiUrl = `${process.env.REACT_APP_BE_URL}/api/chiller-plant-summary?date=${selectedDate}`;
        
        console.log(" Fetching Summary from:", apiUrl);
        
        const response = await fetch(apiUrl, {
          credentials: 'include'
        });
        
        console.log(" Summary Response status:", response.status);
        
        if (!response.ok) {
          console.error("❌ Chiller Plant Summary API response error:", response.status);
          return;
        }
        
        const text = await response.text();
        console.log(" Summary Raw response length:", text.length);
        
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            console.log("✅ Chiller Plant Summary data loaded:", result.data.length, "rows");
            console.log(" Summary Column names:", result.meta?.fields);
            console.log(" Summary First row:", result.data[0]);
            
            setSummaryRows(result.data.filter(r => r.time));
          },
          error: (err) => {
            console.error("❌ CSV parse error:", err);
          },
        });
      } catch (err) {
        console.error("❌ Chiller Plant Summary API error:", err);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchChillerPlantSummary();
}, [selectedDate]);



  // ===== COTAI: Fetch cooling demand from API =====
  useEffect(() => {
  

    const fetchCoolingDemand = async () => {
      try {
        const timeStr = String(Math.floor(selectedTime)).padStart(2, "0") + ":" + 
                        String(Math.round((selectedTime % 1) * 60)).padStart(2, "0");
        
        const apiUrl = `${process.env.REACT_APP_BE_URL}/api/cooling-demand?date=${selectedDate}&time=${timeStr}&site=mgmCotai`;
        
        const response = await fetch(apiUrl, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          console.error("API response error:", response.status);
          return;
        }
        
        const text = await response.text();
        
        const rows = text.split("\n")
          .slice(1)
          .filter(r => r.trim() !== "");
        
        const data = rows
          .map(line => {
            const parts = line.split(",");
            if (parts.length < 3) return null;
            
            const ts = parts[0]?.trim();
            const nowAve = parts[1]?.trim();
            const oatVal = parts[2]?.trim();
            
            if (!ts || !nowAve || !oatVal) return null;
            
            try {
              const time = new Date(ts.split(" ")[0]);
              const hour = time.getHours().toString().padStart(2, "0") + ":00";
              const cooling = parseFloat(nowAve.replace("tonref", "")) || 0;
              const temperature = parseFloat(oatVal.replace("°C", "")) || 0;
              return { hour, cooling, temperature };
            } catch (e) {
              return null;
            }
          })
          .filter(item => item !== null);
        
        setCoolingData(data);
      } catch (err) {
        console.error("Cooling demand API error:", err);
      }
    };

    fetchCoolingDemand();
  }, [selectedDate, selectedTime]);



  const parseTime = (t) => {
    if (!t || typeof t !== "string" || !t.includes(":")) return 0;
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Helper function to extract numeric value
  const extractNumber = (value) => {
    if (!value) return 0;
    const cleaned = String(value)
      .replace(/[^\d.]/g, '') // Keep only digits and decimal
      .trim();
    return parseFloat(cleaned) || 0;
  };

  useEffect(() => {
    console.log("\n PROCESSING COP DATA");
    console.log("csvData available:", csvData.length, "rows");
    
    if (!csvData.length) {
      console.log("⏭️  Skipping - no data yet");
      return;
    }

    const target = `${String(Math.floor(selectedTime)).padStart(2, "0")}:${String(
      Math.round((selectedTime % 1) * 60)
    ).padStart(2, "0")}`;
    
    console.log(" Looking for time:", target);
    
    const valid = csvData.filter((r) => r.time && r.time.includes(":"));
    console.log("✅ Valid rows with time:", valid.length);
    
    if (!valid.length) {
      console.log("⚠️  No valid rows found");
      return;
    }

    const closest = valid.reduce((a, b) => {
      const da = Math.abs(parseTime(a.time) - parseTime(target));
      const db = Math.abs(parseTime(b.time) - parseTime(target));
      return db < da ? b : a;
    });
    
    console.log("✨ Closest row:", closest);
    console.log(" Available keys:", Object.keys(closest));

    // Parse individual chillers first
    const chillersParsed = [
      { id: "CH-1A", cop: closest.ch1a || closest.CH1A || closest.Chiller1A, loading: closest.percent1a || closest.PERCENT1A || closest.CH1ALoading },
      { id: "CH-2A", cop: closest.ch2a || closest.CH2A || closest.Chiller2A, loading: closest.percent2a || closest.PERCENT2A || closest.CH2ALoading },
      { id: "CH-3A", cop: closest.ch3a || closest.CH3A || closest.Chiller3A, loading: closest.percent3a || closest.PERCENT3A || closest.CH3ALoading },
      { id: "CH-1B", cop: closest.ch1b || closest.CH1B || closest.Chiller1B, loading: closest.percent1b || closest.PERCENT1B || closest.CH1BLoading },
      { id: "CH-2B", cop: closest.ch2b || closest.CH2B || closest.Chiller2B, loading: closest.percent2b || closest.PERCENT2B || closest.CH2BLoading },
      { id: "CH-3B", cop: closest.ch3b || closest.CH3B || closest.Chiller3B, loading: closest.percent3b || closest.PERCENT3B || closest.CH3BLoading },
    ].map((c) => {
      const copValue = extractNumber(c.cop);
      const loadingValue = extractNumber(c.loading);
      console.log(`  ${c.id}: COP=${copValue}, Loading=${loadingValue}`);
      return {
        ...c,
        copValue,
        loadingValue,
      };
    });

    console.log(" Parsed chillers:", chillersParsed);

    // Calculate plant COP
    let plantCOPValue = 0;

    // Try to use plantCOP from API if available
    console.log(" plantCOP column raw value:", closest.plantCOP);
    if (closest.plantCOP && closest.plantCOP !== "") {
      plantCOPValue = extractNumber(closest.plantCOP);
      console.log("✅ Using plantCOP from API:", plantCOPValue);
    }

    // If plantCOP from API is empty or zero, calculate from active chillers
    if (plantCOPValue === 0) {
      const activeChillers = chillersParsed.filter(c => c.copValue > 0);
      if (activeChillers.length > 0) {
        plantCOPValue = activeChillers.reduce((sum, c) => sum + c.copValue, 0) / activeChillers.length;
        console.log(" Calculated Plant COP from", activeChillers.length, "active chillers:", plantCOPValue);
      }
    }

    console.log(" Final Plant COP value:", plantCOPValue);
    setPlantCOP(plantCOPValue > 0 ? plantCOPValue : null);

    // Filter out chillers that have no data
    const filledChillers = chillersParsed.filter(c => c.copValue > 0 || c.loadingValue > 0);
    
    if (filledChillers.length > 0) {
      console.log("✅ Found", filledChillers.length, "chillers with data");
      setChillers(filledChillers);
    } else {
      console.log("⚠️  No individual chiller data found");
      setChillers([]);
    }
  }, [selectedTime, csvData]);

  useEffect(() => {
    console.log("\n PROCESSING SUMMARY DATA");
    console.log("summaryRows available:", summaryRows.length, "rows");
    
    if (!summaryRows.length) {
      console.log("⏭️  Skipping - no data yet");
      return;
    }

    const target = `${String(Math.floor(selectedTime)).padStart(2, "0")}:${String(
      Math.round((selectedTime % 1) * 60)
    ).padStart(2, "0")}`;
    
    const valid = summaryRows.filter(r => r.time && r.time.includes(":"));
    console.log("✅ Valid summary rows with time:", valid.length);
    
    if (!valid.length) {
      console.log("⚠️  No valid summary rows found");
      return;
    }

    const closest = valid.reduce((a, b) => {
      const da = Math.abs(parseTime(a.time) - parseTime(target));
      const db = Math.abs(parseTime(b.time) - parseTime(target));
      return db < da ? b : a;
    });
    
    console.log("✨ Closest summary row:", closest);
    setClosestSummary(closest);
  }, [selectedTime, summaryRows]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      if (selectedDate === now.toISOString().split("T")[0])
        setSelectedTime(now.getHours() + now.getMinutes() / 60);
    }, 60000);
    return () => clearInterval(id);
  }, [selectedDate]);

  const displayTime = () => {
    const h = Math.floor(selectedTime);
    const m = Math.round((selectedTime % 1) * 60);
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setHours(h); d.setMinutes(m);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  
  const handleSlider = (e) => setSelectedTime(parseFloat(e.target.value));
  
  const handleRefresh = () => {
    const now = new Date();
    setSelectedDate(now.toISOString().split("T")[0]);
    setSelectedTime(now.getHours() + now.getMinutes() / 60);
  };

  // ===== GRADIENT BAR COMPONENT WITH TYPE PARAMETER =====
  const GradientBar = ({ min, max, value, tooCold, tooHot, type = "chiller", gradientType = "default" }) => {
    const minVal = Number(min);
    const maxVal = Number(max);
    const val = Number(value);

    if (!Number.isFinite(val) || !Number.isFinite(minVal) || !Number.isFinite(maxVal)) {
      return null;
    }

    const clamped = Math.min(maxVal, Math.max(minVal, val));
    const pct = ((clamped - minVal) / (maxVal - minVal)) * 100;
    const pointerColor = "#666";

    // Reversed gradient for chillers (Red → Orange → Yellow → Green → Blue)
    const chillerGradient = "linear-gradient(to right, #f44336, #ff9800, #ffeb3b, #4caf50, #2196f3)";
    
    // DEFAULT loop gradient for CHW Loop: Blue → Green → Yellow → Orange → Red (WITH BLUE)
    const defaultLoopGradient = "linear-gradient(to right, #1e88e5, #00bcd4, #4caf50, #ffeb3b, #ff9800, #f44336)";
    
    // CDWLT & CDWET: Green → Yellow → Orange → Red (NO BLUE)
    const cdwGradient = "linear-gradient(to right, #4caf50, #ffeb3b, #ff9800, #f44336)";
    
    // WBT: Blue → Cyan → Green → Yellow → Orange → Red (WITH BLUE for cold warning)
    const wbtGradient = "linear-gradient(to right, #1e88e5, #00bcd4, #4caf50, #ffeb3b, #ff9800, #f44336)";
    
    // Approach Temp: Green → Yellow → Orange → Red (NO BLUE, same as CDW)
    const approachGradient = "linear-gradient(to right, #4caf50, #ffeb3b, #ff9800, #f44336)";

    let selectedGradient;
    if (type === "loop") {
      if (gradientType === "cdw") {
        selectedGradient = cdwGradient;
      } else if (gradientType === "wbt") {
        selectedGradient = wbtGradient;
      } else if (gradientType === "approach") {
        selectedGradient = approachGradient;
      } else {
        selectedGradient = defaultLoopGradient; // default for CHW loop - Yellow to Red
      }
    } else {
      selectedGradient = chillerGradient;
    }

    return (
      <div style={{ width: "100%", marginTop: 8, position: "relative" }}>
        {(tooCold || tooHot) && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "#666",
            marginBottom: 4,
            fontWeight: 600,
          }}>
            <span style={{ color: "#1e88e5" }}>{tooCold}</span>    
            <span style={{ color: "#f44336" }}>{tooHot}</span>
          </div>
        )}

        <div
          style={{
            position: "relative",
            height: 14,
            background: selectedGradient,
            borderRadius: 8,
            boxShadow: "inset 0 0 4px rgba(0,0,0,0.2)",
          }}
        />

        <div
          style={{
            position: "relative",
            height: 10,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: `${pct}%`,
              transform: "translateX(-50%)",
              top: "0px",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: `10px solid ${pointerColor}`,
              transition: "left 0.3s ease-in-out",
            }}
          />
        </div>

        {/* Min/Max values below - original styling */}
        {(tooCold || tooHot) && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#333",
              marginTop: 3,
              fontWeight: 600,
            }}
          >
            <span>{Math.round(minVal)}</span>
            <span>{Math.round(maxVal)}</span>
          </div>
        )}
      </div>
    );
  };

  const filteredCoolingData = coolingData.filter((d) => {
    const [hour, minute] = d.hour.split(":").map(Number);
    const timeInHours = hour + (minute || 0) / 60;
    return timeInHours <= selectedTime;
  });

  return (
    <div style={{ 
      padding: "20px 40px", 
      background: "#f5f5f5", 
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif",
      margin: "100px 0px 0px 80px"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        background: "#fff",
        padding: "15px 20px",
        borderRadius: "4px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <h2 style={{ 
            margin: 0, 
            color: "#ff5722", 
            fontSize: "20px", 
            fontWeight: "bold" 
          }}>
           Chiller Plant Summary - Cotai ({selectedDate} {displayTime()})
          </h2>
          <div 
            onClick={handleRefresh} 
            title="Refresh"
            style={{ 
              fontSize: "24px", 
              color: "#999", 
              cursor: "pointer",
              userSelect: "none"
            }}
          >↻</div>
          {(loadingCOP || loadingSummary) && (
            <span style={{ fontSize: "12px", color: "#999" }}>Loading...</span>
          )}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <label style={{ fontWeight: "600", fontSize: "14px", color: "#333" }}>Reporting</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              fontSize: "14px",
              padding: "6px 10px",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }} 
          />
          <div style={{ position: "relative", width: "400px" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "#666",
              marginBottom: "5px"
            }}>
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="24" 
              step="0.25"
              value={selectedTime} 
              onChange={handleSlider} 
              style={{ width: "100%" }} 
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* LEFT SIDE - Plant COP & Chillers */}
        
       <div style={{
  background: "#fff",
 border: "2px solid #c8a000",
  borderRadius: "8px",
  padding: "20px",
  display: "flex",
  flexDirection: "row",
  gap: "40px",
  alignItems: "flex-start"
}}>
         <div style={{ 
  textAlign: "center",
  minWidth: "200px",
  padding: "20px"
}}>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: "600", 
              color: "#666",
              marginBottom: "10px" 
            }}>Plant COP</div>
            <div
              style={{
              width: "280px",
height: "200px",
                margin: "0 auto",
                position: "relative",
              }}
            >
              <GaugeChart
                id="plant-cop-gauge"
                nrOfLevels={60}
                arcsLength={[0.2, 0.2, 0.2, 0.2, 0.2]}
                colors={[
                  "#ff3b30",
                  "#ff9500",
                  "#ffcc00",
                  "#34c759",
                  "#007aff",
                ]}
                percent={plantCOP ? Math.min(plantCOP / 10, 1) : 0}
                arcPadding={0.00}
cornerRadius={0}
arcWidth={0.3}
                textColor="transparent"
                needleColor="#000"
                needleBaseColor="#333"
                style={{ width: "100%", height: "100%" }}
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
                {plantCOP ? plantCOP.toFixed(1) : "-"}
              </div>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px"
          }}>
            {chillers.length > 0 ? (
              chillers.map(c => (
                <div key={c.id} style={{
                  padding: "12px 10px",
                  textAlign: "center",
                  width: "180px",
                }}>
                  <div style={{ 
                    fontSize: "12px", 
                    fontWeight: "bold",
                    marginBottom: "2px" 
                  }}>{c.id}</div>
                  <div style={{ 
                    fontSize: "9px", 
                    color: "#999",
                    marginBottom: "8px" 
                  }}>% Loading</div>
                  
                  <div style={{ 
                    width: "55px", 
                    height: "55px", 
                    margin: "0 auto 8px" 
                  }}>
                     <CircularProgressbar 
      value={c.loadingValue > 0 ? Math.min(c.loadingValue, 100) : 0}
      minValue={0}
      maxValue={100}
      text={
        c.loadingValue > 0
          ? `${Math.min(Math.round(c.loadingValue), 100)}`
          : "-"
      }
      strokeWidth={12}
      styles={buildStyles({
        pathColor: c.loadingValue > 0 ? "#00bcd4" : "#e0e0e0",
        textColor: c.loadingValue > 0 ? "#000" : "#999",
        trailColor: "#e0e0e0",
        textSize: "32px",
      })}
    />
                  </div>

                  <div style={{ 
                    fontSize: "9px", 
                    color: "#999",
                    marginBottom: "4px" 
                  }}>COP</div>
                  
                  <div style={{ marginBottom: "6px" }}>
                    {c.copValue > 0 ? (
                      <GradientBar
                        value={c.copValue}
                        min={0}
                        max={10}
                        tooCold=""
                        tooHot=""
                        type="chiller"
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "8px",
                        background: "#e0e0e0",
                        borderRadius: "2px",
                        marginBottom: "12px"
                      }}/>
                    )}
                  </div>
                  
                  <div style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: c.copValue > 0 ? "#000" : "#f44336"
                  }}>
                    {c.copValue > 0 ? c.copValue.toFixed(1) : "OFF"}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: "1/-1", color: "#999", padding: "20px", textAlign: "center" }}>
                Plant COP: {plantCOP ? plantCOP.toFixed(1) : "-"}
                <br />
                (Individual chiller data not available)
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE - CHW & CW Loops stacked vertically */}
        {closestSummary && (
          <div style={{ 
            flex: "1",
            display: "flex",
            flexDirection: "column",
            gap: "0px",
          }}>
            {/* CHW Loop */}
            <div style={{
              background: "#fff",
              border: "2px solid #c8a000",
              borderRadius: "4px 4px 0 0",
              padding: "60px 20px",
              borderBottom: "1px solid #c8a000"
            }}>
              <div style={{ 
                fontSize: "13px", 
                fontWeight: "bold",
                marginBottom: "12px",
                color: "#333"
              }}>CHW Loop</div>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(5, 1fr)", 
                gap: "20px" 
              }}>
                {[
                  { label: "CHWST", val: parseFloat(closestSummary.chwst), min: 5, max: 9 },
                  { label: "CHWRT", val: parseFloat(closestSummary.chwrt), min: 10, max: 15 },
                  { label: "CHW ΔT", val: parseFloat(closestSummary.deltaTCHW), min: 1, max: 10 },
                  { label: "AVG CHWST SP", val: parseFloat(closestSummary.chwsp), min: 5, max: 10 },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>{item.label}</div>
                    <div style={{ fontSize: 28, fontWeight: "bold", marginBottom: 5 }}>
                      {Number.isFinite(item.val) ? item.val.toFixed(1) : "-"}°C
                    </div>
                    <GradientBar
                      value={item.val}
                      min={item.min}
                      max={item.max}
                      tooCold="Too Cold"
                      tooHot="Too Hot"
                      type="loop"
                    />
                  </div>
                ))}
                
                <div style={{ textAlign: "center" }}>
                  <div style={{ 
                    fontSize: "12px", 
                    fontWeight: "600",
                    color: "#666",
                    marginBottom: "8px" 
                  }}>Difference</div>
                 {(() => {
  const diffValue = parseFloat(closestSummary.chwst) - parseFloat(closestSummary.chwsp);
  return (
    <div style={{
      fontSize: "28px",
      fontWeight: "bold",
      color: diffValue >= 0 ? "#f44336" : "#4caf50",
    }}>
      {Number.isFinite(diffValue) ? diffValue.toFixed(1) : "-"}°C
    </div>
  );
})()}
                </div>
              </div>
            </div>

            {/* CW Loop with DYNAMIC RANGES ✨ */}
            <div
              style={{
                background: "#fff",
                border: "2px solid #c8a000",
                borderRadius: "0 0 4px 4px",
                padding: "40px 20px",
                borderTop: "none"
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  marginBottom: "12px",
                  color: "#333",
                }}
              >
                CW Loop
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "20px",
                }}
              >
                {(() => {
                  // ===== DYNAMIC RANGES LOGIC =====
                  const cdwlt = parseFloat(closestSummary.cdwlt);
                  const cdwet = parseFloat(closestSummary.cdwet);
                  const wbt = parseFloat(closestSummary.wbt);
                  const approachTemp = parseFloat(closestSummary.approachTemp);

                  const cwLoopMetrics = [
                    { 
                      label: "CDWLT", 
                      val: cdwlt,
                      min: cdwet,              // ← Min = CDWET
                      max: cdwet + 10,          // ← Max = CDWET + 7
                      tooCold: "Too Cold",
                      tooHot: "Too Hot",
                      gradientType: "wbt"      
                    },
                    { 
                      label: "CDWET", 
                      val: cdwet,
                      min: wbt + 2,                // ← Min = WBT
                      max: wbt + 6,            // ← Max = WBT + 5
                      // tooCold: "Too Cold",
                      tooHot: "Too Hot",
                      gradientType: "cdw"      // ← Green to Red (NO BLUE)
                    },
                    { 
                      label: "WBT", 
                      val: wbt,
                      min: 15,                 // ← Seasonal minimum
                      max: 36,                 // ← Seasonal maximum
                      tooCold: "Too Cold",
                      tooHot: "Too Hot",
                      gradientType: "wbt"      // ← Blue to Red (WITH BLUE for cold)
                    },
                    { 
                      label: "Approach Temp.", 
                      val: approachTemp,
                      min: 2,
                      max: 6,
                      // tooCold: "Too Cold",
                      tooHot: "Too Hot",
                      gradientType: "approach" // ← Green to Red (NO BLUE, same as CDW)
                    },
                  ];

                  return cwLoopMetrics.map((item) => (
                    <div key={item.label} style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#666",
                          marginBottom: "8px",
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: "28px",
                          fontWeight: "bold",
                          marginBottom: "5px",
                        }}
                      >
                        {Number.isFinite(item.val) ? item.val.toFixed(1) : "-"}°C
                      </div>
                      <GradientBar
                        value={item.val}
                        min={item.min}
                        max={item.max}
                        tooCold={item.tooCold}
                        tooHot={item.tooHot}
                        type="loop"
                        gradientType={item.gradientType}
                      />
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {coolingData.length > 0 && (
        <div style={{
          marginTop: "20px",
          background: "#fff",
          border: "2px solid #c8a000",
          borderRadius: "4px",
          padding: "15px",
        }}>
          <div style={{
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "10px",
            color: "#333",
          }}>
            Cooling Demand
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={filteredCoolingData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="hour"
                label={{
                  value: "Hour",
                  position: "insideBottom",
                  offset: -2,
                  fontSize: 12,
                }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                label={{
                  value: "Cooling Load (TR)",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 12,
                }}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{
                  value: "Outdoor Air Dry Bulb Temp (°C)",
                  angle: 90,
                  position: "insideRight",
                  fontSize: 12,
                }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Legend
                verticalAlign="top"
                wrapperStyle={{ fontSize: "12px", marginBottom: "8px" }}
              />
              <Bar
                yAxisId="left"
                dataKey="cooling"
                name="Total Cooling Demand"
                barSize={10}
                fill="#4fc3f7"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="temperature"
                name="Outdoor Air Dry Bulb Temperature"
                stroke="#ff7043"
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ChillerDashboard;