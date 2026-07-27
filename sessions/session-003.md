# Session 003 — RMS Core Shipped, Merged to Production

STATUS: HANDOFF → production is live on the new code; a few config gaps and cleanup items remain (see below)

## What shipped this session
Everything from session-002's roadmap got built, tested against real data, and
merged to `main` (production). Session-002 is now historical — don't re-plan
from it, just check the "Known gaps" section below for what's actually left.

**Backend** (`src/backend/`):
- `db.js`: `dailyMetrics` collection — per-user time series of
  occupancy/ADR/revpar/roomRevenue/roomsSold, one row per date. Mongo or
  flat-file depending on `MONGODB_URI`.
- `routes/property.js`: `POST /metrics/daily` (bulk upsert), `POST
  /metrics/import` (CSV import — tolerant of real PMS exports: quoted fields,
  `M/D/YY` dates, `"69.39%"` occupancy, `"2,292.41"` thousands separators,
  `"(2,607.97)"` accounting negatives, trailing `TOTAL/AVG` summary rows), `GET
  /metrics/history` (daily + server-side monthly aggregation).
- `routes/compset.js`: pricing suggestion now factors in day-of-week
  seasonality + the property's own recent occupancy (from `dailyMetrics`)
  instead of a flat compset-average multiplier. Movement capped ±15%/call.
  Also now `requireAuth` and searches the property's real saved location
  instead of a hardcoded `"beachfront hotels"` placeholder.

**Frontend** (`flutter_app/lib/`):
- `providers/app_provider.dart` is now the hub for all real-data derivation —
  `dailyHistory`, `monthlyHistory`, `liveOccupancy/Adr/Revpar/RevenueMtd`,
  `pricingRecommendations` (real per-room recs, derived by applying the
  compset-analysis ratio to each real room's rate — no separate backend
  endpoint needed), `forecastNext14Days`/`forecastAccuracyPct` (day-of-week
  seasonal model, backtested), `roomsSoldDelta7`, `buildAiContext()` (real
  context for AI chat instead of hardcoded fake numbers).
- Tabs wired to real data: **Overview, Pricing, Forecast, Comp Set, Calendar,
  Revenue** (Revenue partially — channel/segment breakdown has no real data
  source, stays demo with an explicit label).
- **Reports tab**: was fully fake (fake "Download" spinner, saved nothing).
  Now generates real CSVs (Daily Metrics, YoY Comparison, 14-Day Forecast,
  Comp Set Snapshot) via `dart:html` Blob download.
- **AI Chat/Analyst tabs**: were feeding the model entirely hardcoded fake
  context (fake hotel name, fake comp set, fake pricing recs, a fabricated
  "conference detected" event) regardless of real data. Now use
  `AppProvider.buildAiContext()`, built from real state, with an explicit
  instruction not to invent numbers/events it doesn't have data for.
- **Integrations tab**: left as-is — it's an honest "coming soon" mockup
  (local UI state only, nothing persisted). No real PMS/channel-manager
  integrations exist to wire it to yet.
- Theme lightened: `C.bg` was near-black `#05050A`, now `#12141C` (soft
  charcoal-navy). Most widgets use translucent white-over-background
  gradients rather than opaque surface colors, so this cascaded through the
  whole app from one file (`theme/app_theme.dart`).
- Fixed real layout bugs found via live testing: comp-set list overflow on
  long real hotel names + rate text wrapping onto 2 lines and overlapping the
  row below; 30-Day Rate Calendar collapsing into a single column
  (`SizedBox(width: 1/7)` was a literal 0.14px, not "1/7 of the row").

## Deployed / connected services
- **Preview**: `hotel-iq-preview` on Render (separate from production) — has
  a MongoDB Atlas cluster (`MONGODB_URI` set) so data survives restarts, and a
  `SERPAPI_KEY` for live comp-set rates. Test login `test@test.com` /
  `Test1234`, pre-loaded with the user's real Mariner Inn & Suites data (74
  rooms, 17 room types, 2 years of daily history from PMS CSV exports).
- **Production**: `main` merged and auto-deployed to `hotel-iq`,
  `hotel-iq-api`, `hotel-iq-app` on Render — confirmed live on commit
  `517da6d`. Production does **not** have `MONGODB_URI` or `SERPAPI_KEY` set
  (same as before this session — not a regression), so in production: data is
  flat-file (resets on restart/sleep) and comp-set shows demo rates.
- Render API key and SerpAPI key were shared in chat this session — user was
  told to rotate them; unclear if done, worth checking before using either
  again.

## Known gaps / next-session candidates
1. **AI chat is broken in production** (pre-existing bug, not caused this
   session): `ai.js` reads `process.env.GEMINI_API_KEY`, but production has
   `ANTHROPIC_API_KEY` set instead — wrong var name. Preview has neither set,
   same issue. User was asked if they want this fixed — no answer yet.
2. **No automated tests** anywhere in the backend, especially the CSV import
   parser (`property.js`) which has the most edge-case logic (BOM handling,
   quoted-CSV parsing, date/negative-number formats). Recommended as cheap
   insurance against regressions.
3. **Git history still contains a leaked bcrypt password hash** — an old
   commit (before this session) committed `src/backend/data/users.json`
   despite it being gitignored later. Untracked going forward (`main` HEAD),
   but scrubbing the old commit needs a full history rewrite
   (`git filter-repo`) + force-push — only worth it if this repo might go
   public or get shared/forked.
4. **Revenue tab** channel/segment breakdown, **Integrations tab**, and the
   **30-Day Rate Calendar** demand values inside Pricing are still
   mock/demo — no real data source exists for channel attribution,
   guest segments, or actual PMS/channel-manager connections.
5. Consider adding `MONGODB_URI`/`SERPAPI_KEY` to **production** (not just
   preview) if the user wants production data to actually persist and comp-set
   to be live there too — currently intentionally left alone since it wasn't
   asked for.

## Orientation for next session (skip re-exploring)
- `main` = production, already has everything above. `preview/rms-core`
  still exists on GitHub (per user's request to keep it) but is now behind
  `main` — treat `main` as the source of truth going forward.
- Real per-room pricing logic lives in `AppProvider.pricingRecommendations`
  (Dart), not a backend endpoint — it reuses `/api/compset/rates`'s analysis.
- `AppProvider` is the correct place to add any new derived-from-history
  getter; tabs should stay thin and just read from it.
