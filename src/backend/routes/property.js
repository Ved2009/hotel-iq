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

module.exports = router;
