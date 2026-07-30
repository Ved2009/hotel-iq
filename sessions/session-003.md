# Session 003 — RMS Core Shipped, Merged to Production, Live Bugs Fixed

STATUS: HANDOFF → production is live and stable; a few config gaps and cleanup items remain (see below)

## What shipped this session
Everything from session-002's roadmap got built, tested against real data
(via a live preview deploy), merged to `main` (production), and several bugs
found during that live testing got fixed on both `main` and
`preview/rms-core`. Session-002 is now historical — don't re-plan from it,
check "Known gaps" below for what's actually left.

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
- `providers/app_provider.dart` is the hub for all real-data derivation —
  `dailyHistory`, `monthlyHistory`, `liveOccupancy/Adr/Revpar/RevenueMtd`,
  `liveRoomRevenueMtd`, `pricingRecommendations` (real per-room recs, derived
  by applying the compset-analysis ratio to each real room's rate — no
  separate backend endpoint needed), `forecastNext14Days`/
  `forecastAccuracyPct`/`weekendUpliftPct` (day-of-week seasonal model,
  backtested), `roomsSoldDelta7`, `buildAiContext()` (real context for AI
  chat instead of hardcoded fake numbers).
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

**Live-testing bug fixes** (found by actually using the preview deploy, not
caught by `flutter analyze` — worth remembering static analysis doesn't
catch layout/async-timing bugs like these):
- Comp-set list: long real hotel names overflowed through the rate column;
  3-4 digit rates (`$358`) wrapped onto a second line and overlapped the row
  below. Fixed with `Flexible`/ellipsis and `FittedBox`.
- 30-Day Rate Calendar collapsed into a single column —
  `SizedBox(width: 1 / 7)` is a literal 0.14px, not "1/7 of the row." Needed
  a `LayoutBuilder` to compute the real cell width.
- Chart tooltips were unreadable — none of the real-data charts (Overview
  occupancy/weekly-revenue, Revenue ADR/RevPAR, Forecast demand/room-change)
  had `lineTouchData`/`barTouchData` configured, so tapping fell back to
  fl_chart's tiny low-contrast default. Added explicit styled tooltips to all.
- **Login/register could get stuck open, needing a manual click or refresh**
  — two compounding bugs: (1) `login()`/`register()` awaited the *entire*
  `_loadProperty()` chain, which grew to include a comp-set fetch that calls
  SerpAPI (up to 8s) — the auth dialog's loading spinner waited for all of
  it before dismissing. Fixed by making history/comp-set analysis load
  fire-and-forget (`unawaited`) after the core property loads. (2) The
  dialog's `onClose` callback (which pops using the *parent* screen's stable
  context, not the dialog's own) was gated behind the dialog's own `mounted`
  check — if that flag were ever stale, the dialog would silently stay open
  with zero feedback. Now called unconditionally on success, and the whole
  submit is wrapped in try/catch so real errors surface instead of a silent
  hang.
- **Mobile layout**: the top header (logo, wordmark, hotel name, live clock,
  user name, sign-out button) was one unwrapped `Row` — overflowed
  horizontally on phone-width screens. Now collapses non-essential elements
  (wordmark, hotel name, clock, full name) below 640px width, and shrinks
  Sign Out/Get Started to compact versions. Body padding also reduced on
  narrow screens.
- **Chart tooltips** on Overview/Revenue/Forecast's real-data charts were
  fl_chart's tiny low-contrast default (no `lineTouchData`/`barTouchData`
  configured) — added explicit styled, labeled tooltips to all of them.
- **AI chat was calling the wrong provider**: `ai.js` called Google's Gemini
  API with `GEMINI_API_KEY`, despite the UI saying "Powered by Claude" and
  both environments having `ANTHROPIC_API_KEY` configured (not
  `GEMINI_API_KEY`) — the feature was broken in both environments for a
  reason unrelated to anything else this session touched. Rewrote to use
  the official `@anthropic-ai/sdk` against `claude-opus-4-8`. Verified
  end-to-end against preview: got a real response *from Anthropic's API*
  confirming the integration works — but the account currently has
  **insufficient credit balance** ("credit balance too low"), a billing
  step at console.anthropic.com, not a code issue. That specific error now
  surfaces clearly in the app instead of a generic failure.

## Deployed / connected services
- **Preview**: `hotel-iq-preview` on Render (separate from production) — has
  a MongoDB Atlas cluster (`MONGODB_URI` set) so data survives restarts, and a
  `SERPAPI_KEY` for live comp-set rates. Test login `test@test.com` /
  `Test1234`, pre-loaded with the user's real Mariner Inn & Suites data (74
  rooms, 17 room types, 2 years of daily history from PMS CSV exports).
- **Production**: `main` merged and auto-deployed to `hotel-iq`,
  `hotel-iq-api`, `hotel-iq-app` on Render. Production does **not** have
  `MONGODB_URI` or `SERPAPI_KEY` set (same as before this session — not a
  regression), so in production: data is flat-file (resets on
  restart/sleep) and comp-set shows demo rates.
- **Both `main` and `preview/rms-core` are up to date with every fix listed
  above** — each bug fix found via preview testing was committed to `main`
  first, then cherry-picked onto `preview/rms-core` and redeployed, so the
  two branches are equivalent (preview just sits behind on the newer
  feature-tab-wiring work that was merged directly, since that flowed
  `preview/rms-core` → `main` in one merge commit earlier in the session).
- Render API key and SerpAPI key were shared in chat this session — user was
  told to rotate them; unclear if done, worth checking before using either
  again.

## Known gaps / next-session candidates
1. **AI chat needs Anthropic billing set up** — code is fixed and verified
   working (real API round-trip confirmed against preview), but the
   Anthropic account has no credit balance. User needs to add billing at
   console.anthropic.com; nothing left to do in code.
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
6. Mobile has only been spot-checked on the header/body chrome — individual
   tab content (KPI grids, wide tables like the comp-set list, the 30-day
   calendar) hasn't been systematically reviewed at phone width yet. Worth a
   pass if mobile usage matters.

## Orientation for next session (skip re-exploring)
- `main` = production, has everything above. `preview/rms-core` also has
  everything above (kept in sync fix-by-fix) — treat `main` as the primary
  branch for new work, cherry-pick or merge into `preview/rms-core` if it
  needs to stay usable as a demo/test environment.
- Real per-room pricing logic lives in `AppProvider.pricingRecommendations`
  (Dart), not a backend endpoint — it reuses `/api/compset/rates`'s analysis.
- `AppProvider` is the correct place to add any new derived-from-history
  getter; tabs should stay thin and just read from it.
- When deploying to Render via the API: env-var changes need a **new
  deploy** (`POST /v1/services/{id}/deploys`), not just `/restart` — a plain
  restart does not pick up newly-set env vars. Also: any env-var PUT with
  `generateValue: true` on `JWT_SECRET` issues a **new** secret each time,
  invalidating all existing login tokens — re-login after any env-var change
  that touches `JWT_SECRET`.
