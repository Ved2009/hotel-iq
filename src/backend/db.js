// Simple persistent JSON store — no native bindings required
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE  = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return {}; }
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  findByEmail(email) {
    return load()[email.toLowerCase()] || null;
  },
  insert(user) {
    const data = load();
    if (data[user.email]) throw Object.assign(new Error('Email already registered'), { code: 'DUPLICATE' });
    data[user.email] = user;
    save(data);
  },
};
