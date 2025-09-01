// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch"); // Make sure to install node-fetch v2 for Node <18

const app = express();
const NASA_API_KEY = process.env.NASA_API_KEY || "DEMO_KEY";

app.use(cors());
app.use(express.json());

// === Serve frontend files ===
// All files in the same folder as server.js
app.use(express.static(path.join(__dirname)));

// === API routes ===
const wasteTypes = [
  { type: "organic", efficiency: 0.4, byproducts: ["water", "CO2"] },
  { type: "plastics", efficiency: 0.3, byproducts: ["syngas", "char"] },
  { type: "metals", efficiency: 0.1, byproducts: ["slag"] },
  { type: "glass", efficiency: 0.05, byproducts: ["slag"] },
  { type: "textiles", efficiency: 0.35, byproducts: ["syngas", "char"] },
  { type: "electronics", efficiency: 0.25, byproducts: ["rare metals", "toxic residue"] },
  { type: "other", efficiency: 0.2, byproducts: ["mixed residue"] }
];

// Health check
app.get("/api", (req, res) => {
  res.json({ message: "🚀 Mars Recycler Backend API is running!" });
});

// Waste types
app.get("/api/waste-types", (req, res) => res.json(wasteTypes));

// Workflow steps
app.get("/api/workflow", (req, res) => {
  res.json({
    steps: [
      "Collect waste on Mars base",
      "Sort waste (organic, plastic, metal, e-waste)",
      "Send to recycling module",
      "Convert into energy via plasma/biogas/pyrolysis",
      "Store generated energy for habitat use",
    ],
  });
});

// Process waste
app.post("/api/process", (req, res) => {
  const { wasteMix, totalWeight } = req.body;
  if (!wasteMix || typeof wasteMix !== "object" || !totalWeight || totalWeight <= 0) {
    return res.status(400).json({ error: "Invalid input. Provide wasteMix object and totalWeight." });
  }

  let totalEnergy = 0;
  const byproducts = new Set();

  for (const type in wasteMix) {
    const percentage = wasteMix[type];
    const wasteInfo = wasteTypes.find(w => w.type === type);
    if (wasteInfo && percentage > 0) {
      totalEnergy += (percentage / 100) * totalWeight * wasteInfo.efficiency;
      wasteInfo.byproducts.forEach(bp => byproducts.add(bp));
    }
  }

  res.json({
    input_weight: totalWeight,
    energy_kwh: +totalEnergy.toFixed(3),
    byproducts: Array.from(byproducts),
  });
});

// NASA InSight weather
app.get("/api/mars-weather", async (req, res) => {
  try {
    const r = await fetch(`https://api.nasa.gov/insight_weather/?api_key=${NASA_API_KEY}&feedtype=json&ver=1.0`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();

    const keys = Array.isArray(data?.sol_keys) ? data.sol_keys : [];
    if (!keys.length) return res.json({ available: false, note: "No current weather data." });

    const latestSol = keys[keys.length - 1];
    const w = data[latestSol] || {};
    res.json({
      available: true,
      sol: latestSol,
      date: w.First_UTC || null,
      temp: w.AT?.av ?? null,
      wind: w.HWS?.av ?? null,
      pressure: w.PRE?.av ?? null,
    });
  } catch (err) {
    res.json({ available: false, error: String(err) });
  }
});

// NASA Mars rover photos
app.get("/api/mars-photos", async (req, res) => {
  const solsToTry = [1000, 2000, 2500, 3000];
  const maxPhotos = 8;

  try {
    for (const sol of solsToTry) {
      const r = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=${sol}&api_key=${NASA_API_KEY}`);
      if (!r.ok) continue;
      const data = await r.json();
      const photos = Array.isArray(data?.photos) ? data.photos : [];
      if (photos.length > 0) {
        return res.json({ photos: photos.slice(0, maxPhotos).map(p => p.img_src), sol });
      }
    }
    res.json({ photos: [], note: "No photos found." });
  } catch (err) {
    res.json({ photos: [], error: String(err) });
  }
});

// === Serve i3.html at root ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "i3.html"));
});

// === Start server ===
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Backend API running at http://localhost:${PORT}`);
});
