const express    = require('express');
const db         = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/property/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user  = await db.findById(req.user.userId);
    const hotel = await db.getOrCreateHotel(req.user.userId, user?.hotelName);
    res.json(hotel);
  } catch (err) {
    console.error('property/me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/property/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { hotelName, location, stars, totalRooms, timezone } = req.body;
    const allowed = {};
    if (hotelName  !== undefined) allowed.hotelName  = String(hotelName).trim();
    if (location   !== undefined) allowed.location   = String(location).trim();
    if (stars)                    allowed.stars      = Math.min(5, Math.max(1, parseInt(stars)));
    if (totalRooms)               allowed.totalRooms = Math.max(1, parseInt(totalRooms));
    if (timezone)                 allowed.timezone   = String(timezone).trim();

    await db.getOrCreateHotel(req.user.userId, hotelName);
    const hotel = await db.updateHotelProfile(req.user.userId, allowed);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel.profile || hotel);
  } catch (err) {
    console.error('profile update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/property/metrics
router.post('/metrics', requireAuth, async (req, res) => {
  try {
    const ALLOWED = ['occupancy','adr','revpar','trevpar','goppar','revenueMtd','roomRevenueMtd','fbRevenueMtd','profitMtd'];
    const update = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) {
        const val = parseFloat(req.body[key]);
        if (!isNaN(val)) update[key] = val;
      }
    }
    if (Object.keys(update).length === 0)
      return res.status(400).json({ error: 'No valid metrics provided' });

    await db.getOrCreateHotel(req.user.userId, null);
    const hotel = await db.updateHotelMetrics(req.user.userId, update);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel.metrics || hotel);
  } catch (err) {
    console.error('metrics update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/property/rooms
router.put('/rooms', requireAuth, async (req, res) => {
  try {
    const { rooms } = req.body;
    if (!Array.isArray(rooms) || rooms.length === 0)
      return res.status(400).json({ error: 'rooms array required' });

    const normalized = rooms.map(r => ({
      id:    r.id || r.type.toLowerCase().replace(/\s+/g, '-'),
      type:  r.type,
      count: parseInt(r.count)  || 1,
      rate:  parseFloat(r.rate) || 0,
    }));

    await db.getOrCreateHotel(req.user.userId, null);
    const hotel = await db.setRooms(req.user.userId, normalized);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel.rooms || hotel);
  } catch (err) {
    console.error('rooms update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/property/rates/apply
router.post('/rates/apply', requireAuth, async (req, res) => {
  try {
    const { roomId, oldRate, newRate, reason } = req.body;
    if (!roomId || newRate === undefined)
      return res.status(400).json({ error: 'roomId and newRate are required' });

    await db.getOrCreateHotel(req.user.userId, null);
    const hotel = await db.applyRate(req.user.userId, {
      roomId,
      oldRate: parseFloat(oldRate) || 0,
      newRate: parseFloat(newRate),
      reason:  reason || '',
    });
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json({ success: true, rooms: hotel.rooms, appliedRates: (hotel.appliedRates || []).slice(0, 10) });
  } catch (err) {
    console.error('apply rate error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Daily metrics history ──────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NUMERIC_FIELDS = ['occupancy', 'adr', 'revpar', 'roomsSold', 'roomsAvail', 'roomRevenue', 'fbRevenue'];

function normalizeRecord(raw) {
  if (!raw || !DATE_RE.test(raw.date)) return null;
  const rec = { date: raw.date };
  for (const key of NUMERIC_FIELDS) {
    const val = parseFloat(raw[key]);
    if (!isNaN(val)) rec[key] = val;
  }
  if (rec.revpar === undefined && rec.adr !== undefined && rec.occupancy !== undefined) {
    rec.revpar = +(rec.adr * (rec.occupancy / 100)).toFixed(2);
  }
  // needs at least one metric beyond the date to be worth storing
  return Object.keys(rec).length > 1 ? rec : null;
}

// POST /api/property/metrics/daily — bulk upsert { records: [{date, occupancy, adr, ...}] }
router.post('/metrics/daily', requireAuth, async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0)
      return res.status(400).json({ error: 'records array is required' });

    const normalized = records.map(normalizeRecord).filter(Boolean);
    if (normalized.length === 0)
      return res.status(400).json({ error: 'No valid records — each needs a YYYY-MM-DD date plus at least one metric' });

    await db.upsertDailyMetrics(req.user.userId, normalized);
    res.json({ success: true, saved: normalized.length, skipped: records.length - normalized.length });
  } catch (err) {
    console.error('metrics/daily error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── CSV import — tolerant of real PMS exports (quoted fields, "M/D/YY" dates,
// "69.39%" occupancy, "2,292.41" thousands separators, trailing TOTAL/AVG rows) ──

// RFC4180-ish: respects quotes so a quoted field containing a comma
// (e.g. "2,292.41") isn't split into two cells.
function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { cells.push(cur); cur = ''; }
    else cur += ch;
  }
  cells.push(cur);
  return cells.map(c => c.trim());
}

// Column header → canonical field, matched case-insensitively after trimming.
const HEADER_ALIASES = {
  date: ['date'],
  occupancy: ['occ %', 'occupancy', 'occupancy %', 'occ'],
  adr: ['adr'],
  revpar: ['revpar', 'rev par'],
  roomsSold: ['total occupied rooms', 'rooms sold', 'occupied rooms'],
  roomsAvail: ['rooms available', 'total rooms', 'available rooms'],
  roomRevenue: ['room rev', 'room revenue'],
  fbRevenue: ['fb rev', 'f&b rev', 'f&b revenue', 'fb revenue'],
};

// Strips a UTF-8 BOM whether it survived as the real U+FEFF codepoint or was
// mangled into the 3-char "ï»¿" sequence by an intermediate re-encoding.
function stripBom(s) {
  return s.replace(/^﻿/, '').replace(/^ï»¿/, '');
}

function canonicalField(header) {
  const norm = stripBom(header).trim().toLowerCase();
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(norm)) return field;
  }
  return null;
}

// Accepts YYYY-MM-DD as-is, or M/D/YY(YY) as commonly exported by PMS reports.
function parseFlexibleDate(raw) {
  if (!raw) return null;
  const s = raw.trim();
  if (DATE_RE.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return null;
  let [, mo, d, y] = m;
  if (y.length === 2) y = (parseInt(y, 10) < 70 ? '20' : '19') + y;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// Strips %, $, and thousands-separator commas: "2,292.41" / "69.39%" → number.
// Also handles accounting-style negatives: "(2,607.97)" → -2607.97.
function cleanNumber(raw) {
  if (raw === undefined || raw === null || raw === '') return NaN;
  const s = String(raw).trim();
  const negative = /^\(.*\)$/.test(s);
  const cleaned = s.replace(/[,%$\s()]/g, '');
  const n = parseFloat(cleaned);
  if (isNaN(n)) return NaN;
  return negative ? -n : n;
}

// POST /api/property/metrics/import — CSV upload { csv: "..." }
router.post('/metrics/import', requireAuth, async (req, res) => {
  try {
    const { csv } = req.body;
    if (typeof csv !== 'string' || !csv.trim())
      return res.status(400).json({ error: 'csv string is required' });

    const lines = stripBom(csv).trim().split(/\r?\n/);
    const headerFields = parseCsvLine(lines[0]).map(canonicalField);

    if (!headerFields.includes('date'))
      return res.status(400).json({ error: 'CSV must have a Date column' });

    let skipped = 0;
    const normalized = [];
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      const cells = parseCsvLine(line);

      const rec = {};
      headerFields.forEach((field, i) => {
        if (!field) return;
        if (field === 'date') {
          const d = parseFlexibleDate(cells[i]);
          if (d) rec.date = d;
        } else {
          const n = cleanNumber(cells[i]);
          if (!isNaN(n)) rec[field] = n;
        }
      });

      // rows like the PMS "TOTAL/AVG" summary line have no parseable date — skip
      if (!rec.date || Object.keys(rec).length < 2) { skipped++; continue; }

      if (rec.revpar === undefined && rec.adr !== undefined && rec.occupancy !== undefined) {
        rec.revpar = +(rec.adr * (rec.occupancy / 100)).toFixed(2);
      }
      normalized.push(rec);
    }

    if (normalized.length === 0)
      return res.status(400).json({ error: 'No valid rows found — check the Date column and that at least one metric column matched.' });

    await db.upsertDailyMetrics(req.user.userId, normalized);
    res.json({ success: true, saved: normalized.length, skipped });
  } catch (err) {
    console.error('metrics/import error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

function aggregateMonthly(daily) {
  const byMonth = {};
  for (const r of daily) {
    const month = r.date.slice(0, 7);
    if (!byMonth[month]) byMonth[month] = { month, adrSum: 0, revparSum: 0, occSum: 0, roomRevenue: 0, fbRevenue: 0, count: 0 };
    const b = byMonth[month];
    if (r.adr      !== undefined) { b.adrSum    += r.adr;      }
    if (r.revpar   !== undefined) { b.revparSum += r.revpar;   }
    if (r.occupancy!== undefined) { b.occSum    += r.occupancy;}
    if (r.roomRevenue !== undefined) b.roomRevenue += r.roomRevenue;
    if (r.fbRevenue   !== undefined) b.fbRevenue   += r.fbRevenue;
    b.count++;
  }
  return Object.values(byMonth)
    .map(b => ({
      month: b.month,
      adr: b.count ? +(b.adrSum / b.count).toFixed(2) : 0,
      revpar: b.count ? +(b.revparSum / b.count).toFixed(2) : 0,
      occupancy: b.count ? +(b.occSum / b.count).toFixed(1) : 0,
      roomRevenue: +b.roomRevenue.toFixed(2),
      fbRevenue: +b.fbRevenue.toFixed(2),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// GET /api/property/metrics/history?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/metrics/history', requireAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const daily = await db.getDailyMetrics(req.user.userId, from, to);
    res.json({ daily, monthly: aggregateMonthly(daily) });
  } catch (err) {
    console.error('metrics/history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
