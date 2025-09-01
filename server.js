const express = require("express");
const cors = require("cors");
const path = require("path"); // Import the path module

const app = express();
const PORT = process.env.PORT || 5000;

const NASA_API_KEY = process.env.NASA_API_KEY || "DEMO_KEY";

app.use(cors());
app.use(express.json());

// Serve static files: first from mars-backend/public (if you add assets there), then from the project root
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.resolve(__dirname, '..')));

const wasteTypes = [
  { type: "organic", efficiency: 0.4, byproducts: ["water", "CO2"] },
  { type: "plastics", efficiency: 0.3, byproducts: ["syngas", "char"] },
  { type: "metals", efficiency: 0.1, byproducts: ["slag"] },
  { type: "glass", efficiency: 0.05, byproducts: ["slag"] },
  { type: "textiles", efficiency: 0.35, byproducts: ["syngas", "char"] },
  { type: "electronics", efficiency: 0.25, byproducts: ["rare metals", "toxic residue"] },
  { type: "other", efficiency: 0.2, byproducts: ["mixed residue"] }
];

// This root route is now handled by express.static serving index.html
// You can keep a separate API root if you wish, e.g., at /api
app.get("/api", (req, res) => {
  res.json({ message: "🚀 Mars Recycler Backend API is running!" });
});

app.get("/api/waste-types", (req, res) => res.json(wasteTypes));

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

app.post("/api/process", (req, res) => {
  const { wasteMix, totalWeight } = req.body;

  if (!wasteMix || typeof wasteMix !== 'object' || !totalWeight || totalWeight <= 0) {
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

app.get("/api/mars-weather", async (req, res) => {
  try {
    const url = `https://api.nasa.gov/insight_weather/?api_key=${NASA_API_KEY}&feedtype=json&ver=1.0`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();

    const keys = Array.isArray(data?.sol_keys) ? data.sol_keys : [];
    if (keys.length === 0) {
      return res.json({
        available: false,
        note: "No current weather data. InSight mission has ended; feed is archival/irregular.",
        source: "NASA InSight (archival)",
      });
    }

    const latestSol = keys[keys.length - 1];
    const w = data[latestSol] || {};
    return res.json({
      available: true,
      sol: latestSol,
      date: w.First_UTC || null,
      temp: w.AT?.av ?? null,
      wind: w.HWS?.av ?? null,
      pressure: w.PRE?.av ?? null,
      source: "NASA InSight",
    });
  } catch (err) {
    return res.status(200).json({
      available: false,
      note: "Weather feed unreachable or empty.",
      error: String(err?.message || err),
      source: "NASA InSight (archival)",
    });
  }
});

app.get("/api/mars-photos", async (req, res) => {
  const solsToTry = [1000, 2000, 2500, 3000];
  const maxPhotos = 8;

  try {
    for (const sol of solsToTry) {
      const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=${sol}&api_key=${NASA_API_KEY}`;
      const r = await fetch(url);
      if (!r.ok) continue;
      const data = await r.json();
      const photos = Array.isArray(data?.photos) ? data.photos : [];
      if (photos.length > 0) {
        return res.json({
          photos: photos.slice(0, maxPhotos).map((p) => p.img_src),
          sol,
          rover: "Curiosity",
          source: "NASA Mars Rover Photos",
        });
      }
    }
    return res.json({
      photos: [],
      note: "No photos found for fallback sols.",
      source: "NASA Mars Rover Photos",
    });
  } catch (err) {
    return res.status(200).json({
      photos: [],
      note: "Rover photo service unreachable.",
      error: String(err?.message || err),
      source: "NASA Mars Rover Photos",
    });
  }
});

// Root: serve the app entry from project root
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'index.html'));
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
