// db.js — MongoDB (production) or JSON-file (local dev)
// Set MONGODB_URI env var to use MongoDB; omit it for local flat-file mode.
const fs   = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGODB_URI;

// ── MongoDB ────────────────────────────────────────────────────────────────────
let _mongoDb = null;

async function mongo() {
  if (_mongoDb) return _mongoDb;
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  _mongoDb = client.db('hoteliq');
  console.log('  MongoDB       → connected');
  return _mongoDb;
}

// ── JSON file fallback (local dev) ────────────────────────────────────────────
const DATA_DIR    = path.join(__dirname, 'data');
const DB_FILE     = path.join(DATA_DIR, 'users.json');
const HOTELS_FILE = path.join(DATA_DIR, 'hotels.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function fileLoad(file)       { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; } }
function fileSave(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// ── Default hotel shape ────────────────────────────────────────────────────────
function defaultHotel(hotelName) {
  return {
    profile: { hotelName: hotelName || 'My Hotel', location: '', stars: 4, totalRooms: 100, timezone: 'America/New_York' },
    metrics: {
      updatedAt: null,
      occupancy: null, adr: null, revpar: null, trevpar: null, goppar: null,
      revenueMtd: null, roomRevenueMtd: null, fbRevenueMtd: null, profitMtd: null,
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

// ── Exported API (all async) ───────────────────────────────────────────────────
module.exports = {

  // ── Users ──
  async findByEmail(email) {
    const key = email.toLowerCase();
    if (MONGO_URI) {
      const db = await mongo();
      return db.collection('users').findOne({ email: key }, { projection: { _id: 0 } });
    }
    return fileLoad(DB_FILE)[key] || null;
  },

  async findById(userId) {
    if (MONGO_URI) {
      const db = await mongo();
      return db.collection('users').findOne({ id: userId }, { projection: { _id: 0 } });
    }
    const data = fileLoad(DB_FILE);
    return Object.values(data).find(u => u.id === userId) || null;
  },

  async insert(user) {
    const key = user.email.toLowerCase();
    if (MONGO_URI) {
      const db = await mongo();
      const exists = await db.collection('users').findOne({ email: key });
      if (exists) throw Object.assign(new Error('Email already registered'), { code: 'DUPLICATE' });
      await db.collection('users').insertOne({ ...user, email: key });
      return;
    }
    const data = fileLoad(DB_FILE);
    if (data[key]) throw Object.assign(new Error('Email already registered'), { code: 'DUPLICATE' });
    data[key] = { ...user, email: key };
    fileSave(DB_FILE, data);
  },

  // ── Hotels ──
  async getOrCreateHotel(userId, hotelName) {
    if (MONGO_URI) {
      const db = await mongo();
      let hotel = await db.collection('hotels').findOne({ userId }, { projection: { _id: 0 } });
      if (!hotel) {
        hotel = { userId, ...defaultHotel(hotelName) };
        await db.collection('hotels').insertOne(hotel);
      }
      return hotel;
    }
    const hotels = fileLoad(HOTELS_FILE);
    if (!hotels[userId]) {
      hotels[userId] = defaultHotel(hotelName);
      fileSave(HOTELS_FILE, hotels);
    }
    return hotels[userId];
  },

  async updateHotelProfile(userId, fields) {
    if (MONGO_URI) {
      const db = await mongo();
      const result = await db.collection('hotels').findOneAndUpdate(
        { userId },
        { $set: Object.fromEntries(Object.entries(fields).map(([k, v]) => [`profile.${k}`, v])) },
        { returnDocument: 'after', projection: { _id: 0 } }
      );
      return result;
    }
    const hotels = fileLoad(HOTELS_FILE);
    if (!hotels[userId]) return null;
    hotels[userId].profile = { ...hotels[userId].profile, ...fields };
    fileSave(HOTELS_FILE, hotels);
    return hotels[userId];
  },

  async updateHotelMetrics(userId, metrics) {
    const update = { ...metrics, updatedAt: new Date().toISOString() };
    if (MONGO_URI) {
      const db = await mongo();
      const result = await db.collection('hotels').findOneAndUpdate(
        { userId },
        { $set: Object.fromEntries(Object.entries(update).map(([k, v]) => [`metrics.${k}`, v])) },
        { returnDocument: 'after', projection: { _id: 0 } }
      );
      return result;
    }
    const hotels = fileLoad(HOTELS_FILE);
    if (!hotels[userId]) return null;
    hotels[userId].metrics = { ...hotels[userId].metrics, ...update };
    fileSave(HOTELS_FILE, hotels);
    return hotels[userId];
  },

  async setRooms(userId, rooms) {
    if (MONGO_URI) {
      const db = await mongo();
      const result = await db.collection('hotels').findOneAndUpdate(
        { userId },
        { $set: { rooms } },
        { returnDocument: 'after', projection: { _id: 0 } }
      );
      return result;
    }
    const hotels = fileLoad(HOTELS_FILE);
    if (!hotels[userId]) return null;
    hotels[userId].rooms = rooms;
    fileSave(HOTELS_FILE, hotels);
    return hotels[userId];
  },

  async applyRate(userId, { roomId, oldRate, newRate, reason }) {
    if (MONGO_URI) {
      const db = await mongo();
      const hotel = await db.collection('hotels').findOne({ userId }, { projection: { _id: 0 } });
      if (!hotel) return null;
      const rooms = (hotel.rooms || []).map(r => r.id === roomId ? { ...r, rate: newRate } : r);
      const entry = { roomId, oldRate, newRate, reason, appliedAt: new Date().toISOString() };
      const appliedRates = [entry, ...(hotel.appliedRates || [])].slice(0, 100);
      const result = await db.collection('hotels').findOneAndUpdate(
        { userId },
        { $set: { rooms, appliedRates } },
        { returnDocument: 'after', projection: { _id: 0 } }
      );
      return result;
    }
    const hotels = fileLoad(HOTELS_FILE);
    if (!hotels[userId]) return null;
    const room = hotels[userId].rooms.find(r => r.id === roomId);
    if (room) room.rate = newRate;
    hotels[userId].appliedRates.unshift({ roomId, oldRate, newRate, reason, appliedAt: new Date().toISOString() });
    hotels[userId].appliedRates = hotels[userId].appliedRates.slice(0, 100);
    fileSave(HOTELS_FILE, hotels);
    return hotels[userId];
  },
};
