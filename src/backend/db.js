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

  // ── Password reset tokens ──
  async createResetToken(email, token) {
    const record = { token, email: email.toLowerCase(), createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), usedAt: null };
    if (MONGO_URI) {
      const db = await mongo();
      await db.collection('resetTokens').deleteMany({ email: email.toLowerCase() }); // clear old tokens
      await db.collection('resetTokens').insertOne(record);
      return record;
    }
    const file = path.join(DATA_DIR, 'reset_tokens.json');
    const data = fileLoad(file);
    // Clear old tokens for this email
    for (const k of Object.keys(data)) { if (data[k].email === email.toLowerCase()) delete data[k]; }
    data[token] = record;
    fileSave(file, data);
    return record;
  },

  async getResetToken(token) {
    if (MONGO_URI) {
      const db = await mongo();
      return db.collection('resetTokens').findOne({ token }, { projection: { _id: 0 } });
    }
    return fileLoad(path.join(DATA_DIR, 'reset_tokens.json'))[token] || null;
  },

  async useResetToken(token) {
    if (MONGO_URI) {
      const db = await mongo();
      await db.collection('resetTokens').updateOne({ token }, { $set: { usedAt: new Date().toISOString() } });
      return;
    }
    const file = path.join(DATA_DIR, 'reset_tokens.json');
    const data = fileLoad(file);
    if (data[token]) data[token].usedAt = new Date().toISOString();
    fileSave(file, data);
  },

  async setPassword(email, hashedPassword) {
    if (MONGO_URI) {
      const db = await mongo();
      await db.collection('users').updateOne({ email: email.toLowerCase() }, { $set: { password: hashedPassword } });
      return;
    }
    const data = fileLoad(DB_FILE);
    const key = email.toLowerCase();
    if (data[key]) { data[key].password = hashedPassword; fileSave(DB_FILE, data); }
  },

  // ── Invite tokens ──
  async createInvite(token, createdBy) {
    const invite = { token, createdBy, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), usedAt: null, usedBy: null };
    if (MONGO_URI) {
      const db = await mongo();
      await db.collection('invites').insertOne(invite);
      return invite;
    }
    const data = fileLoad(path.join(DATA_DIR, 'invites.json'));
    data[token] = invite;
    fileSave(path.join(DATA_DIR, 'invites.json'), data);
    return invite;
  },

  async getInvite(token) {
    if (MONGO_URI) {
      const db = await mongo();
      return db.collection('invites').findOne({ token }, { projection: { _id: 0 } });
    }
    return fileLoad(path.join(DATA_DIR, 'invites.json'))[token] || null;
  },

  async useInvite(token, usedBy) {
    if (MONGO_URI) {
      const db = await mongo();
      await db.collection('invites').updateOne({ token }, { $set: { usedAt: new Date().toISOString(), usedBy } });
      return;
    }
    const data = fileLoad(path.join(DATA_DIR, 'invites.json'));
    if (data[token]) { data[token].usedAt = new Date().toISOString(); data[token].usedBy = usedBy; }
    fileSave(path.join(DATA_DIR, 'invites.json'), data);
  },

  async listInvites() {
    if (MONGO_URI) {
      const db = await mongo();
      return db.collection('invites').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
    }
    return Object.values(fileLoad(path.join(DATA_DIR, 'invites.json')));
  },

  // ── User management (admin) ──
  async listUsers() {
    if (MONGO_URI) {
      const db = await mongo();
      return db.collection('users').find({}, { projection: { _id: 0, password: 0 } }).toArray();
    }
    const data = fileLoad(DB_FILE);
    return Object.values(data).map(({ password, ...u }) => u);
  },

  async updateUser(userId, fields) {
    if (MONGO_URI) {
      const db = await mongo();
      await db.collection('users').updateOne({ id: userId }, { $set: fields });
      return db.collection('users').findOne({ id: userId }, { projection: { _id: 0, password: 0 } });
    }
    const data = fileLoad(DB_FILE);
    const key = Object.keys(data).find(k => data[k].id === userId);
    if (!key) return null;
    data[key] = { ...data[key], ...fields };
    fileSave(DB_FILE, data);
    const { password, ...user } = data[key];
    return user;
  },

  // ── Daily metrics history (occupancy/ADR/revenue time series) ────────────────
  // One row per {userId, date}. Foundation for forecasting/trend charts.
  async upsertDailyMetrics(userId, records) {
    if (MONGO_URI) {
      const db = await mongo();
      const col = db.collection('dailyMetrics');
      for (const r of records) {
        await col.updateOne(
          { userId, date: r.date },
          { $set: { ...r, userId, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      }
      return;
    }
    const file = path.join(DATA_DIR, 'daily_metrics.json');
    const data = fileLoad(file);
    if (!data[userId]) data[userId] = {};
    for (const r of records) {
      data[userId][r.date] = { ...r, updatedAt: new Date().toISOString() };
    }
    fileSave(file, data);
  },

  async getDailyMetrics(userId, from, to) {
    if (MONGO_URI) {
      const db = await mongo();
      const filter = { userId };
      if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = from;
        if (to)   filter.date.$lte = to;
      }
      return db.collection('dailyMetrics').find(filter, { projection: { _id: 0 } }).sort({ date: 1 }).toArray();
    }
    const file = path.join(DATA_DIR, 'daily_metrics.json');
    const rows = Object.values(fileLoad(file)[userId] || {});
    return rows
      .filter(r => (!from || r.date >= from) && (!to || r.date <= to))
      .sort((a, b) => a.date.localeCompare(b.date));
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
