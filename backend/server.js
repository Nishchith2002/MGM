




// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
// const cookieParser = require("cookie-parser");
// const fs = require("fs");
// const path = require("path");
// const { loginToSkySpark } = require("./skySparkLogin");

// const app = express();

// // const SKY_HOST = "http://10.69.80.144:8080";
// const SKY_HOST=process.env.SKY_HOST




// app.use(cors({
//   origin: process.env.CORS_ORIGINS.split(','), // split the string into an array
//   credentials: true
// }));


// app.use(express.json({ limit: "50mb" }));
// app.use(cookieParser());

// // ================= UTILITY: Clean SkySpark Metadata =================

// function cleanSkySparkResponse(text) {
//   // SkySpark returns metadata lines before the actual CSV
//   // Example:
//   //   ver:"3.0" hisRollupInterval:15min dis:"Fri 4-Apr-2025" ...
//   //   timeStamp,time,plantCOP,chwst,...
//   //   data rows...
  
//   const lines = text.split("\n");
//   const cleanedLines = [];
//   let foundCSVHeader = false;
  
//   for (const line of lines) {
//     const trimmed = line.trim();
    
//     // Skip empty lines before CSV header
//     if (!foundCSVHeader && trimmed === "") continue;
    
//     // Skip metadata lines (contain "dis:", "hisLimit:", "view:", etc.)
//     if (!foundCSVHeader && (trimmed.includes("dis:") || trimmed.includes("hisLimit:") || trimmed.includes("hisRollupInterval") || trimmed.includes("ver:"))) {
//       console.log("  ️  Skipping metadata line:", trimmed.substring(0, 80));
//       continue;
//     }
    
//     // Check if this is the CSV header (contains commas and common CSV column names)
//     if (!foundCSVHeader && trimmed.includes(",")) {
//       console.log("  ✅ Found CSV header:", trimmed.substring(0, 100));
//       foundCSVHeader = true;
//     }
    
//     // Add the line if we found header or if it's a data line
//     if (foundCSVHeader && trimmed !== "") {
//       cleanedLines.push(trimmed);
//     }
//   }
  
//   const cleaned = cleanedLines.join("\n");
//   console.log("   Cleaned response length:", cleaned.length);
//   console.log("   Number of lines:", cleanedLines.length);
  
//   return cleaned;
// }

// // ================= AUTH =================

// app.post("/api/skyspark-login", async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const cookie = await loginToSkySpark(username, password);

//     res.cookie(cookie.name, cookie.value, {
//       httpOnly: true,
//       sameSite: "lax",
//       secure: false,
//       path: "/"
//     });

//     return res.status(200).json({ message: "SkySpark login successful" });
//   } catch (err) {
//     console.error(err.message);
//     res.status(401).json({ error: "Invalid credentials" });
//   }
// });

// app.post("/api/logout", (req, res) => {
//   res.clearCookie("skyarc-auth-8080", {
//     httpOnly: true,
//     path: "/"
//   });
//   res.status(200).json({ message: "Logged out successfully" });
// });

// // ================= AUTH DEBUG =================

// app.get("/api/debug/cookies", (req, res) => {
//   const allCookies = req.headers.cookie || "No cookies";
//   const parsedCookies = req.cookies || {};
  
//   console.log("\n=== DEBUG: COOKIES ===");
//   console.log("Raw Cookie Header:", allCookies);
//   console.log("Parsed Cookies:", parsedCookies);
  
//   res.json({
//     rawHeader: allCookies,
//     parsed: parsedCookies,
//     hasSkySparkAuth: !!(allCookies && allCookies.includes("skyarc-auth"))
//   });
// });

// // ================= PROXIES =================

// app.get('/api/skyspark/alertConfig/:site', async (req, res) => {
//   const cookie = req.headers.cookie;
//   const site = req.params.site;

//   if (!cookie?.includes("skyarc-auth")) {
//     return res.status(401).json({ error: "Not authenticated" });
//   }

//   const base = site === "Macau" ? "mgmMacauLora" : "mgmCotaiLora";
//   const url = `${SKY_HOST}/api/${base}/eval?expr=dgGetAlertConfig()`;

//   try {
//     const r = await fetch(url, { headers: { Cookie: cookie } });
//     const txt = await r.text();
//     res.type("text").send(txt);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get("/api/skyspark/summary/:site", async (req, res) => {
//   const cookie = req.headers.cookie;
//   const site = req.params.site;

//   if (!cookie?.includes("skyarc-auth")) {
//     return res.status(401).json({ error: "Not authenticated" });
//   }

//   const base = site === "Macau" ? "mgmMacauLora" : "mgmCotaiLora";
//   const url = `${SKY_HOST}/api/${base}/eval?expr=dgGetSummary(%22sensor%20type%22)`;

//   const r = await fetch(url, { headers: { Cookie: cookie } });
//   const txt = await r.text();

//   const rows = txt.split("\n").slice(1).filter(r => r.trim() !== "");
//   const data = rows.map(line => {
//     const [sensorType, count] = line.split(",");
//     return { sensorType: sensorType.replace(/"/g, ""), count: Number(count) };
//   });

//   res.json(Object.fromEntries(data.map(d => [d.sensorType, d.count])));
// });

// app.get("/proxy/skyspark/wineABA", async (req, res) => {
//   const cookie = req.headers.cookie;
//   if (!cookie || !cookie.includes("skyarc-auth-8080")) {
//     return res.status(401).send("SkySpark auth cookie missing");
//   }
//   const date = req.query.date || new Date().toISOString().split("T")[0];
//   const apiUrl = `${process.env.SKY_HOST}/api/mgmMacauLora/eval?expr=dg_wineCeller(${date})`;

//   const response = await fetch(apiUrl, { headers: { Cookie: cookie } });
//   const text = await response.text();
//   res.type("text").send(text);
// });

// app.get("/proxy/skyspark/coastWine", async (req, res) => {
//   const cookie = req.headers.cookie;
//   if (!cookie?.includes("skyarc-auth")) return res.status(401).send("Missing cookie");

//   const date = req.query.date || new Date().toISOString().split("T")[0];
//   const url = `${SKY_HOST}/api/mgmCotaiLora/eval?expr=dg_wineCeller("${date}")`;

//   const r = await fetch(url, { headers: { Cookie: cookie } });
//   res.type("text").send(await r.text());
// });

// // ================= CHILLER COP API =================

// app.get("/api/chiller-cop", async (req, res) => {
//   const cookie = req.headers.cookie;
  
//   console.log("\n=== CHILLER COP API REQUEST ===");
//   console.log("Timestamp:", new Date().toISOString());
  
//   if (!cookie?.includes("skyarc-auth")) {
//     console.log(" No auth cookie found");
//     return res.status(401).json({ error: "Not authenticated - please login first" });
//   }

//   const dateParam = req.query.date || new Date().toISOString().split("T")[0];
  
//   console.log("Request params:");
//   console.log("  date:", dateParam);
  
//   const expr = `dg_chillerCOP_jpe(${dateParam})`;
//   const apiUrl = `${SKY_HOST}/api/mgmCotai/eval?expr=${expr}`;
  
//   console.log("Final API URL:", apiUrl);

//   try {
//     console.log("Fetching from SkySpark...");
//     const response = await fetch(apiUrl, { 
//       headers: { 
//         Cookie: cookie,
//         "User-Agent": "ChillerDashboard/1.0"
//       } 
//     });
    
//     console.log("Response status:", response.status);
//     const text = await response.text();
    
//     console.log("Raw response length:", text.length, "chars");
    
//     // Check if response is HTML (error page or login page)
//     if (text.trim().startsWith("<") || text.includes("<!DOCTYPE") || text.includes("<html")) {
//       console.log("ERROR: Received HTML instead of CSV");
//       return res.status(401).json({ 
//         error: "Authentication failed with SkySpark",
//         message: "Please login again.",
//         statusCode: response.status
//       });
//     }
    
//     if (!text.trim()) {
//       console.log("⚠️ WARNING: Empty response from SkySpark");
//       return res.status(200).type("text").send("");
//     }
    
//     // Clean SkySpark metadata before sending to frontend
//     console.log("Cleaning SkySpark metadata...");
//     const cleaned = cleanSkySparkResponse(text);
    
//     console.log("✅ SUCCESS: Sending cleaned CSV data");
//     res.type("text").send(cleaned);
//   } catch (err) {
//     console.log("FETCH ERROR:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ================= CHILLER PLANT SUMMARY API =================

// app.get("/api/chiller-plant-summary", async (req, res) => {
//   const cookie = req.headers.cookie;
  
//   console.log("\n=== CHILLER PLANT SUMMARY API REQUEST ===");
//   console.log("Timestamp:", new Date().toISOString());
  
//   if (!cookie?.includes("skyarc-auth")) {
//     console.log(" No auth cookie found");
//     return res.status(401).json({ error: "Not authenticated - please login first" });
//   }

//   const dateParam = req.query.date || new Date().toISOString().split("T")[0];
  
//   console.log("Request params:");
//   console.log("  date:", dateParam);
  
//   const expr = `dg_chillerPlantSummary_jpe(${dateParam})`;
//   const apiUrl = `${SKY_HOST}/api/mgmCotai/eval?expr=${expr}`;
  
//   console.log("Final API URL:", apiUrl);

//   try {
//     console.log("Fetching from SkySpark...");
//     const response = await fetch(apiUrl, { 
//       headers: { 
//         Cookie: cookie,
//         "User-Agent": "ChillerDashboard/1.0"
//       } 
//     });
    
//     console.log("Response status:", response.status);
//     const text = await response.text();
    
//     console.log("Raw response length:", text.length, "chars");
    
//     // Check if response is HTML (error page or login page)
//     if (text.trim().startsWith("<") || text.includes("<!DOCTYPE") || text.includes("<html")) {
//       console.log(" ERROR: Received HTML instead of CSV");
//       return res.status(401).json({ 
//         error: "Authentication failed with SkySpark",
//         message: "Please login again.",
//         statusCode: response.status
//       });
//     }
    
//     if (!text.trim()) {
//       console.log(" WARNING: Empty response from SkySpark");
//       return res.status(200).type("text").send("");
//     }
    
//     // Clean SkySpark metadata before sending to frontend
//     console.log("Cleaning SkySpark metadata...");
//     const cleaned = cleanSkySparkResponse(text);
    
//     console.log("SUCCESS: Sending cleaned CSV data");
//     res.type("text").send(cleaned);
//   } catch (err) {
//     console.log("FETCH ERROR:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ================= COOLING DEMAND API =================

// app.get("/api/cooling-demand", async (req, res) => {
//   const cookie = req.headers.cookie;
  
//   console.log("\n=== COOLING DEMAND API REQUEST ===");
//   console.log("Timestamp:", new Date().toISOString());
  
//   if (!cookie?.includes("skyarc-auth")) {
//     console.log(" No auth cookie found");
//     return res.status(401).json({ error: "Not authenticated" });
//   }

//   const dateParam = req.query.date || new Date().toISOString().split("T")[0];
//   const timeParam = req.query.time || "14:00";
  
//   console.log("Request params:");
//   console.log("  date:", dateParam);
//   console.log("  time:", timeParam);
  
//   const expr = `dg_coolingDemand_jpe(${dateParam}..${dateParam},%20%22${timeParam}%22)`;
//   const apiUrl = `${SKY_HOST}/api/mgmCotai/eval?expr=${expr}`;
  
//   console.log("Final API URL:", apiUrl);

//   try {
//     console.log("Fetching from SkySpark...");
//     const response = await fetch(apiUrl, { 
//       headers: { 
//         Cookie: cookie
//       } 
//     });
    
//     console.log("Response status:", response.status);
//     const text = await response.text();
    
//     if (text.trim().startsWith("<") || text.includes("<!")) {
//       console.log("❌ ERROR: Received HTML instead of CSV");
//       return res.status(500).json({ 
//         error: "SkySpark API returned error page (HTML)",
//         statusCode: response.status
//       });
//     }
    
//     if (!text.trim()) {
//       console.log("⚠️ WARNING: Empty response from SkySpark");
//       return res.status(200).type("text").send("");
//     }
    
//     // Clean SkySpark metadata
//     const cleaned = cleanSkySparkResponse(text);
    
//     console.log("✅ SUCCESS: Received data");
//     res.type("text").send(cleaned);
//   } catch (err) {
//     console.log("❌ FETCH ERROR:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ================= LUX LEVEL API =================
// app.get("/api/lux-level", async (req, res) => {
//   const cookie = req.headers.cookie;

//   if (!cookie?.includes("skyarc-auth")) {
//     return res.status(401).json({ error: "Not authenticated" });
//   }

//   const year  = req.query.year;
//   const month = req.query.month;

//   const expr   = `get_luxLevel(${year}-${month})`;
//   const apiUrl = `${SKY_HOST}/api/mgmMacauLora/eval?expr=${expr}`;

//   console.log("\n=== LUX LEVEL API REQUEST ===");
//   console.log("URL:", apiUrl);

//   try {
//     const response = await fetch(apiUrl, { headers: { Cookie: cookie } });
//     const text     = await response.text();

//     if (text.trim().startsWith("<")) {
//       return res.status(401).json({ error: "Auth failed, please login again" });
//     }

//     const cleaned = cleanSkySparkResponse(text);
//     res.type("text").send(cleaned);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// // ================= LUX LEVEL API (MGM Cotai) =================
// app.get("/api/cotai/lux-level", async (req, res) => {
//   const cookie = req.headers.cookie;

//   if (!cookie?.includes("skyarc-auth")) {
//     return res.status(401).json({ error: "Not authenticated" });
//   }

//   const year  = req.query.year;
//   const month = req.query.month;

//   if (!year || !month) {
//     return res.status(400).json({ error: "Missing year or month query params" });
//   }

//   const expr   = `get_luxLevel(${year}-${month})`;
//   const apiUrl = `${SKY_HOST}/api/mgmCotaiLora/eval?expr=${expr}`;

//   console.log("\n=== COTAI LUX LEVEL API REQUEST ===");
//   console.log("URL:", apiUrl);

//   try {
//     const response = await fetch(apiUrl, { headers: { Cookie: cookie } });
//     const text     = await response.text();

//     if (text.trim().startsWith("<")) {
//       return res.status(401).json({ error: "Auth failed, please login again" });
//     }

//     const cleaned = cleanSkySparkResponse(text);
//     res.type("text").send(cleaned);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });



// // ================= ACH LEVEL API (MGM Macau) =================
// app.get("/api/ach-level", async (req, res) => {
//   const cookie = req.headers.cookie;

//   if (!cookie?.includes("skyarc-auth")) {
//     return res.status(401).json({ error: "Not authenticated" });
//   }

//   const year  = req.query.year;
//   const month = req.query.month;

//   if (!year || !month) {
//     return res.status(400).json({ error: "Missing year or month query params" });
//   }

//   const expr   = `ach_analysis(${year}-${month})`;
//   const apiUrl = `${SKY_HOST}/api/mgmMacauLora/eval?expr=${expr}`;

//   console.log("\n=== ACH LEVEL API REQUEST ===");
//   console.log("URL:", apiUrl);

//   try {
//     const response = await fetch(apiUrl, { headers: { Cookie: cookie } });
//     const text     = await response.text();

//     if (text.trim().startsWith("<")) {
//       return res.status(401).json({ error: "Auth failed, please login again" });
//     }

//     const cleaned = cleanSkySparkResponse(text);
//     res.type("text").send(cleaned);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });





// // ================= CSV =================

// const dataDir = path.join(__dirname, "../frontend/public/Data/executiveSummary");
// const mainDataDir = path.join(__dirname, "../frontend/public/Data");

// // Ensure directories exist at startup
// if (!fs.existsSync(mainDataDir)) fs.mkdirSync(mainDataDir, { recursive: true });
// if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// // Upload to /api/file/upload/:fileName  (matches frontend)
// app.post("/api/file/upload/:fileName", (req, res) => {
//   try {
//     const fileName = req.params.fileName;
//     const { content } = req.body || {};
//     if (!fileName || typeof content !== "string") {
//       return res.status(400).json({ error: "Invalid filename or content" });
//     }
//     fs.writeFileSync(path.join(dataDir, fileName), content);
//     return res.json({ ok: true });
//   } catch (err) {
//     console.error("Upload error:", err);
//     return res.status(500).json({ error: "Failed to save file" });
//   }
// });

// // Read from /api/file/:fileName (won’t crash if file missing)
// app.get("/api/file/:fileName", (req, res) => {
//   try {
//     const fileName = req.params.fileName;
    
//     // ✅ Check executiveSummary (uploaded files) FIRST
//     let filePath = path.join(dataDir, fileName);
//     if (!fs.existsSync(filePath)) filePath = path.join(mainDataDir, fileName);`-`
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ error: "File not found" });
//     }
//     res.setHeader("Content-Type", "text/csv");
//     fs.createReadStream(filePath).pipe(res);
//   } catch (err) {
//     console.error("File read error:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });


// // ================= SERVER =================

// const PORT = 5002;
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Backend running on http://10.69.80.144:${PORT}`);
// });


require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const { loginToSkySpark } = require("./skySparkLogin");

const app = express();

const SKY_HOST = process.env.SKY_HOST;

app.use(cors({
  origin: process.env.CORS_ORIGINS.split(','),
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// ================= UTILITY: Clean SkySpark Metadata =================

function cleanSkySparkResponse(text) {
  const lines = text.split("\n");
  const cleanedLines = [];
  let foundCSVHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!foundCSVHeader && trimmed === "") continue;

    if (!foundCSVHeader && (trimmed.includes("dis:") || trimmed.includes("hisLimit:") || trimmed.includes("hisRollupInterval") || trimmed.includes("ver:"))) {
      console.log("  ️  Skipping metadata line:", trimmed.substring(0, 80));
      continue;
    }

    if (!foundCSVHeader && trimmed.includes(",")) {
      console.log("  ✅ Found CSV header:", trimmed.substring(0, 100));
      foundCSVHeader = true;
    }

    if (foundCSVHeader && trimmed !== "") {
      cleanedLines.push(trimmed);
    }
  }

  const cleaned = cleanedLines.join("\n");
  console.log("   Cleaned response length:", cleaned.length);
  console.log("   Number of lines:", cleanedLines.length);

  return cleaned;
}

// ================= AUTH =================

app.post("/api/skyspark-login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const cookie = await loginToSkySpark(username, password);

    res.cookie(cookie.name, cookie.value, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/"
    });

    return res.status(200).json({ message: "SkySpark login successful" });
  } catch (err) {
    console.error(err.message);
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("skyarc-auth-8080", {
    httpOnly: true,
    path: "/"
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// ================= AUTH DEBUG =================

app.get("/api/debug/cookies", (req, res) => {
  const allCookies = req.headers.cookie || "No cookies";
  const parsedCookies = req.cookies || {};

  console.log("\n=== DEBUG: COOKIES ===");
  console.log("Raw Cookie Header:", allCookies);
  console.log("Parsed Cookies:", parsedCookies);

  res.json({
    rawHeader: allCookies,
    parsed: parsedCookies,
    hasSkySparkAuth: !!(allCookies && allCookies.includes("skyarc-auth"))
  });
});

// ================= PROXIES =================

app.get('/api/skyspark/alertConfig/:site', async (req, res) => {
  const cookie = req.headers.cookie;
  const site = req.params.site;

  if (!cookie?.includes("skyarc-auth")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const base = site === "Macau" ? "mgmMacauLora" : "mgmCotaiLora";
  const url = `${SKY_HOST}/api/${base}/eval?expr=dgGetAlertConfig()`;

  try {
    const r = await fetch(url, { headers: { Cookie: cookie } });
    const txt = await r.text();
    res.type("text").send(txt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/skyspark/summary/:site", async (req, res) => {
  const cookie = req.headers.cookie;
  const site = req.params.site;

  if (!cookie?.includes("skyarc-auth")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const base = site === "Macau" ? "mgmMacauLora" : "mgmCotaiLora";
  const url = `${SKY_HOST}/api/${base}/eval?expr=dgGetSummary(%22sensor%20type%22)`;

  const r = await fetch(url, { headers: { Cookie: cookie } });
  const txt = await r.text();

  const rows = txt.split("\n").slice(1).filter(r => r.trim() !== "");
  const data = rows.map(line => {
    const [sensorType, count] = line.split(",");
    return { sensorType: sensorType.replace(/"/g, ""), count: Number(count) };
  });

  res.json(Object.fromEntries(data.map(d => [d.sensorType, d.count])));
});

app.get("/proxy/skyspark/wineABA", async (req, res) => {
  const cookie = req.headers.cookie;
  if (!cookie || !cookie.includes("skyarc-auth-8080")) {
    return res.status(401).send("SkySpark auth cookie missing");
  }
  const date = req.query.date || new Date().toISOString().split("T")[0];
  const apiUrl = `${process.env.SKY_HOST}/api/mgmMacauLora/eval?expr=dg_wineCeller(${date})`;

  const response = await fetch(apiUrl, { headers: { Cookie: cookie } });
  const text = await response.text();
  res.type("text").send(text);
});

app.get("/proxy/skyspark/coastWine", async (req, res) => {
  const cookie = req.headers.cookie;
  if (!cookie?.includes("skyarc-auth")) return res.status(401).send("Missing cookie");

  const date = req.query.date || new Date().toISOString().split("T")[0];
  const url = `${SKY_HOST}/api/mgmCotaiLora/eval?expr=dg_wineCeller("${date}")`;

  const r = await fetch(url, { headers: { Cookie: cookie } });
  res.type("text").send(await r.text());
});

// ================= CHILLER COP API =================

app.get("/api/chiller-cop", async (req, res) => {
  const cookie = req.headers.cookie;

  console.log("\n=== CHILLER COP API REQUEST ===");
  console.log("Timestamp:", new Date().toISOString());

  if (!cookie?.includes("skyarc-auth")) {
    console.log(" No auth cookie found");
    return res.status(401).json({ error: "Not authenticated - please login first" });
  }

  const dateParam = req.query.date || new Date().toISOString().split("T")[0];

  console.log("Request params:");
  console.log("  date:", dateParam);

  const expr = `dg_chillerCOP_jpe(${dateParam})`;
  const apiUrl = `${SKY_HOST}/api/mgmCotai/eval?expr=${expr}`;

  console.log("Final API URL:", apiUrl);

  try {
    console.log("Fetching from SkySpark...");
    const response = await fetch(apiUrl, {
      headers: {
        Cookie: cookie,
        "User-Agent": "ChillerDashboard/1.0"
      }
    });

    console.log("Response status:", response.status);
    const text = await response.text();

    console.log("Raw response length:", text.length, "chars");

    if (text.trim().startsWith("<") || text.includes("<!DOCTYPE") || text.includes("<html")) {
      console.log("ERROR: Received HTML instead of CSV");
      return res.status(401).json({
        error: "Authentication failed with SkySpark",
        message: "Please login again.",
        statusCode: response.status
      });
    }

    if (!text.trim()) {
      console.log("⚠️ WARNING: Empty response from SkySpark");
      return res.status(200).type("text").send("");
    }

    console.log("Cleaning SkySpark metadata...");
    const cleaned = cleanSkySparkResponse(text);

    console.log("✅ SUCCESS: Sending cleaned CSV data");
    res.type("text").send(cleaned);
  } catch (err) {
    console.log("FETCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= CHILLER PLANT SUMMARY API =================

app.get("/api/chiller-plant-summary", async (req, res) => {
  const cookie = req.headers.cookie;

  console.log("\n=== CHILLER PLANT SUMMARY API REQUEST ===");
  console.log("Timestamp:", new Date().toISOString());

  if (!cookie?.includes("skyarc-auth")) {
    console.log(" No auth cookie found");
    return res.status(401).json({ error: "Not authenticated - please login first" });
  }

  const dateParam = req.query.date || new Date().toISOString().split("T")[0];

  console.log("Request params:");
  console.log("  date:", dateParam);

  const expr = `dg_chillerPlantSummary_jpe(${dateParam})`;
  const apiUrl = `${SKY_HOST}/api/mgmCotai/eval?expr=${expr}`;

  console.log("Final API URL:", apiUrl);

  try {
    console.log("Fetching from SkySpark...");
    const response = await fetch(apiUrl, {
      headers: {
        Cookie: cookie,
        "User-Agent": "ChillerDashboard/1.0"
      }
    });

    console.log("Response status:", response.status);
    const text = await response.text();

    console.log("Raw response length:", text.length, "chars");

    if (text.trim().startsWith("<") || text.includes("<!DOCTYPE") || text.includes("<html")) {
      console.log(" ERROR: Received HTML instead of CSV");
      return res.status(401).json({
        error: "Authentication failed with SkySpark",
        message: "Please login again.",
        statusCode: response.status
      });
    }

    if (!text.trim()) {
      console.log(" WARNING: Empty response from SkySpark");
      return res.status(200).type("text").send("");
    }

    console.log("Cleaning SkySpark metadata...");
    const cleaned = cleanSkySparkResponse(text);

    console.log("SUCCESS: Sending cleaned CSV data");
    res.type("text").send(cleaned);
  } catch (err) {
    console.log("FETCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= COOLING DEMAND API =================

app.get("/api/cooling-demand", async (req, res) => {
  const cookie = req.headers.cookie;

  console.log("\n=== COOLING DEMAND API REQUEST ===");
  console.log("Timestamp:", new Date().toISOString());

  if (!cookie?.includes("skyarc-auth")) {
    console.log(" No auth cookie found");
    return res.status(401).json({ error: "Not authenticated" });
  }

  const dateParam = req.query.date || new Date().toISOString().split("T")[0];
  const timeParam = req.query.time || "14:00";

  console.log("Request params:");
  console.log("  date:", dateParam);
  console.log("  time:", timeParam);

  const expr = `dg_coolingDemand_jpe(${dateParam}..${dateParam},%20%22${timeParam}%22)`;
  const apiUrl = `${SKY_HOST}/api/mgmCotai/eval?expr=${expr}`;

  console.log("Final API URL:", apiUrl);

  try {
    console.log("Fetching from SkySpark...");
    const response = await fetch(apiUrl, {
      headers: {
        Cookie: cookie
      }
    });

    console.log("Response status:", response.status);
    const text = await response.text();

    if (text.trim().startsWith("<") || text.includes("<!")) {
      console.log("❌ ERROR: Received HTML instead of CSV");
      return res.status(500).json({
        error: "SkySpark API returned error page (HTML)",
        statusCode: response.status
      });
    }

    if (!text.trim()) {
      console.log("⚠️ WARNING: Empty response from SkySpark");
      return res.status(200).type("text").send("");
    }

    const cleaned = cleanSkySparkResponse(text);

    console.log("✅ SUCCESS: Received data");
    res.type("text").send(cleaned);
  } catch (err) {
    console.log("❌ FETCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= LUX LEVEL API (MGM Macau) =================

app.get("/api/lux-level", async (req, res) => {
  const cookie = req.headers.cookie;

  if (!cookie?.includes("skyarc-auth")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const year  = req.query.year;
  const month = req.query.month;

  if (!year || !month) {
    return res.status(400).json({ error: "Missing year or month query params" });
  }

  const expr   = `get_luxLevel(${year}-${month})`;
  const apiUrl = `${SKY_HOST}/api/mgmMacauLora/eval?expr=${expr}`;

  console.log("\n=== LUX LEVEL API REQUEST ===");
  console.log("URL:", apiUrl);

  try {
    const response = await fetch(apiUrl, { headers: { Cookie: cookie } });
    const text     = await response.text();

    if (text.trim().startsWith("<")) {
      return res.status(401).json({ error: "Auth failed, please login again" });
    }

    const cleaned = cleanSkySparkResponse(text);
    res.type("text").send(cleaned);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= LUX LEVEL API (MGM Cotai) =================

app.get("/api/cotai/lux-level", async (req, res) => {
  const cookie = req.headers.cookie;

  if (!cookie?.includes("skyarc-auth")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const year  = req.query.year;
  const month = req.query.month;

  if (!year || !month) {
    return res.status(400).json({ error: "Missing year or month query params" });
  }

  const expr   = `get_luxLevel(${year}-${month})`;
  const apiUrl = `${SKY_HOST}/api/mgmCotaiLora/eval?expr=${expr}`;

  console.log("\n=== COTAI LUX LEVEL API REQUEST ===");
  console.log("URL:", apiUrl);

  try {
    const response = await fetch(apiUrl, { headers: { Cookie: cookie } });
    const text     = await response.text();

    if (text.trim().startsWith("<")) {
      return res.status(401).json({ error: "Auth failed, please login again" });
    }

    const cleaned = cleanSkySparkResponse(text);
    res.type("text").send(cleaned);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ACH LEVEL API (MGM Macau) =================

app.get("/api/ach-level", async (req, res) => {
  const cookie = req.headers.cookie;

  if (!cookie?.includes("skyarc-auth")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const year  = req.query.year;
  const month = req.query.month;

  if (!year || !month) {
    return res.status(400).json({ error: "Missing year or month query params" });
  }

  const expr   = `ach_analysis(${year}-${month})`;
  const apiUrl = `${SKY_HOST}/api/mgmMacauLora/eval?expr=${expr}`;

  console.log("\n=== ACH LEVEL API REQUEST ===");
  console.log("URL:", apiUrl);

  try {
    const response = await fetch(apiUrl, { headers: { Cookie: cookie } });
    const text     = await response.text();

    if (text.trim().startsWith("<")) {
      return res.status(401).json({ error: "Auth failed, please login again" });
    }

    const cleaned = cleanSkySparkResponse(text);
    res.type("text").send(cleaned);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= TEMPERATURE LEVEL API (MGM Macau) =================

app.get("/api/temperature-level", async (req, res) => {
  const cookie = req.headers.cookie;

  if (!cookie?.includes("skyarc-auth")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const year  = req.query.year;
  const month = req.query.month;

  if (!year || !month) {
    return res.status(400).json({ error: "Missing year or month query params" });
  }

  // Use the first day of the requested month as the date argument
  const expr   = `custComfort_temp(${year}-${month})`;
  const apiUrl = `${SKY_HOST}/api/mgmMacauLora/eval?expr=${encodeURIComponent(expr)}`;

  console.log("\n=== TEMPERATURE LEVEL API REQUEST ===");
  console.log("URL:", apiUrl);

  try {
    const response = await fetch(apiUrl, { headers: { Cookie: cookie } });
    const text     = await response.text();

    if (text.trim().startsWith("<")) {
      return res.status(401).json({ error: "Auth failed, please login again" });
    }

    const cleaned = cleanSkySparkResponse(text);
    res.type("text").send(cleaned);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ================= TEMPERATURE LEVEL API (MGM Cotai) =================
app.get("/api/cotai/temperature-level", async (req, res) => {
  const cookie = req.headers.cookie;

  if (!cookie?.includes("skyarc-auth")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const year  = req.query.year;
  const month = req.query.month;

  if (!year || !month) {
    return res.status(400).json({ error: "Missing year or month query params" });
  }

  const expr   = `custComfort_temp(${year}-${month})`;

  // ── Try mgmCotai (not mgmCotaiLora) for temperature
  const apiUrl = `${SKY_HOST}/api/mgmCotai/eval?expr=${encodeURIComponent(expr)}`;

  console.log("\n=== COTAI TEMPERATURE LEVEL API REQUEST ===");
  console.log("URL:", apiUrl);

  try {
    const response = await fetch(apiUrl, { headers: { Cookie: cookie } });
    const text     = await response.text();

    console.log("=== RAW RESPONSE (first 500 chars) ===");
    console.log(text.substring(0, 500));
    console.log("======================================");

    if (text.trim().startsWith("<")) {
      return res.status(401).json({ error: "Auth failed, please login again" });
    }

    // Don't use cleanSkySparkResponse for temperature — it has different structure
    // Just strip the ver line and the column header line, keep only data rows
    const lines   = text.replace(/\r/g, '').trim().split('\n');
    const dataLines = lines.filter(l => /^\d{4}-\d{2}-\d{2}/.test(l.trim()));

    console.log("=== DATA LINES FOUND:", dataLines.length, "===");
    dataLines.slice(0, 3).forEach(l => console.log(" ", l));

    const cleaned = dataLines.join('\n');
    res.type("text").send(cleaned);

  } catch (err) {
    console.error("FETCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// ================= ACH LEVEL API (MGM Cotai) =================
app.get("/api/cotai/ach-level", async (req, res) => {
  const cookie = req.headers.cookie;

  if (!cookie?.includes("skyarc-auth")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const year  = req.query.year;
  const month = req.query.month;

  if (!year || !month) {
    return res.status(400).json({ error: "Missing year or month query params" });
  }

  const expr   = `custComfort_ach(${year}-${month})`;
  const apiUrl = `${SKY_HOST}/api/mgmCotai/eval?expr=${encodeURIComponent(expr)}`;

  console.log("\n=== COTAI ACH LEVEL API REQUEST ===");
  console.log("URL:", apiUrl);

  try {
    const response = await fetch(apiUrl, { headers: { Cookie: cookie } });
    const text     = await response.text();

    console.log("=== RAW ACH RESPONSE (first 500 chars) ===");
    console.log(text.substring(0, 500));

    if (text.trim().startsWith("<")) {
      return res.status(401).json({ error: "Auth failed, please login again" });
    }

    // Only send data rows — skip ver line and header line
    const lines     = text.replace(/\r/g, '').trim().split('\n');
    const dataLines = lines.filter(l => l.trim().startsWith('"AH-'));

    console.log("=== ACH DATA LINES FOUND:", dataLines.length, "===");
    const cleaned = dataLines.join('\n');
    res.type("text").send(cleaned);

  } catch (err) {
    console.error("FETCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// ================= CSV =================

const dataDir     = path.join(__dirname, "../frontend/public/Data/executiveSummary");
const mainDataDir = path.join(__dirname, "../frontend/public/Data");

if (!fs.existsSync(mainDataDir)) fs.mkdirSync(mainDataDir, { recursive: true });
if (!fs.existsSync(dataDir))     fs.mkdirSync(dataDir, { recursive: true });

app.post("/api/file/upload/:fileName", (req, res) => {
  try {
    const fileName = req.params.fileName;
    const { content } = req.body || {};
    if (!fileName || typeof content !== "string") {
      return res.status(400).json({ error: "Invalid filename or content" });
    }
    fs.writeFileSync(path.join(dataDir, fileName), content);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Failed to save file" });
  }
});

app.get("/api/file/:fileName", (req, res) => {
  try {
    const fileName = req.params.fileName;

    let filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) filePath = path.join(mainDataDir, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    res.setHeader("Content-Type", "text/csv");
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("File read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================= SERVER =================

const PORT = 5002;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://10.69.80.144:${PORT}`);
});