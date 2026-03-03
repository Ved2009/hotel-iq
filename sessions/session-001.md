# Session 001 — Foundation: Backend + Frontend Auth + Sessions
**Date:** 2026-03-03
**Status:** COMPLETE ✅

---

## What Was Built

### Backend (`src/backend/`)
| File | What it does |
|------|-------------|
| `server.js` | Express app, CORS, mounts `/api/auth` and `/api/ai`, serves frontend build in prod |
| `routes/auth.js` | POST `/register`, POST `/login`, GET `/me` — bcryptjs + JWT (7-day tokens) |
| `routes/ai.js` | POST `/api/ai/chat` — authenticated Claude proxy (keeps API key server-side only) |
| `package.json` | bcryptjs, cors, dotenv, express, jsonwebtoken + nodemon dev dep |
| `.env.example` | Template for PORT, JWT_SECRET, ANTHROPIC_API_KEY, FRONTEND_URL |
| `data/` | Created but empty — `users.json` written here on first register (gitignored) |

### Frontend (`src/frontend/`)
| File | What it does |
|------|-------------|
| `App.jsx` | Root component — checks `hiq-token` in localStorage, routes to Auth or Dashboard |
| `Auth.jsx` | Login + Register forms, luxury dark theme matching marketing site |
| `index.js` | Updated to render `<App />` instead of `<HotelIQ />` directly |
| `package.json` | Updated — react, react-dom, recharts as deps; parcel as devDep |

### Dashboard (`hotel-iq-dashboard.jsx`)
- Accepts `user`, `apiBase`, `onLogout` props
- AI chat now calls `/api/ai/chat` on backend (was direct Anthropic API — **security fix**)
- Header shows hotel name + user greeting + Sign Out button
- Settings tab shows account info and sign out

### Project Root
- `.gitignore` — covers node_modules, .env, build/, .parcel-cache/, users.json
- `package.json` — updated scripts: `install:all`, `dev:backend`, `start:frontend`, `dev` (both)

---

## Architecture
```
Browser
  └─ React App (Parcel, port 1234 dev / served by backend in prod)
       ├─ App.jsx         → auth gate
       ├─ Auth.jsx        → login/register → POST /api/auth/login|register
       └─ HotelIQ (dashboard)
            └─ AI Chat    → POST /api/ai/chat (JWT protected)

Express Backend (port 5000)
  ├─ /api/auth/*          → bcrypt + JWT
  ├─ /api/ai/chat         → proxies to Anthropic (API key stays server-side)
  └─ /* (prod)            → serves built frontend
```

---

## How to Run (Next Session Quick Start)

### First time setup
```bash
# 1. Copy env file and fill in secrets
cp src/backend/.env.example src/backend/.env
# Edit src/backend/.env → set JWT_SECRET and ANTHROPIC_API_KEY

# 2. Install all deps
cd src/backend && npm install
cd ../frontend && npm install

# 3. Run both servers
# Terminal 1:
cd src/backend && node server.js
# Terminal 2:
cd src/frontend && npx parcel index.html --port 1234
```

### Daily dev
```
Backend:  cd src/backend && npx nodemon server.js
Frontend: cd src/frontend && npx parcel index.html --port 1234
```

---

## Known Issues / To Do Next Session

- [ ] **User data persistence** — currently stored as `users.json` flat file. Works for dev, upgrade to SQLite or PostgreSQL for production
- [ ] **Password reset** — forgot password link exists in UI but has no backend route
- [ ] **APPLY button** — pricing recommendation apply/skip buttons are UI-only, need backend endpoint to record decisions
- [ ] **Real data** — all KPI/chart data is mock/generated. Need PMS integration layer or data upload endpoint
- [ ] **CORS** — currently allows only `localhost:1234`. Will need updating for production domain
- [ ] **HTTPS** — backend needs SSL for production (Nginx reverse proxy or Let's Encrypt)
- [ ] **Landing page login** — `index.html` Sign In button opens a modal that doesn't connect to backend yet

---

## Session 002 — Recommended Starting Point
1. Install deps (see above), verify login/register works end-to-end
2. Tackle the landing page (`index.html`) Sign In modal → wire it to `/api/auth/login`
3. Set up SQLite for user storage (replace `users.json`)
4. Add `/api/pricing/apply` endpoint so APPLY button saves decisions
