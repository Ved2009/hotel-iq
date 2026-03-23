const express = require("express");
const router = express.Router();

// ── In-memory cache (15 minutes) ──────────────────────────────────────────────
const cache = {};
const CACHE_TTL = 15 * 60 * 1000;

// ── SerpAPI: Google Hotels real rate fetching ─────────────────────────────────
async function fetchLiveRates(location, checkIn, checkOut) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      engine: "google_hotels",
      q: location,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: "2",
      currency: "USD",
      gl: "us",
      hl: "en",
      api_key: apiKey,
    });

    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      headers: { "User-Agent": "HotelIQ/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const hotels = data.properties || [];

    return hotels
      .slice(0, 10)
      .map((h) => ({
        name: h.name,
        rate: h.rate_per_night?.lowest
          ? parseInt(h.rate_per_night.lowest.replace(/[^0-9]/g, ""), 10)
          : null,
        stars: parseInt(h.hotel_class) || 3,
        score: parseFloat(h.overall_rating) || 4.0,
        reviews: h.reviews || null,
        thumbnail: h.thumbnail || null,
        source: "Google Hotels",
        link: h.link || null,
      }))
      .filter((h) => h.rate && h.rate > 50 && h.rate < 2000);
  } catch (err) {
    console.error("[compset] SerpAPI fetch failed:", err.message);
    return null;
  }
}

// ── Mock data (used when no SERPAPI_KEY or fetch fails) ───────────────────────
function buildMockRates() {
  // Add subtle time-based variation so rates "move" realistically
  const seed = Math.floor(Date.now() / (5 * 60 * 1000)); // changes every 5 min
  const jitter = (base, range, s) =>
    base + Math.round((Math.sin(s * seed * 137.5 + s * 17) * 0.5 + 0.5) * range - range / 2);

  return [
    { name: "Grand Regency",   rate: jitter(210, 20, 1), stars: 5, score: 4.7, reviews: 1842, source: "demo", change: jitter(0,4,11)-2 },
    { name: "The Meridian",    rate: jitter(222, 16, 2), stars: 5, score: 4.8, reviews: 2103, source: "demo", change: jitter(0,4,12)-2 },
    { name: "Harbor View",     rate: jitter(196, 18, 3), stars: 4, score: 4.3, reviews: 963,  source: "demo", change: jitter(0,4,13)-2 },
    { name: "Blue Harbor",     rate: jitter(174, 22, 4), stars: 3, score: 4.1, reviews: 751,  source: "demo", change: jitter(0,4,14)-2 },
    { name: "Coastal Suites",  rate: jitter(163, 18, 5), stars: 3, score: 3.9, reviews: 548,  source: "demo", change: jitter(0,4,15)-2 },
  ];
}

// ── Rate analysis helpers ─────────────────────────────────────────────────────
function analyzeRates(hotels, yourRate) {
  const sorted   = [...hotels].sort((a, b) => b.rate - a.rate);
  const rates    = hotels.map((h) => h.rate);
  const avgComp  = Math.round(rates.reduce((s, r) => s + r, 0) / rates.length);
  const maxRate  = Math.max(...rates);
  const minRate  = Math.min(...rates);
  const position = sorted.findIndex((h) => yourRate >= h.rate) + 1;
  const parity   = (((yourRate - avgComp) / avgComp) * 100).toFixed(1);

  // AI rate suggestion based on position and demand
  const suggestion =
    yourRate < avgComp - 10 ? Math.round(avgComp * 0.98)
    : yourRate > avgComp + 30 ? Math.round(avgComp * 1.05)
    : Math.round(yourRate * 1.03);

  return { sorted, avgComp, maxRate, minRate, position, parity, suggestion };
}

// ── Route: GET /api/compset/rates ─────────────────────────────────────────────
router.get("/rates", async (req, res) => {
  const {
    location = "beachfront hotels",
    checkIn,
    checkOut,
    yourRate = 189,
  } = req.query;

  const cacheKey = `${location}-${checkIn}-${checkOut}`;
  const now = Date.now();

  // Return cached data if still fresh
  if (cache[cacheKey] && now - cache[cacheKey].ts < CACHE_TTL) {
    return res.json({ ...cache[cacheKey].data, cached: true });
  }

  // Build check-in/out dates (tomorrow + next day by default)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  const ci = checkIn  || tomorrow.toISOString().split("T")[0];
  const co = checkOut || dayAfter.toISOString().split("T")[0];

  // Try live data, fall back to mock
  const liveHotels = await fetchLiveRates(location, ci, co);
  const hotels     = liveHotels || buildMockRates();
  const isLive     = !!liveHotels;

  const analysis = analyzeRates(hotels, parseInt(yourRate, 10));

  const payload = {
    hotels,
    yourRate: parseInt(yourRate, 10),
    location,
    checkIn: ci,
    checkOut: co,
    isLive,
    hasSerpApiKey: !!process.env.SERPAPI_KEY,
    fetchedAt: new Date().toISOString(),
    analysis,
  };

  cache[cacheKey] = { data: payload, ts: now };
  res.json(payload);
});

// ── Route: GET /api/compset/setup ─────────────────────────────────────────────
// Returns info about data source configuration
router.get("/setup", (_req, res) => {
  res.json({
    hasSerpApiKey: !!process.env.SERPAPI_KEY,
    mode: process.env.SERPAPI_KEY ? "live" : "demo",
    instructions: process.env.SERPAPI_KEY
      ? "Live data: Google Hotels via SerpAPI"
      : "Demo mode. Add SERPAPI_KEY to .env for real competitor rates from Google Hotels.",
    serpApiUrl: "https://serpapi.com/register",
  });
});

module.exports = router;
