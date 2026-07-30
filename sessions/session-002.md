# Session 002 — Gap Audit & RMS Core Roadmap

STATUS: COMPLETE → superseded by session-003.md, all 6 build steps below shipped

## What was done this session
Audited the whole repo (backend routes, db.js, Flutter tabs). No code changed.
Confirmed: the app is a working **auth/UI shell**, not yet a working **revenue
management system**. Dashboard tabs render fabricated numbers, not backend data.

## Hard facts found (verify still true before trusting)
- `forecast_tab.dart`, `pricing_tab.dart`, `revenue_tab.dart`, `calendar_tab.dart`,
  `reports_tab.dart`, `integrations_tab.dart` all `import '../../../data/mock_data.dart'`
  directly. They do not call `ApiService`. → grep `mock_data` in flutter_app/lib/screens to recheck.
- Pricing "AI suggestion" is 4 lines in `compset.js` (~line 83): a static
  multiplier off competitor average. No date, no elasticity, no lead time.
- `db.js` stores only: user profile, one hotel doc, `rooms[]`, `appliedRates`
  (last 100). No time-series table for occupancy/ADR/rate history at all.
- `compset.js` rates are cached 15 min in-memory only — nothing persisted to db.
- `ai.js` chat has no access to the hotel's own data unless frontend manually
  stuffs it into `context` string. Not tool-calling / RAG over real metrics.

## The core gap (in priority order)
1. **Data ingestion** — no way to get real occupancy/ADR/bookings into the
   system. Everything today is manual entry via `/api/property/metrics`.
2. **No history** — `hotels.json` holds current state only. Can't trend,
   can't forecast, can't back-test a pricing model without a time series.
3. **No forecast engine** — occupancy pickup/pace, day-of-week seasonality,
   events/holiday calendar: none exist.
4. **No real pricing engine** — see static heuristic above.
5. **Tabs not wired** — kill mock_data.dart usage, point tabs at real endpoints.

## Recommended build order (next sessions)
1. Add a `dailyMetrics` collection/table: `{userId, date, occupancy, adr,
   revpar, roomsSold, roomsAvail}` — one row per property per day. This is the
   foundation everything else needs.
2. Add `POST /api/property/metrics/daily` (bulk upsert, for CSV import) and
   `GET /api/property/metrics/history?from&to`.
3. Build a simple CSV upload endpoint (PMS export → daily metrics), since most
   small hotels can export CSV from their PMS even without an API integration.
4. Rewrite `analyzeRates()` pricing suggestion to take: forecasted occupancy
   for the target date + compset position + day-of-week — not just current
   compset average. Keep it rule-based (explainable) before reaching for ML.
5. Wire `forecast_tab.dart`, `revenue_tab.dart`, `pricing_tab.dart` to real
   endpoints from step 2, deleting their `mock_data.dart` imports one at a time.
6. Only after 1-5: revisit AI chat (`ai.js`) to pass real hotel data as
   structured context/tool results instead of a prompt string.

## Explicitly deferred (don't start these next)
- Real PMS/channel-manager API integrations (Cloudbeds/Mews/Opera) — CSV import
  first, live integration later once the data model above is proven.
- ML-based demand forecasting — rule-based pace/seasonality model first.
- Multi-property support — single hotel per user is fine for now.

## Quick orientation for next session (read this, skip re-exploring)
- Backend routes: `src/backend/routes/{auth,ai,compset,property,admin}.js`
- Data layer: `src/backend/db.js` (flat JSON by default, Mongo if `MONGODB_URI` set)
- Active frontend: `flutter_app/` (React frontend in `src/frontend/` is legacy/parallel, not primary)
- Mock data to eliminate: `flutter_app/lib/data/mock_data.dart`
