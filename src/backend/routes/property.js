const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/property/me — full hotel data (profile + metrics + rooms)
router.get('/me', requireAuth, (req, res) => {
  const user = db.findById(req.user.userId);
  const hotel = db.getOrCreateHotel(req.user.userId, user?.hotelName);
  res.json(hotel);
});

// PUT /api/property/profile — update hotel name, location, stars, room count
router.put('/profile', requireAuth, (req, res) => {
  const { hotelName, location, stars, totalRooms, timezone } = req.body;
  const allowed = {};
  if (hotelName)      allowed.hotelName  = String(hotelName).trim();
  if (location !== undefined) allowed.location = String(location).trim();
  if (stars)          allowed.stars      = Math.min(5, Math.max(1, parseInt(stars)));
  if (totalRooms)     allowed.totalRooms = Math.max(1, parseInt(totalRooms));
  if (timezone)       allowed.timezone   = String(timezone).trim();

  db.getOrCreateHotel(req.user.userId, hotelName);
  const hotel = db.updateHotelProfile(req.user.userId, allowed);
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  res.json(hotel.profile);
});

// POST /api/property/metrics — update current KPIs (manual entry or PMS push)
router.post('/metrics', requireAuth, (req, res) => {
  const ALLOWED = [
    'occupancy', 'adr', 'revpar', 'trevpar', 'goppar',
    'revenueMtd', 'roomRevenueMtd', 'fbRevenueMtd', 'profitMtd',
  ];
  const update = {};
  for (const key of ALLOWED) {
    if (req.body[key] !== undefined) {
      const val = parseFloat(req.body[key]);
      if (!isNaN(val)) update[key] = val;
    }
  }
  if (Object.keys(update).length === 0)
    return res.status(400).json({ error: 'No valid metrics provided' });

  db.getOrCreateHotel(req.user.userId, null);
  const hotel = db.updateHotelMetrics(req.user.userId, update);
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  res.json(hotel.metrics);
});

// PUT /api/property/rooms — replace full room list
router.put('/rooms', requireAuth, (req, res) => {
  const { rooms } = req.body;
  if (!Array.isArray(rooms) || rooms.length === 0)
    return res.status(400).json({ error: 'rooms array required' });

  db.getOrCreateHotel(req.user.userId, null);
  const normalized = rooms.map(r => ({
    id: r.id || r.type.toLowerCase().replace(/\s+/g, '-'),
    type: r.type,
    count: parseInt(r.count) || 1,
    rate: parseFloat(r.rate) || 0,
  }));
  const hotel = db.setRooms(req.user.userId, normalized);
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  res.json(hotel.rooms);
});

// POST /api/property/rates/apply — apply a pricing recommendation
router.post('/rates/apply', requireAuth, (req, res) => {
  const { roomId, oldRate, newRate, reason } = req.body;
  if (!roomId || newRate === undefined)
    return res.status(400).json({ error: 'roomId and newRate are required' });

  db.getOrCreateHotel(req.user.userId, null);
  const hotel = db.applyRate(req.user.userId, {
    roomId,
    oldRate: parseFloat(oldRate) || 0,
    newRate: parseFloat(newRate),
    reason: reason || '',
  });
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  res.json({ success: true, rooms: hotel.rooms, appliedRates: hotel.appliedRates.slice(0, 10) });
});

module.exports = router;
