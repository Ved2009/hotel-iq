// Simple persistent JSON store — no native bindings required
const fs = require('fs');
const path = require('path');

const DATA_DIR    = path.join(__dirname, 'data');
const DB_FILE     = path.join(DATA_DIR, 'users.json');
const HOTELS_FILE = path.join(DATA_DIR, 'hotels.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Users ─────────────────────────────────────────────────────────────────────
function load() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return {}; }
}
function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── Hotels ────────────────────────────────────────────────────────────────────
function loadHotels() {
  try { return JSON.parse(fs.readFileSync(HOTELS_FILE, 'utf8')); }
  catch { return {}; }
}
function saveHotels(data) {
  fs.writeFileSync(HOTELS_FILE, JSON.stringify(data, null, 2));
}

function defaultHotel(hotelName) {
  return {
    profile: {
      hotelName: hotelName || 'My Hotel',
      location: '',
      stars: 4,
      totalRooms: 100,
      timezone: 'America/New_York',
    },
    metrics: {
      updatedAt: null,
      occupancy: null,
      adr: null,
      revpar: null,
      trevpar: null,
      goppar: null,
      revenueMtd: null,
      roomRevenueMtd: null,
      fbRevenueMtd: null,
      profitMtd: null,
    },
    rooms: [
      { id: 'standard-king',    type: 'Standard King',    count: 40, rate: 159 },
      { id: 'double-queen',     type: 'Double Queen',     count: 30, rate: 139 },
      { id: 'ocean-view-suite', type: 'Ocean View Suite', count: 20, rate: 289 },
      { id: 'executive-floor',  type: 'Executive Floor',  count: 7,  rate: 349 },
      { id: 'junior-suite',     type: 'Junior Suite',     count: 3,  rate: 229 },
    ],
    appliedRates: [],
  };
}

module.exports = {
  // ── Users ──
  findByEmail(email) {
    return load()[email.toLowerCase()] || null;
  },
  insert(user) {
    const data = load();
    if (data[user.email]) throw Object.assign(new Error('Email already registered'), { code: 'DUPLICATE' });
    data[user.email] = user;
    save(data);
  },
  findById(userId) {
    const data = load();
    return Object.values(data).find(u => u.id === userId) || null;
  },

  // ── Hotels ──
  getOrCreateHotel(userId, hotelName) {
    const hotels = loadHotels();
    if (!hotels[userId]) {
      hotels[userId] = defaultHotel(hotelName);
      saveHotels(hotels);
    }
    return hotels[userId];
  },
  updateHotelProfile(userId, fields) {
    const hotels = loadHotels();
    if (!hotels[userId]) return null;
    hotels[userId].profile = { ...hotels[userId].profile, ...fields };
    saveHotels(hotels);
    return hotels[userId];
  },
  updateHotelMetrics(userId, metrics) {
    const hotels = loadHotels();
    if (!hotels[userId]) return null;
    hotels[userId].metrics = {
      ...hotels[userId].metrics,
      ...metrics,
      updatedAt: new Date().toISOString(),
    };
    saveHotels(hotels);
    return hotels[userId];
  },
  setRooms(userId, rooms) {
    const hotels = loadHotels();
    if (!hotels[userId]) return null;
    hotels[userId].rooms = rooms;
    saveHotels(hotels);
    return hotels[userId];
  },
  applyRate(userId, { roomId, oldRate, newRate, reason }) {
    const hotels = loadHotels();
    if (!hotels[userId]) return null;
    const room = hotels[userId].rooms.find(r => r.id === roomId);
    if (room) room.rate = newRate;
    hotels[userId].appliedRates.unshift({
      roomId, oldRate, newRate, reason,
      appliedAt: new Date().toISOString(),
    });
    hotels[userId].appliedRates = hotels[userId].appliedRates.slice(0, 100);
    saveHotels(hotels);
    return hotels[userId];
  },
};
