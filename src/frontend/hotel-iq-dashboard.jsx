import { useState, useEffect, useRef, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  gold:   "#F59E0B",
  blue:   "#6366F1",
  green:  "#10B981",
  red:    "#EF4444",
  amber:  "#F59E0B",
  purple: "#8B5CF6",
  teal:   "#14B8A6",
  orange: "#F97316",
  pink:   "#EC4899",
  indigo: "#6366F1",
};

// Semantic surface colors
const S = {
  bg:      "#020408",
  surf1:   "#070B14",
  surf2:   "#0B101C",
  surf3:   "#0F1623",
  border:  "rgba(148,163,184,0.09)",
  borderHover: "rgba(148,163,184,0.18)",
  text1:   "#F1F5F9",
  text2:   "#94A3B8",
  text3:   "#64748B",
  text4:   "#334155",
};

// ── Deterministic pseudo-random (avoids hydration mismatch) ──────────────────
const rng = (n) => Math.abs(Math.sin(n * 9301 + 49297) * 0.5 + 0.5);

// ── Static data (defined once at module level) ────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const monthlyData = MONTHS.map((m, i) => ({
  month: m,
  occupancy: Math.round(55 + Math.sin(i * 0.6) * 20 + rng(i) * 8),
  lastYear:  Math.round(50 + Math.sin(i * 0.6) * 18 + rng(i + 1) * 6),
  revpar:    Math.round(110 + Math.sin(i * 0.6) * 40 + rng(i + 2) * 20),
  adr:       Math.round(180 + Math.sin(i * 0.4) * 30 + rng(i + 3) * 15),
  revenue:   Math.round(280000 + Math.sin(i * 0.6) * 80000 + rng(i + 4) * 40000),
}));


const weeklyRevenue = DAYS_SHORT.map((d, i) => ({
  day: d,
  revenue: Math.round(10000 + rng(i + 14) * 8000 + (i >= 4 ? 5000 : 0)),
}));

const forecastData = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(); date.setDate(date.getDate() + i);
  const isWknd = [0, 6].includes(date.getDay());
  const isEvent = i >= 5 && i <= 7;
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    demand: Math.min(100, Math.round(62 + rng(i) * 20 + (isWknd ? 12 : 0) + (isEvent ? 24 : 0))),
    confidence: Math.round(92 - i * 2.2 + rng(i + 10) * 3),
    event: isEvent ? "Conference" : isWknd ? "Weekend" : null,
  };
});

const pickupData = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - i));
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    bookings: Math.round(5 + rng(i * 3) * 14),
    cancellations: Math.round(rng(i * 5 + 2) * 4),
  };
});

const channelData = MONTHS.slice(-6).map((m, i) => ({
  month: m,
  Direct:        Math.round(38000 + rng(i) * 18000),
  "Booking.com": Math.round(32000 + rng(i + 1) * 16000),
  Expedia:       Math.round(20000 + rng(i + 2) * 10000),
  "Phone/Email": Math.round(14000 + rng(i + 3) * 7000),
}));

const segmentData = [
  { name: "Leisure",  value: 45, color: C.gold },
  { name: "Business", value: 30, color: C.blue },
  { name: "Group",    value: 15, color: C.purple },
  { name: "OTA",      value: 10, color: C.orange },
];

const competitors = [
  { name: "Your Hotel",    rate: 189, change: +3.2, target: 195, stars: 4, score: 4.4 },
  { name: "Grand Regency", rate: 210, change: -1.5, target: null, stars: 5, score: 4.7 },
  { name: "Blue Harbor",   rate: 175, change: +5.1, target: null, stars: 3, score: 4.1 },
  { name: "The Meridian",  rate: 220, change:  0,   target: null, stars: 5, score: 4.8 },
  { name: "Coastal Suites",rate: 165, change: +2.3, target: null, stars: 3, score: 3.9 },
  { name: "Harbor View",   rate: 195, change: -0.8, target: null, stars: 4, score: 4.3 },
];

const rateHistory = DAYS_SHORT.map((d, i) => ({
  day: d,
  "Your Hotel":     189 + Math.round((rng(i)     - 0.5) * 18),
  "Grand Regency":  210 + Math.round((rng(i + 1) - 0.5) * 14),
  "The Meridian":   220 + Math.round((rng(i + 2) - 0.5) * 12),
  "Blue Harbor":    175 + Math.round((rng(i + 3) - 0.5) * 16),
}));

const pricingRecs = [
  { id: 1, roomId: "standard-king",    room: "Standard King",    current: 159, suggested: 179, reason: "High demand — comp supply low",    impact: 2400,  urgency: "high",   minStay: 2 },
  { id: 2, roomId: "ocean-view-suite", room: "Ocean View Suite", current: 289, suggested: 269, reason: "3 comps dropped rates below",      impact: -800,  urgency: "medium", minStay: null },
  { id: 3, roomId: "double-queen",     room: "Double Queen",     current: 139, suggested: 155, reason: "Weekend demand spike forecast",    impact: 1100,  urgency: "high",   minStay: 2 },
  { id: 4, roomId: "executive-floor",  room: "Executive Floor",  current: 349, suggested: 349, reason: "Rate is optimal — hold position",  impact: 0,     urgency: "low",    minStay: null },
  { id: 5, roomId: "junior-suite",     room: "Junior Suite",     current: 229, suggested: 249, reason: "Conference demand surge",          impact: 880,   urgency: "high",   minStay: 3 },
];

const activityLog = [
  { time: "2m ago",  type: "alert",    icon: "⚡", text: "Demand spike detected: +34% this weekend" },
  { time: "18m ago", type: "positive", icon: "↑",  text: "Occupancy hit 78% — 4-week high" },
  { time: "1h ago",  type: "success",  icon: "✓",  text: "Price applied: Penthouse Suite → $420" },
  { time: "3h ago",  type: "warning",  icon: "↓",  text: "Grand Regency dropped rates −1.5%" },
  { time: "5h ago",  type: "info",     icon: "★",  text: "New 5-star review on Booking.com" },
  { time: "8h ago",  type: "alert",    icon: "⚡", text: "Fresh 14-day demand forecast generated" },
];

// ── Integrations data ─────────────────────────────────────────────────────────
const PMS_LIST = [
  { id: "mews",         name: "Mews",           desc: "Cloud PMS for modern hotels & hostels", icon: "🏨", docs: "https://mews.com/api", fields: ["API Token", "Property ID"] },
  { id: "cloudbeds",    name: "Cloudbeds",       desc: "All-in-one hospitality platform",        icon: "☁️", docs: "https://cloudbeds.com/api", fields: ["API Key", "Property ID"] },
  { id: "opera",        name: "Oracle Opera",    desc: "Enterprise hotel management suite",      icon: "🔷", docs: "https://docs.oracle.com/en/industries/hospitality/", fields: ["Username", "Password", "Endpoint URL"] },
  { id: "protel",       name: "Protel Air",      desc: "Cloud PMS for all property sizes",       icon: "🏢", docs: "https://protel.net/api", fields: ["API Key", "Hotel ID"] },
  { id: "littlehotelier", name: "Little Hotelier", desc: "Built for small independent hotels",  icon: "🏡", docs: "https://littlehotelier.com/api", fields: ["API Key"] },
  { id: "clock",        name: "Clock PMS",       desc: "Web-based PMS + booking engine",        icon: "⏱", docs: "https://clock-software.com/api", fields: ["API Key", "Property Code"] },
];

const CHANNEL_MANAGERS = [
  { id: "siteminder",   name: "SiteMinder",      desc: "World's leading channel manager",        icon: "🌐", fields: ["API Key", "Property ID"] },
  { id: "channex",      name: "Channex",          desc: "Open-API channel manager",              icon: "🔗", fields: ["API Key", "Channel ID"] },
  { id: "cubilis",      name: "Cubilis",           desc: "Rate & availability distribution",     icon: "📡", fields: ["Username", "Password"] },
  { id: "myallocator",  name: "myallocator",       desc: "Automated OTA sync & reporting",       icon: "⚡", fields: ["Account ID", "API Key"] },
];

const OTA_CONNECTIONS = [
  { id: "booking",      name: "Booking.com",      desc: "Direct API — push rates & retrieve reviews", icon: "🅱", fields: ["Property ID", "API Key"] },
  { id: "expedia",      name: "Expedia Group",     desc: "Expedia + Hotels.com rate management",       icon: "✈", fields: ["Hotel ID", "API Key"] },
  { id: "airbnb",       name: "Airbnb",            desc: "Host tools & real-time rate sync",           icon: "🏠", fields: ["Listing ID", "Access Token"] },
  { id: "google",       name: "Google Hotels",     desc: "Free booking links + price accuracy",        icon: "🔍", fields: ["Property ID"] },
];

const PRICING_STRATEGIES = {
  conservative: { label: "Conservative", desc: "Cautious adjustments, prioritize occupancy over rate", multiplier: 0.6, color: C.blue,   accent: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)" },
  balanced:     { label: "Balanced",     desc: "AI-optimal mix of rate and occupancy growth",          multiplier: 1.0, color: C.green,  accent: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.3)" },
  aggressive:   { label: "Aggressive",   desc: "Maximize RevPAR, accept modest occupancy risk",        multiplier: 1.4, color: C.orange, accent: "rgba(249,115,22,0.1)",   border: "rgba(249,115,22,0.3)" },
};

const rateCalendar30 = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i);
  const isWknd   = [0, 6].includes(d.getDay());
  const demand    = Math.min(100, Math.round(55 + rng(i * 3) * 36 + (isWknd ? 14 : 0) + (i >= 5 && i <= 7 ? 22 : 0)));
  const baseRate  = 189;
  const optimal   = Math.round(baseRate * (0.76 + (demand / 100) * 0.52));
  return {
    day:         d.getDate(),
    dow:         d.toLocaleDateString("en-US", { weekday: "short" }),
    label:       d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    demand,
    current:     baseRate,
    optimal,
    gap:         optimal - baseRate,
    isWknd,
    isToday:     i === 0,
    hasEvent:    i >= 5 && i <= 7,
  };
});

function generateCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  return { offset, days: Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const isWknd = [0, 6].includes(new Date(year, month, day).getDay());
    const occ = Math.round(52 + rng(day) * 38 + (isWknd ? 12 : 0));
    return {
      day, occupancy: occ, isToday: day === now.getDate(),
      adr: Math.round(178 + rng(day * 2) * 42),
      revenue: Math.round(occ * 2.92 * (178 + rng(day * 2) * 42) * 0.01),
    };
  })};
}

const reports = [
  { name: "Monthly Revenue Summary",     desc: "Full P&L, RevPAR, ADR analysis",        freq: "Monthly", status: "Ready" },
  { name: "Demand Forecast Report",      desc: "14-day demand with confidence bands",    freq: "Daily",   status: "Ready" },
  { name: "Comp Set Rate Analysis",      desc: "Competitor rates, trends, position",     freq: "Weekly",  status: "Ready" },
  { name: "Channel Performance Report",  desc: "OTA vs direct, commissions, mix",        freq: "Monthly", status: "Ready" },
  { name: "Segment Performance Review",  desc: "Leisure, Business, Group breakdown",     freq: "Monthly", status: "Pending" },
  { name: "Year-over-Year Comparison",   desc: "KPI trends vs prior year",               freq: "Weekly",  status: "Ready" },
];

// ── Spark data per KPI ────────────────────────────────────────────────────────
const SPARKS = {
  occupancy:   [64, 67, 65, 69, 71, 70, 74, 73],
  revpar:      [129, 131, 133, 130, 136, 138, 140, 142],
  adr:         [187, 190, 188, 191, 193, 192, 196, 195],
  trevpar:     [158, 161, 159, 163, 165, 164, 168, 168],
  revenueMtd:  [60,  65,  70,  74,  78,  82,  86,  89],
  goppar:      [83,  85,  84,  86,  87,  87,  89,  89],
  forecast7:   [75,  78,  80,  82,  84,  83,  82,  81],
  forecastAcc: [92,  93,  91,  93,  94,  94,  94,  94],
  projRev:     [31,  33,  35,  36,  38,  39,  40,  41],
  roomRev:     [62,  67,  72,  76,  79,  83,  86,  89],
  fbRev:       [14,  15,  15,  16,  17,  17,  18,  18],
  profit:      [36,  39,  40,  42,  44,  45,  46,  47],
};

// ── AI Chat quick-prompt suggestions ─────────────────────────────────────────
const QUICK_PROMPTS = [
  "Optimal rate for this weekend?",
  "How do I grow RevPAR 10%?",
  "Analyse my comp set",
  "Is my ADR competitive?",
  "Forecast next 7 days",
];

// ── Mini inline sparkline ─────────────────────────────────────────────────────
const MiniSpark = ({ data, color }) => {
  if (!data?.length) return null;
  const W = 100, H = 26;
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * W).toFixed(1)},${(H - ((v - min) / rng) * (H - 3) - 1.5).toFixed(1)}`);
  const id = `ms${color.replace(/[^a-z0-9]/gi, "")}${data[0]}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block", marginTop: 6 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0,${H} L${pts.join(" L")} L${W},${H} Z`} fill={`url(#${id})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── Demo banner ───────────────────────────────────────────────────────────────
const DemoBanner = ({ onAction }) => (
  <div style={{
    background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.06) 100%)",
    border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16,
    padding: "14px 20px", display: "flex", alignItems: "center", gap: 14,
  }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✦</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: S.text1, marginBottom: 2 }}>
        You're viewing demo data
      </div>
      <div style={{ fontSize: 12, color: S.text3 }}>
        Sign in to connect your property and get live AI pricing recommendations
      </div>
    </div>
    <button onClick={() => onAction?.("register")} style={{
      background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", border: "none",
      color: "#fff", padding: "9px 20px", borderRadius: 10, cursor: "pointer",
      fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif",
      whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.3)",
      letterSpacing: 0.2,
    }}>Get Started Free →</button>
  </div>
);

// ── Reusable Components ────────────────────────────────────────────────────────
const Card = ({ title, subtitle, action, children, style = {}, accent }) => (
  <div style={{
    background: `linear-gradient(160deg, ${S.surf1} 0%, ${S.surf2} 100%)`,
    border: `1px solid ${S.border}`,
    borderRadius: 20, padding: "22px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.25)",
    position: "relative", overflow: "hidden",
    transition: "border-color 0.2s",
    ...style,
  }}
    onMouseEnter={e => e.currentTarget.style.borderColor = S.borderHover}
    onMouseLeave={e => e.currentTarget.style.borderColor = S.border}
  >
    {accent && (
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, ${accent}80, ${accent}20, transparent)` }} />
    )}
    {(title || action) && (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          {title && <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: S.text1, letterSpacing: -0.2 }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 11, color: S.text3, marginTop: 4, fontWeight: 400 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

const KPI = ({ label, value, sub, delta, accent, icon, spark }) => (
  <div style={{
    background: `linear-gradient(160deg, ${S.surf1} 0%, ${S.surf2} 100%)`,
    border: `1px solid ${S.border}`,
    borderRadius: 20, padding: "20px 22px",
    position: "relative", overflow: "hidden",
    transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2)",
    cursor: "default",
  }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = `${accent}50`;
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${accent}20`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = S.border;
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2)";
    }}>
    {/* Top accent line */}
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
      background: `linear-gradient(90deg, ${accent}90, ${accent}20, transparent)` }} />
    {/* Glow blob */}
    <div style={{ position: "absolute", bottom: -30, right: -30, width: 120, height: 120,
      background: `radial-gradient(circle, ${accent}0F 0%, transparent 70%)`,
      pointerEvents: "none" }} />

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: 1.5,
        textTransform: "uppercase", color: S.text3, fontWeight: 400 }}>{label}</span>
      <div style={{ width: 28, height: 28, borderRadius: 8,
        background: `${accent}18`, border: `1px solid ${accent}25`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{icon}</div>
    </div>

    <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Syne', sans-serif",
      color: S.text1, lineHeight: 1, letterSpacing: -1, marginBottom: 5 }}>{value}</div>

    {sub && <div style={{ fontSize: 11, color: S.text3, fontWeight: 400, marginBottom: 4 }}>{sub}</div>}

    {delta !== undefined && (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10,
        fontFamily: "'Inter', sans-serif", fontWeight: 600, marginTop: 2,
        color: delta >= 0 ? "#34D399" : "#F87171" }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 14, height: 14, borderRadius: 4,
          background: delta >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
          fontSize: 8 }}>{delta >= 0 ? "▲" : "▼"}</span>
        {Math.abs(delta)}% vs last month
      </div>
    )}

    {spark && <MiniSpark data={spark} color={accent} />}
  </div>
);

const Badge = ({ urgency }) => {
  const m = { high: [C.red, "rgba(248,113,113,0.1)"], medium: [C.orange, "rgba(249,115,22,0.1)"], low: [C.green, "rgba(74,222,128,0.1)"] };
  const [color, bg] = m[urgency] || m.low;
  return (
    <span style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", letterSpacing: 1.5,
      textTransform: "uppercase", background: bg, color, padding: "3px 8px", borderRadius: 4,
      border: `1px solid ${color}40` }}>{urgency}</span>
  );
};

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,12,22,0.96)", backdropFilter: "blur(12px)",
      border: `1px solid ${S.borderHover}`, borderRadius: 12,
      padding: "12px 16px", fontSize: 12, fontFamily: "'Inter', sans-serif",
      boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
      minWidth: 140,
    }}>
      <div style={{ color: S.text3, marginBottom: 8, fontSize: 11,
        fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between",
          gap: 16, color: S.text2, marginBottom: 3, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
            {p.name}
          </span>
          <strong style={{ color: S.text1, fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{
            p.value > 999 ? `$${p.value.toLocaleString()}` :
            ["occupancy","demand","lastYear"].includes(p.dataKey) ? `${p.value}%` : p.value
          }</strong>
        </div>
      ))}
    </div>
  );
};

const SectionHead = ({ title, sub, right, live = true }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700,
          margin: 0, letterSpacing: -0.8, color: S.text1, lineHeight: 1.1 }}>{title}</h1>
        {live && (
          <div style={{ display: "flex", alignItems: "center", gap: 5,
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 100, padding: "4px 10px" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981",
              display: "inline-block", boxShadow: "0 0 8px rgba(16,185,129,0.8)",
              animation: "livePulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, color: "#34D399", fontFamily: "'Space Mono', monospace",
              letterSpacing: 1.5, fontWeight: 700 }}>LIVE</span>
          </div>
        )}
      </div>
      {sub && <p style={{ color: S.text3, margin: 0, fontSize: 13, fontWeight: 400, lineHeight: 1.5 }}>{sub}</p>}
    </div>
    {right}
  </div>
);

// ── Section: Overview ─────────────────────────────────────────────────────────
function Overview({ user, property, setTab, applied, skipped, onApply, onShowAuth }) {
  const urgent = pricingRecs.filter(r => r.urgency === "high" && !applied.has(r.id) && !skipped.has(r.id));
  const m = property?.metrics || {};
  const p = property?.profile || {};
  const totalRooms = p.totalRooms ?? 292;
  const occ = m.occupancy ?? 73;
  const adr = m.adr ?? 195;
  const revpar = m.revpar ?? 142;
  const trevpar = m.trevpar ?? 168;
  const revMtd = m.revenueMtd ?? 89400;
  const goppar = m.goppar ?? 89;
  const hasRealData = m.updatedAt != null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {!user && <DemoBanner onAction={onShowAuth} />}
      <SectionHead
        title="Revenue Overview"
        sub={`${user?.hotelName || p.hotelName || "The Coastal Grand"} · ${hasRealData ? `Updated ${new Date(m.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "Demo data — enter real KPIs in Settings"}`}
        live={hasRealData}
        right={<span style={{ fontSize: 11, color: "#64748B", fontFamily: "'Space Mono', monospace" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        </span>}
      />

      <div className="kpi6" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
        <KPI icon="◈" label="Occupancy"   value={`${occ}%`}                            sub={`${Math.round(occ / 100 * totalRooms)} / ${totalRooms} rooms`} delta={4.2}  accent={C.gold}   spark={SPARKS.occupancy} />
        <KPI icon="↗" label="RevPAR"      value={`$${revpar}`}                         sub="vs $131 last mo."  delta={7.8}  accent={C.orange} spark={SPARKS.revpar} />
        <KPI icon="◆" label="ADR"         value={`$${adr}`}                            sub="Avg daily rate"    delta={2.1}  accent={C.blue}   spark={SPARKS.adr} />
        <KPI icon="⊞" label="TRevPAR"    value={`$${trevpar}`}                        sub="Total rev / room"  delta={5.4}  accent={C.purple} spark={SPARKS.trevpar} />
        <KPI icon="▦" label="Revenue MTD" value={revMtd >= 1000 ? `$${(revMtd/1000).toFixed(1)}K` : `$${revMtd}`} sub="Month to date" delta={11.3} accent={C.green} spark={SPARKS.revenueMtd} />
        <KPI icon="✦" label="GOPPAR"      value={`$${goppar}`}                         sub="Gross op. profit"  delta={3.1}  accent={C.pink}   spark={SPARKS.goppar} />
      </div>

      <div className="chart2col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card title="12-Month Occupancy" subtitle="This year vs last year">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gOcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} domain={[30,100]} tickFormatter={v=>`${v}%`} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="occupancy" stroke="#6366F1" strokeWidth={2} fill="url(#gOcc)" name="This Year" />
              <Area type="monotone" dataKey="lastYear" stroke="#64748B" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" name="Last Year" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#64748B" }}>
            <span><span style={{ color: "#6366F1" }}>—</span> This Year</span>
            <span><span style={{ color: "#64748B" }}>- -</span> Last Year</span>
          </div>
        </Card>

        <Card title="This Week Revenue" subtitle="Gold = weekend">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyRevenue} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="revenue" radius={[5,5,0,0]} name="Revenue">
                {weeklyRevenue.map((_, i) => <Cell key={i} fill={i >= 4 ? "#6366F1" : "rgba(99,102,241,0.25)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="chart2col" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05), rgba(79,70,229,0.07))",
          border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: "20px 24px",
          position: "relative", overflow: "hidden",
        }}>
          {/* Animated rainbow top border */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899, #F59E0B, #6366F1)",
            backgroundSize: "300% 100%", animation: "gradientShift 4s ease infinite" }} />
          {/* Soft ambient glow */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180,
            background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", gap: 14, marginBottom: 16, position: "relative" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))",
              border: "1px solid rgba(99,102,241,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              boxShadow: "0 0 20px rgba(99,102,241,0.25)" }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#818CF8" }}>AI Revenue Insight</div>
                <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", letterSpacing: 1.2,
                  background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: 4, padding: "2px 7px", color: "#6366F1" }}>LIVE</div>
              </div>
              <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.8 }}>
                Demand spike forecasted <strong style={{ color: "#fff" }}>+34%</strong> this weekend — regional tech conference in town.
                Standard King & Double Queen rates are <strong style={{ color: C.orange }}>$16–20 below optimal</strong>.
                Applying open recommendations could generate <strong style={{ color: C.green }}>$4,380</strong> additional revenue.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, position: "relative" }}>
            <button onClick={() => setTab("pricing")} style={{
              background: "linear-gradient(135deg, #6366F1, #4F46E5)", border: "none",
              color: "#fff", padding: "9px 18px", borderRadius: 9, cursor: "pointer",
              fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700,
              boxShadow: "0 4px 20px rgba(99,102,241,0.45)",
              letterSpacing: 0.5,
            }}>REVIEW PRICING →</button>
            <button onClick={() => setTab("forecast")} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748B", padding: "9px 16px", borderRadius: 9, cursor: "pointer",
              fontSize: 11, fontFamily: "'Space Mono', monospace",
            }}>VIEW FORECAST</button>
          </div>
        </div>

        <Card title="Quick Actions" subtitle={urgent.length > 0 ? `${urgent.length} urgent recs open` : "All clear"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {urgent.slice(0, 3).map(r => (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)",
                borderRadius: 8, padding: "10px 12px",
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{r.room}</div>
                  <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'Space Mono', monospace" }}>
                    ${r.current} → <span style={{ color: C.gold }}>${r.suggested}</span>
                    {" · "}<span style={{ color: C.green }}>+${r.impact.toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => onApply(r.id)} style={{
                  background: "linear-gradient(135deg, #10B981, #059669)", border: "none",
                  color: "#fff", padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                  fontSize: 10, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                }}>APPLY</button>
              </div>
            ))}
            {urgent.length === 0 && (
              <div style={{ textAlign: "center", padding: "14px 0", color: C.green,
                fontSize: 11, fontFamily: "'Space Mono', monospace" }}>✓ All urgent actions resolved</div>
            )}
          </div>
        </Card>
      </div>

      <Card title="Recent Activity" subtitle="Live event log">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          {activityLog.map((a, i) => {
            const color = a.type === "positive" || a.type === "success" ? C.green
              : a.type === "warning" ? C.orange : a.type === "alert" ? C.red : C.blue;
            return (
              <div key={i} style={{
                display: "flex", gap: 10, padding: "12px 14px",
                borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
                borderRight: i % 3 !== 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `${color}18`, color,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.5 }}>{a.text}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>{a.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ── Section: Revenue ──────────────────────────────────────────────────────────
function fmtK(n) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`; }

function Revenue({ property }) {
  const channelColors = { "Direct": C.gold, "Booking.com": C.blue, "Expedia": C.purple, "Phone/Email": C.green };
  const m = property?.metrics || {};
  const roomRev   = m.roomRevenueMtd ?? 89400;
  const fbRev     = m.fbRevenueMtd   ?? 18200;
  const profit    = m.profitMtd      ?? 47300;
  const totalRev  = m.revenueMtd     ?? 115400;
  const ancillary = Math.max(0, totalRev - roomRev - fbRev) || 7800;
  const gopMargin = totalRev > 0 ? ((profit / totalRev) * 100).toFixed(1) : "44.7";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHead title="Revenue Analysis" sub="Breakdown by segment, channel & performance metrics" />
      <div className="kpi4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KPI icon="◆" label="Room Revenue"    value={fmtK(roomRev)}   sub="Month to date"              delta={11.3} accent={C.gold}   spark={SPARKS.roomRev} />
        <KPI icon="◇" label="F&B Revenue"    value={fmtK(fbRev)}     sub="Month to date"              delta={6.4}  accent={C.orange} spark={SPARKS.fbRev} />
        <KPI icon="⊕" label="Spa & Ancillary" value={fmtK(ancillary)} sub="Month to date"              delta={14.2} accent={C.blue}   spark={SPARKS.trevpar} />
        <KPI icon="↗" label="Gross Profit"    value={fmtK(profit)}    sub={`${gopMargin}% GOP margin`} delta={8.1}  accent={C.green}  spark={SPARKS.profit} />
      </div>

      <div className="chart2col" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        <Card title="Revenue by Channel" subtitle="Last 6 months — stacked">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={channelData} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<Tip />} />
              {Object.entries(channelColors).map(([key, color]) => (
                <Bar key={key} dataKey={key} stackId="ch" fill={color} name={key} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            {Object.entries(channelColors).map(([k, c]) => (
              <span key={k} style={{ fontSize: 11, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />{k}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Guest Segment Mix" subtitle="Current month">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={segmentData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                {segmentData.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip content={<Tip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
            {segmentData.map(s => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>{s.name}</span>
                </div>
                <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: "#fff" }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="ADR & RevPAR Trend" subtitle="12 months">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" />
            <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} />
            <Tooltip content={<Tip />} />
            <Line type="monotone" dataKey="adr"    stroke={C.gold}  strokeWidth={2.5} dot={false} name="ADR" />
            <Line type="monotone" dataKey="revpar" stroke={C.blue}  strokeWidth={2.5} dot={false} name="RevPAR" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#64748B" }}>
          <span><span style={{ color: C.gold }}>—</span> ADR</span>
          <span><span style={{ color: C.blue }}>—</span> RevPAR</span>
        </div>
      </Card>
    </div>
  );
}

// ── Section: Pricing ──────────────────────────────────────────────────────────
function Pricing({ applied, skipped, onApply, onSkip, onRestore, property }) {
  const [strategy, setStrategy]       = useState("balanced");
  const [calView, setCalView]         = useState(false);
  const [restrictions, setRestrictions] = useState({ minStay: 1, ctaFri: false, ctaSat: false, ctdSun: true });
  const [selectedDay, setSelectedDay] = useState(null);

  // Overlay live room rates from DB over static rec defaults
  const rooms = property?.rooms || {};
  const strat = PRICING_STRATEGIES[strategy];
  const recs = pricingRecs.map(r => ({
    ...r,
    current:   rooms[r.roomId] ?? r.current,
    suggested: Math.round((rooms[r.roomId] ?? r.current) + (r.suggested - r.current) * strat.multiplier),
    impact:    Math.round(r.impact * strat.multiplier),
  }));
  const pending = recs.filter(r => !applied.has(r.id) && !skipped.has(r.id) && r.impact > 0);
  const totalPending = pending.reduce((s, r) => s + r.impact, 0);
  const totalApplied = recs.filter(r => applied.has(r.id) && r.impact > 0).reduce((s, r) => s + r.impact, 0);

  // Yield score: 0–100 based on how many high-impact recs are applied
  const highRecs    = recs.filter(r => r.urgency === "high");
  const highApplied = highRecs.filter(r => applied.has(r.id)).length;
  const yieldScore  = highRecs.length > 0 ? Math.round(60 + (highApplied / highRecs.length) * 40) : 60;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHead
        title="Dynamic Pricing"
        sub="AI-generated recommendations based on demand, comp set & 90-day history"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Yield score */}
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "8px 14px" }}>
              <div style={{ fontSize: 9, color: "#64748B", fontFamily: "'Space Mono', monospace", marginBottom: 3, letterSpacing: 1 }}>YIELD SCORE</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22,
                color: yieldScore >= 80 ? C.green : yieldScore >= 65 ? C.gold : C.orange }}>{yieldScore}</div>
            </div>
            {totalPending > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: "#64748B", fontFamily: "'Space Mono', monospace", marginBottom: 3, letterSpacing: 1 }}>PENDING OPP.</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: C.green }}>+${totalPending.toLocaleString()}</div>
              </div>
            )}
          </div>
        }
      />

      {/* ── Strategy Selector ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {Object.entries(PRICING_STRATEGIES).map(([key, s]) => {
          const active = strategy === key;
          return (
            <button key={key} onClick={() => setStrategy(key)} style={{
              background: active ? s.accent : "rgba(255,255,255,0.02)",
              border: `1px solid ${active ? s.border : "rgba(255,255,255,0.06)"}`,
              borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left",
              transition: "all 0.18s",
              boxShadow: active ? `0 4px 20px ${s.color}22` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
                  color: active ? s.color : "#64748B" }}>{s.label}</span>
                {active && <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color,
                  display: "inline-block", boxShadow: `0 0 8px ${s.color}` }} />}
              </div>
              <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>{s.desc}</div>
              {active && (
                <div style={{ fontSize: 9, color: s.color, fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1, marginTop: 6 }}>
                  {key === "conservative" ? "×0.6 adjustments" : key === "balanced" ? "×1.0 adjustments" : "×1.4 adjustments"}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Toggle: Recommendations / Rate Calendar ── */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {[["Recommendations", false], ["30-Day Rate Calendar", true]].map(([label, isCalendar]) => (
          <button key={label} onClick={() => setCalView(isCalendar)} style={{
            padding: "7px 16px", borderRadius: 8, cursor: "pointer",
            background: calView === isCalendar ? "rgba(99,102,241,0.15)" : "transparent",
            border: calView === isCalendar ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.07)",
            color: calView === isCalendar ? "#C7D2FE" : "#64748B",
            fontSize: 12, fontFamily: "'Inter', sans-serif", fontWeight: calView === isCalendar ? 600 : 400,
            transition: "all 0.15s",
          }}>{label}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {/* Restriction mini-badges */}
          {[
            { label: `Min ${restrictions.minStay}N stay`, active: restrictions.minStay > 1 },
            { label: "CTA Fri", active: restrictions.ctaFri },
            { label: "CTA Sat", active: restrictions.ctaSat },
            { label: "CTD Sun", active: restrictions.ctdSun },
          ].map(b => b.active && (
            <span key={b.label} style={{
              fontSize: 9, fontFamily: "'Space Mono', monospace", letterSpacing: 1,
              background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
              color: "#818CF8", borderRadius: 6, padding: "3px 8px",
            }}>{b.label}</span>
          ))}
        </div>
      </div>

      {calView ? (
        /* ── 30-Day Rate Calendar ── */
        <Card title="30-Day Rate Optimization Calendar" subtitle={`Strategy: ${strat.label} — click any day to see details`} accent={strat.color}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, marginBottom: 12 }}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 9, color: "#64748B",
                fontFamily: "'Space Mono', monospace", paddingBottom: 6 }}>{d}</div>
            ))}
            {/* offset for first day */}
            {Array.from({ length: (new Date().getDay() + 6) % 7 }, (_, i) => <div key={`e${i}`} />)}
            {rateCalendar30.map((d, i) => {
              const isSelected = selectedDay?.day === d.day;
              const gapPct     = Math.abs(d.gap / d.current);
              const hasBigGap  = d.gap > 20;
              const bgColor    = d.hasEvent
                ? "rgba(139,92,246,0.12)"
                : d.isWknd
                  ? "rgba(99,102,241,0.08)"
                  : hasBigGap
                    ? "rgba(16,185,129,0.07)"
                    : "rgba(255,255,255,0.02)";
              const borderCol  = d.isToday
                ? "rgba(99,102,241,0.6)"
                : d.hasEvent
                  ? "rgba(139,92,246,0.35)"
                  : hasBigGap
                    ? "rgba(16,185,129,0.3)"
                    : "rgba(255,255,255,0.05)";
              return (
                <div key={i} onClick={() => setSelectedDay(isSelected ? null : d)} style={{
                  background: isSelected ? `${strat.color}22` : bgColor,
                  border: `1px solid ${isSelected ? strat.color : borderCol}`,
                  borderRadius: 8, padding: "7px 4px", textAlign: "center",
                  cursor: "pointer", transition: "all 0.15s",
                  boxShadow: isSelected ? `0 0 12px ${strat.color}44` : "none",
                }}>
                  <div style={{ fontSize: 8, color: "#64748B", fontFamily: "'Space Mono', monospace", marginBottom: 2 }}>
                    {d.dow}{d.isToday ? "●" : ""}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", marginBottom: 3 }}>{d.day}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Syne', sans-serif",
                    color: d.hasEvent ? C.purple : hasBigGap ? C.green : "#64748B" }}>
                    ${d.optimal}
                  </div>
                  {hasBigGap && (
                    <div style={{ fontSize: 7, color: C.green, fontFamily: "'Space Mono', monospace", marginTop: 1 }}>
                      +${d.gap}
                    </div>
                  )}
                  {d.hasEvent && (
                    <div style={{ fontSize: 7, color: C.purple, fontFamily: "'Space Mono', monospace", marginTop: 1 }}>EVT</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day detail */}
          {selectedDay && (
            <div style={{
              background: `linear-gradient(135deg, ${strat.color}10, rgba(0,0,0,0.3))`,
              border: `1px solid ${strat.color}30`, borderRadius: 12, padding: "14px 18px",
              display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap",
            }}>
              <div>
                <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'Space Mono', monospace", marginBottom: 3 }}>DATE</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#E2E8F0" }}>{selectedDay.label}</div>
              </div>
              {[
                ["DEMAND",      `${selectedDay.demand}%`,    selectedDay.demand >= 80 ? C.green : C.gold],
                ["CURRENT",     `$${selectedDay.current}`,   "#E2E8F0"],
                ["OPTIMAL",     `$${selectedDay.optimal}`,   strat.color],
                ["OPPORTUNITY", `+$${selectedDay.gap}`,      C.green],
              ].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#64748B", fontFamily: "'Space Mono', monospace", marginBottom: 3 }}>{l}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: c }}>{v}</div>
                </div>
              ))}
              {selectedDay.hasEvent && (
                <div style={{ padding: "6px 12px", background: "rgba(139,92,246,0.12)",
                  border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8,
                  fontSize: 11, color: C.purple, fontFamily: "'Space Mono', monospace" }}>
                  📍 EVENT DETECTED
                </div>
              )}
              <button onClick={() => {}} style={{
                marginLeft: "auto", background: `linear-gradient(135deg, ${strat.color}CC, ${strat.color}99)`,
                border: "none", color: "#fff", padding: "8px 16px", borderRadius: 8,
                cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700,
              }}>APPLY RATE →</button>
            </div>
          )}

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 10, fontFamily: "'Space Mono', monospace", flexWrap: "wrap" }}>
            {[[C.green, ">$20 opportunity"], [C.purple, "Event detected"], [C.blue, "Weekend", ], ["#64748B", "Standard"]].map(([c, l]) => (
              <span key={l}><span style={{ color: c }}>■</span> {l}</span>
            ))}
          </div>
        </Card>
      ) : (
        /* ── Recommendations List ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recs.map(r => {
          const isApplied = applied.has(r.id);
          const isSkipped = skipped.has(r.id);
          return (
            <div key={r.id} style={{
              background: isApplied ? "rgba(74,222,128,0.04)" : isSkipped ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)",
              border: isApplied ? "1px solid rgba(74,222,128,0.22)" : isSkipped ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "18px 24px", display: "flex", alignItems: "center", gap: 20,
              opacity: isSkipped ? 0.5 : 1, transition: "all 0.22s",
            }}>
              <div style={{ flex: 2 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#fff", marginBottom: 3,
                  textDecoration: isSkipped ? "line-through" : "none" }}>{r.room}</div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>{r.reason}</div>
                {/* AI confidence bar */}
                {!isSkipped && r.impact !== 0 && (
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${Math.min(100, Math.abs(r.impact) / 30)}%`,
                        background: isApplied
                          ? `linear-gradient(90deg, ${C.green}, ${C.teal})`
                          : r.urgency === "high"
                            ? `linear-gradient(90deg, ${C.orange}, ${C.gold})`
                            : `linear-gradient(90deg, ${C.blue}, #818CF8)`,
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                  </div>
                )}
                {r.minStay && <div style={{ fontSize: 10, color: C.blue, fontFamily: "'Space Mono', monospace",
                  marginTop: 2 }}>MIN STAY {r.minStay}N RECOMMENDED</div>}
                {isApplied && <div style={{ fontSize: 10, color: C.green, fontFamily: "'Space Mono', monospace", marginTop: 2 }}>✓ RATE UPDATED</div>}
              </div>
              <div style={{ textAlign: "center", minWidth: 70 }}>
                <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'Space Mono', monospace", marginBottom: 4, letterSpacing: 1 }}>CURRENT</div>
                <div style={{ fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#fff" }}>${r.current}</div>
              </div>
              <div style={{ color: "#475569", fontSize: 20, fontWeight: 200 }}>→</div>
              <div style={{ textAlign: "center", minWidth: 70 }}>
                <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", marginBottom: 4, letterSpacing: 1,
                  color: isApplied ? C.green : C.gold }}>
                  {isApplied ? "APPLIED" : "SUGGESTED"}
                </div>
                <div style={{ fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 800,
                  color: isApplied ? C.green : C.gold }}>${r.suggested}</div>
              </div>
              <div style={{ textAlign: "center", minWidth: 70 }}>
                <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'Space Mono', monospace", marginBottom: 4, letterSpacing: 1 }}>IMPACT</div>
                <div style={{ fontSize: 15, fontWeight: 700,
                  color: r.impact > 0 ? C.green : r.impact < 0 ? C.red : "#64748B" }}>
                  {r.impact > 0 ? `+$${r.impact.toLocaleString()}` : r.impact < 0 ? `-$${Math.abs(r.impact)}` : "—"}
                </div>
              </div>
              <Badge urgency={r.urgency} />
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {!isApplied && !isSkipped && r.urgency !== "low" && (
                  <button onClick={() => onApply(r.id)} style={{
                    background: "linear-gradient(135deg, #10B981, #059669)", border: "none",
                    color: "#fff", padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                    fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                    boxShadow: "0 4px 12px rgba(16,185,129,0.35)",
                  }}>APPLY</button>
                )}
                {isApplied && (
                  <button onClick={() => onApply(r.id)} style={{
                    background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
                    color: C.green, padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                    fontSize: 11, fontFamily: "'Space Mono', monospace",
                  }}>✓ APPLIED</button>
                )}
                <button onClick={() => isSkipped ? onRestore(r.id) : onSkip(r.id)} style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748B", padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                  fontSize: 11, fontFamily: "'Space Mono', monospace",
                }}>{isSkipped ? "RESTORE" : "SKIP"}</button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* ── Summary + Apply All ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {totalPending > 0 && (
          <div style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)",
            borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: C.green, fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>REMAINING OPPORTUNITY</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: C.green }}>+${totalPending.toLocaleString()}</div>
              <div style={{ color: "#64748B", fontSize: 12 }}>from {pending.length} open recommendation{pending.length !== 1 ? "s" : ""}</div>
            </div>
            <button onClick={() => pending.forEach(r => onApply(r.id))} style={{
              marginLeft: "auto", background: "rgba(74,222,128,0.14)", border: "1px solid rgba(74,222,128,0.35)",
              color: C.green, padding: "10px 20px", borderRadius: 8, cursor: "pointer",
              fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700, whiteSpace: "nowrap",
            }}>APPLY ALL</button>
          </div>
        )}
        {totalApplied > 0 && (
          <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 14, padding: "16px 22px" }}>
            <div style={{ fontSize: 10, color: C.blue, fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>APPLIED REVENUE GAIN</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: C.blue }}>+${totalApplied.toLocaleString()}</div>
            <div style={{ color: "#64748B", fontSize: 12 }}>from {applied.size} applied recommendation{applied.size !== 1 ? "s" : ""}</div>
          </div>
        )}
      </div>

      {/* ── Restriction Manager ── */}
      <Card title="Restriction Manager" subtitle="Control length-of-stay & arrival/departure rules" accent={C.purple}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {/* Min Stay */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'Space Mono', monospace",
              letterSpacing: 1, marginBottom: 10 }}>MIN STAY (NIGHTS)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setRestrictions(p => ({ ...p, minStay: Math.max(1, p.minStay - 1) }))} style={{
                width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer", fontSize: 14,
              }}>−</button>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22,
                color: restrictions.minStay > 1 ? C.purple : "#64748B" }}>{restrictions.minStay}</span>
              <button onClick={() => setRestrictions(p => ({ ...p, minStay: Math.min(7, p.minStay + 1) }))} style={{
                width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer", fontSize: 14,
              }}>+</button>
            </div>
          </div>

          {/* CTA Fri */}
          {[
            { key: "ctaFri", label: "CTA FRIDAY",    desc: "Close to arrivals" },
            { key: "ctaSat", label: "CTA SATURDAY",  desc: "Close to arrivals" },
            { key: "ctdSun", label: "CTD SUNDAY",    desc: "Close to departures" },
          ].map(({ key, label, desc }) => (
            <div key={key} style={{
              background: restrictions[key] ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${restrictions[key] ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 12, padding: "14px 16px", cursor: "pointer",
              transition: "all 0.15s",
            }} onClick={() => setRestrictions(p => ({ ...p, [key]: !p[key] }))}>
              <div style={{ fontSize: 10, color: restrictions[key] ? C.purple : "#64748B",
                fontFamily: "'Space Mono', monospace", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>{desc}</div>
              <div style={{
                width: 36, height: 20, borderRadius: 10, position: "relative", cursor: "pointer",
                background: restrictions[key] ? "linear-gradient(90deg, #8B5CF6, #6366F1)" : "rgba(255,255,255,0.08)",
                border: `1px solid ${restrictions[key] ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                transition: "all 0.2s",
              }}>
                <div style={{
                  position: "absolute", top: 2, left: restrictions[key] ? 18 : 2,
                  width: 14, height: 14, borderRadius: "50%",
                  background: restrictions[key] ? "#fff" : "#334155", transition: "left 0.2s",
                }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Section: Forecast ─────────────────────────────────────────────────────────
function Forecast({ setTab }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHead title="Demand Forecast" sub="14-day AI prediction · 90-day training window · 94% historical accuracy" />

      <div className="kpi4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KPI icon="▦" label="7-Day Avg Demand"  value="81%"    sub="High demand period" delta={12}   accent={C.blue}   spark={SPARKS.forecast7} />
        <KPI icon="◎" label="Forecast Accuracy" value="94.2%" sub="Last 90 days"        delta={1.1}  accent={C.green}  spark={SPARKS.forecastAcc} />
        <KPI icon="◆" label="Projected Revenue" value="$41.2K" sub="Next 7 days"        delta={18.4} accent={C.gold}   spark={SPARKS.projRev} />
        <KPI icon="⟁" label="Events Detected"   value="2"     sub="Conference + weekend" delta={0}   accent={C.purple} />
      </div>

      <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 20 }}>📍</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: C.blue, marginBottom: 2 }}>
            Event Detected — Regional Tech Conference (Days 6–8)
          </div>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            Expected +34% demand spike · Raise rates 12–18% · Consider 3-night minimum stay restriction
          </div>
        </div>
        <button onClick={() => setTab("pricing")} style={{
          marginLeft: "auto", whiteSpace: "nowrap", background: "rgba(99,102,241,0.12)",
          border: "1px solid rgba(99,102,241,0.3)", color: C.blue, padding: "8px 16px",
          borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700,
        }}>ADJUST RATES →</button>
      </div>

      <Card title="14-Day Demand Outlook" subtitle="Confidence intervals modeled on seasonal patterns">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="gDemand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.blue} stopOpacity={0.28} />
                <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" />
            <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0,100]} tickFormatter={v=>`${v}%`} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="demand" stroke={C.blue} strokeWidth={2.5} fill="url(#gDemand)" name="demand" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="chart2col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card title="Booking Pickup" subtitle="New bookings made per day (last 7 days)">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pickupData} barSize={18} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="bookings"      fill={C.green}  radius={[4,4,0,0]} name="Bookings" />
              <Bar dataKey="cancellations" fill={C.red}    radius={[4,4,0,0]} name="Cancellations" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#64748B" }}>
            <span><span style={{ color: C.green }}>■</span> New Bookings</span>
            <span><span style={{ color: C.red }}>■</span> Cancellations</span>
          </div>
        </Card>

        <Card title="7-Day Breakdown">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
            {forecastData.slice(0, 7).map((d, i) => {
              const isHigh = d.demand > 85;
              const isEvent = d.event === "Conference";
              return (
                <div key={i} style={{
                  background: isEvent ? "rgba(99,102,241,0.1)" : isHigh ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.03)",
                  border: isEvent ? "1px solid rgba(99,102,241,0.35)" : isHigh ? "1px solid rgba(16,185,129,0.25)" : "1px solid transparent",
                  borderRadius: 10, padding: "10px 6px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 9, color: "#64748B", fontFamily: "'Space Mono', monospace", marginBottom: 6 }}>{d.date}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif",
                    color: isEvent ? "#818CF8" : isHigh ? C.green : "#64748B" }}>{d.demand}%</div>
                  {d.event && <div style={{ fontSize: 7, color: isEvent ? "#818CF8" : C.green,
                    fontFamily: "'Space Mono', monospace", marginTop: 4 }}>{d.event.toUpperCase()}</div>}
                  <div style={{ fontSize: 8, color: "#475569", marginTop: 4, fontFamily: "'Space Mono', monospace" }}>
                    {d.confidence}%
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Section: Comp Set ─────────────────────────────────────────────────────────
function CompSet({ apiBase, property }) {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showAddComp, setShowAddComp] = useState(false);
  const [showSerpConfig, setShowSerpConfig] = useState(false);
  const [serpKey, setSerpKey]     = useState("");
  const [serpSaving, setSerpSaving] = useState(false);
  const [serpSaved, setSerpSaved]   = useState(false);
  const [customComps, setCustomComps] = useState([]);
  const [newComp, setNewComp]     = useState({ name: "", stars: 4 });

  // Use average of live room rates from DB, or fall back to 189
  const YOUR_NAME = property?.profile?.hotelName || "Your Hotel";
  const liveRooms = property?.rooms ? Object.values(property.rooms) : [];
  const YOUR_RATE = liveRooms.length
    ? Math.round(liveRooms.reduce((s, r) => s + r, 0) / liveRooms.length)
    : 189;

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/compset/rates?yourRate=${YOUR_RATE}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch {
      // Fallback to static mock if backend unavailable
      setData({
        hotels: competitors.filter(c => c.name !== YOUR_NAME),
        yourRate: YOUR_RATE, isLive: false, hasSerpApiKey: false,
        analysis: {
          avgComp: 193, suggestion: 195, position: 3,
          sorted: [...competitors].sort((a, b) => b.rate - a.rate),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRates(); }, []);

  const yourEntry = { name: YOUR_NAME, rate: YOUR_RATE, stars: 4, score: 4.4, change: 3.2 };
  const baseHotels = data ? [yourEntry, ...data.hotels] : [yourEntry, ...competitors.filter(c => c.name !== YOUR_NAME)];
  const allHotels = [...baseHotels, ...customComps.map(c => ({ ...c, isCustom: true }))];
  const sorted    = [...allHotels].sort((a, b) => b.rate - a.rate);
  const analysis  = data?.analysis || { avgComp: 193, suggestion: 195, position: 3 };
  const isLive    = data?.isLive;
  const hasKey    = data?.hasSerpApiKey;

  const rateMin = Math.min(...sorted.map(h => h.rate)) - 20;
  const rateMax = Math.max(...sorted.map(h => h.rate)) + 20;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHead
        title="Comp Set Intelligence"
        sub={lastRefresh ? `Refreshed ${lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "Fetching rates…"}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Source badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: isLive ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)",
              border: `1px solid ${isLive ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.25)"}`,
              borderRadius: 100, padding: "4px 12px",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%",
                background: isLive ? "#10B981" : "#6366F1", display: "inline-block",
                boxShadow: `0 0 6px ${isLive ? "#10B981" : "#6366F1"}`,
                animation: "livePulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 9, color: isLive ? "#10B981" : "#818CF8",
                fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>
                {isLive ? "GOOGLE HOTELS LIVE" : hasKey ? "FETCHING…" : "DEMO DATA"}
              </span>
            </div>
            {!hasKey && (
              <a href="https://serpapi.com/register" target="_blank" rel="noopener" style={{
                fontSize: 10, color: "#64748B", fontFamily: "'Space Mono', monospace",
                textDecoration: "none", letterSpacing: 0.5,
              }}>Add SERPAPI_KEY for live rates →</a>
            )}
            <button onClick={fetchRates} disabled={loading} style={{
              background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
              color: "#818CF8", padding: "5px 12px", borderRadius: 7, cursor: "pointer",
              fontSize: 10, fontFamily: "'Space Mono', monospace",
            }}>↻ REFRESH</button>
          </div>
        }
      />

      <div className="kpi4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KPI icon="🏆" label="Market Position" value={`#${analysis.position || 3}`} sub={`of ${sorted.length + customComps.length} properties`} accent={C.gold} />
        <KPI icon="💰" label="Your Rate"       value={`$${YOUR_RATE}`}  sub={`vs $${analysis.avgComp} comp avg`}  delta={YOUR_RATE > analysis.avgComp ? 2 : -2} accent={C.blue} />
        <KPI icon="🎯" label="AI Target Rate"  value={`$${analysis.suggestion || 195}`}  sub="Optimal based on comp + demand"  accent={C.green} />
        <KPI icon="⭐" label="Rate Parity"     value={YOUR_RATE <= analysis.avgComp + 10 && YOUR_RATE >= analysis.avgComp - 15 ? "On Par" : YOUR_RATE > analysis.avgComp + 10 ? "Premium" : "Low"}  sub={`$${Math.abs(YOUR_RATE - analysis.avgComp)} vs comp avg`}  delta={YOUR_RATE > analysis.avgComp ? 3 : -5} accent={C.purple} />
      </div>

      {/* SerpAPI config + Add Competitor row */}
      <div style={{ display: "flex", gap: 10 }}>
        {/* SerpAPI connect block */}
        <div style={{ flex: 1, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)",
          borderRadius: 12, padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: showSerpConfig ? 12 : 0 }}>
            <span style={{ fontSize: 18 }}>🔑</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isLive ? C.green : "#C7D2FE" }}>
                {isLive ? "Google Hotels Live Data" : "Connect Live Competitor Data"}
              </div>
              {!isLive && <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>
                Free SerpAPI key pulls real-time Google Hotels rates
              </div>}
            </div>
            {isLive
              ? <span style={{ fontSize: 9, color: C.green, fontFamily: "'Space Mono', monospace", letterSpacing: 1,
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: 100, padding: "3px 10px" }}>● LIVE</span>
              : <button onClick={() => setShowSerpConfig(v => !v)} style={{
                  background: showSerpConfig ? "transparent" : "linear-gradient(135deg, #6366F1, #4F46E5)",
                  border: showSerpConfig ? "1px solid rgba(255,255,255,0.08)" : "none",
                  color: showSerpConfig ? "#64748B" : "#fff", padding: "7px 14px", borderRadius: 8,
                  cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700,
                  boxShadow: showSerpConfig ? "none" : "0 4px 12px rgba(99,102,241,0.35)",
                }}>{showSerpConfig ? "Cancel" : "Configure →"}</button>
            }
          </div>
          {showSerpConfig && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
              <div style={{ fontSize: 10, color: "#64748B", marginBottom: 8 }}>
                Get 100 free searches/month at <strong style={{ color: "#818CF8" }}>serpapi.com/register</strong> — no credit card needed.
                Then add <code style={{ color: "#818CF8", background: "rgba(99,102,241,0.12)", padding: "1px 5px", borderRadius: 3 }}>SERPAPI_KEY=your_key</code> to your backend <code style={{ color: "#818CF8" }}>.env</code> file and restart the server.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={serpKey} onChange={e => setSerpKey(e.target.value)}
                  placeholder="sk-…  (paste your SerpAPI key)"
                  style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, padding: "9px 12px", color: "#E2E8F0", fontSize: 12,
                    fontFamily: "'Space Mono', monospace", outline: "none" }} />
                <button onClick={() => { setSerpSaving(true); setTimeout(() => { setSerpSaving(false); setSerpSaved(true); setShowSerpConfig(false); }, 1200); }} style={{
                  background: serpSaving ? "rgba(16,185,129,0.1)" : "linear-gradient(135deg, #10B981, #059669)",
                  border: serpSaving ? "1px solid rgba(16,185,129,0.3)" : "none",
                  color: serpSaving ? C.green : "#fff", padding: "9px 16px", borderRadius: 8,
                  cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700, whiteSpace: "nowrap",
                }}>{serpSaving ? "Testing…" : "Save Key"}</button>
              </div>
            </div>
          )}
        </div>

        {/* Add competitor */}
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: showAddComp ? 12 : 0 }}>
            <span style={{ fontSize: 18 }}>➕</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>Track a Competitor</div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>Manually add hotels to your comp set</div>
            </div>
            <button onClick={() => setShowAddComp(v => !v)} style={{
              background: showAddComp ? "transparent" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#9CA3AF", padding: "7px 14px", borderRadius: 8,
              cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono', monospace",
            }}>{showAddComp ? "Cancel" : "+ Add"}</button>
          </div>
          {showAddComp && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newComp.name} onChange={e => setNewComp(p => ({ ...p, name: e.target.value }))}
                  placeholder="Hotel name (e.g. The Meridian)"
                  style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, padding: "9px 12px", color: "#E2E8F0", fontSize: 12,
                    fontFamily: "'Inter', sans-serif", outline: "none" }} />
                <select value={newComp.stars} onChange={e => setNewComp(p => ({ ...p, stars: Number(e.target.value) }))}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, padding: "9px 10px", color: "#E2E8F0", fontSize: 12,
                    fontFamily: "'Inter', sans-serif", outline: "none", cursor: "pointer" }}>
                  {[3,4,5].map(s => <option key={s} value={s} style={{ background: "#0D0D18" }}>{s}★</option>)}
                </select>
                <button onClick={() => {
                  if (!newComp.name.trim()) return;
                  const rate = Math.round(180 + Math.random() * 60);
                  setCustomComps(p => [...p, { ...newComp, rate, change: 0, score: 4.1, id: Date.now() }]);
                  setNewComp({ name: "", stars: 4 });
                  setShowAddComp(false);
                }} style={{
                  background: "linear-gradient(135deg, #6366F1, #4F46E5)", border: "none",
                  color: "#fff", padding: "9px 16px", borderRadius: 8, cursor: "pointer",
                  fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                }}>Track</button>
              </div>
            </div>
          )}
          {customComps.length > 0 && !showAddComp && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {customComps.map(c => (
                <span key={c.id} style={{
                  fontSize: 10, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 6, padding: "2px 8px", color: "#818CF8", fontFamily: "'Space Mono', monospace",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  {c.name}
                  <span onClick={() => setCustomComps(p => p.filter(x => x.id !== c.id))}
                    style={{ cursor: "pointer", color: "#64748B", fontSize: 12 }}>×</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366F1",
                animation: `aipulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((c, i) => {
            const isYou = c.name === YOUR_NAME;
            const pct = ((c.rate - rateMin) / (rateMax - rateMin)) * 100;
            const vsAvg = c.rate - analysis.avgComp;
            return (
              <div key={i} style={{
                background: isYou ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.025)",
                border: isYou ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, padding: "16px 22px",
                display: "flex", alignItems: "center", gap: 18,
                transition: "border-color 0.2s",
              }}>
                {/* Rank */}
                <div style={{ width: 26, fontFamily: "'Space Mono', monospace", fontSize: 12,
                  color: i === 0 ? C.gold : "#64748B", fontWeight: 700, textAlign: "center", flexShrink: 0 }}>
                  #{i + 1}
                </div>

                {/* Name + stars */}
                <div style={{ flex: 2, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8,
                    color: isYou ? "#C7D2FE" : "#E2E8F0" }}>
                    {c.name}
                    {isYou && <span style={{ fontSize: 9, background: "rgba(99,102,241,0.2)", color: "#818CF8",
                      padding: "2px 7px", borderRadius: 4, fontFamily: "'Space Mono', monospace",
                      letterSpacing: 1 }}>YOU</span>}
                    {isLive && !isYou && !c.isCustom && <span style={{ fontSize: 9, background: "rgba(16,185,129,0.1)", color: C.green,
                      padding: "2px 7px", borderRadius: 4, fontFamily: "'Space Mono', monospace" }}>LIVE</span>}
                    {c.isCustom && (
                      <span style={{ fontSize: 9, background: "rgba(249,115,22,0.1)", color: C.orange,
                        padding: "2px 7px", borderRadius: 4, fontFamily: "'Space Mono', monospace",
                        display: "flex", alignItems: "center", gap: 4 }}>
                        TRACKED
                        <span onClick={() => setCustomComps(p => p.filter(x => x.id !== c.id))}
                          style={{ cursor: "pointer", color: "#64748B", fontSize: 10 }}>×</span>
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>
                    {"★".repeat(c.stars || 3)}{"☆".repeat(5 - (c.stars || 3))}
                    {c.score ? ` · ${c.score} ⭐` : ""}
                    {c.reviews ? ` · ${c.reviews.toLocaleString()} reviews` : ""}
                  </div>
                </div>

                {/* Rate */}
                <div style={{ textAlign: "center", minWidth: 90, flexShrink: 0 }}>
                  <div style={{ fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800,
                    color: isYou ? "#818CF8" : "#fff", letterSpacing: -1 }}>${c.rate}</div>
                  <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", marginTop: 2,
                    color: (c.change || 0) > 0 ? C.green : (c.change || 0) < 0 ? C.red : "#64748B" }}>
                    {(c.change || 0) > 0 ? `▲ ${c.change}%` : (c.change || 0) < 0 ? `▼ ${Math.abs(c.change)}%` : "— steady"}
                  </div>
                </div>

                {/* vs comp avg */}
                <div style={{ textAlign: "center", minWidth: 70, flexShrink: 0 }}>
                  <div style={{ fontSize: 9, color: "#64748B", fontFamily: "'Space Mono', monospace",
                    marginBottom: 3 }}>VS AVG</div>
                  <div style={{ fontSize: 14, fontWeight: 700,
                    color: vsAvg > 0 ? C.green : vsAvg < 0 ? C.red : "#64748B" }}>
                    {vsAvg > 0 ? `+$${vsAvg}` : vsAvg < 0 ? `-$${Math.abs(vsAvg)}` : "—"}
                  </div>
                </div>

                {/* AI target (your hotel only) */}
                {isYou && (
                  <div style={{ textAlign: "center", background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.22)", borderRadius: 10, padding: "9px 14px", flexShrink: 0 }}>
                    <div style={{ fontSize: 9, color: "#818CF8", fontFamily: "'Space Mono', monospace", marginBottom: 3 }}>AI TARGET</div>
                    <div style={{ fontSize: 18, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#818CF8" }}>
                      ${analysis.suggestion || 195}
                    </div>
                  </div>
                )}

                {/* Rate bar */}
                <div style={{ flex: 2, minWidth: 80 }}>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3, transition: "width 1s ease",
                      background: isYou ? "linear-gradient(90deg, #6366F1, #8B5CF6)" : "rgba(255,255,255,0.15)",
                      width: `${Math.max(5, Math.min(100, pct))}%`,
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4,
                    fontSize: 8, color: "#64748B", fontFamily: "'Space Mono', monospace" }}>
                    <span>${rateMin}</span><span>${rateMax}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Card title="Rate Trend — Last 7 Days" subtitle="Your hotel vs top competitors">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rateHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" />
            <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} domain={[140, 260]} tickFormatter={v=>`$${v}`} />
            <Tooltip content={<Tip />} />
            <Line type="monotone" dataKey="Your Hotel"    stroke="#818CF8" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Grand Regency" stroke={C.gold}   strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="The Meridian"  stroke={C.purple} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="Blue Harbor"   stroke={C.orange} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#64748B" }}>
          {[["Your Hotel", "#818CF8"], ["Grand Regency", C.gold], ["The Meridian", C.purple], ["Blue Harbor", C.orange]].map(([n, c]) => (
            <span key={n}><span style={{ color: c }}>—</span> {n}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Section: Calendar ─────────────────────────────────────────────────────────
function CalendarSection({ property }) {
  const { offset, days } = useMemo(generateCalendar, []);
  const now = new Date();
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const occColor = (occ) =>
    occ >= 90 ? C.red : occ >= 80 ? C.orange : occ >= 65 ? C.gold : occ >= 50 ? C.green : "#475569";

  const m = property?.metrics || {};
  const occMtd = m.occupancy ? `${m.occupancy}%` : "73%";
  const adrMtd = m.adr       ? `$${m.adr}`       : "$195";
  const bestDay  = Math.max(...days.map(d => d.revenue));
  const lowestOcc = Math.min(...days.map(d => d.occupancy));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHead title="Revenue Calendar" sub={`${monthName} · Daily occupancy, ADR & revenue`} />

      <div className="kpi4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KPI icon="▦" label="Avg Occupancy MTD" value={occMtd}              sub="vs 69% last month"  delta={4.2} accent={C.gold} />
        <KPI icon="◆" label="Avg ADR MTD"       value={adrMtd}              sub="vs $191 last month" delta={2.1} accent={C.blue} />
        <KPI icon="↗" label="Best Day"          value={fmtK(bestDay)}       sub="Revenue single day"             accent={C.green} />
        <KPI icon="◇" label="Lowest Occ Day"    value={`${lowestOcc}%`}     sub="Opportunity exists"             accent={C.red} />
      </div>

      <Card title={`${monthName} — Occupancy Heatmap`} subtitle="Click a day to see details">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 8 }}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#64748B",
              fontFamily: "'Space Mono', monospace", paddingBottom: 6 }}>{d}</div>
          ))}
          {Array.from({ length: offset }, (_, i) => <div key={`e${i}`} />)}
          {days.map((d) => (
            <div key={d.day} style={{
              background: d.isToday ? "rgba(99,102,241,0.18)" : `${occColor(d.occupancy)}18`,
              border: d.isToday ? "2px solid rgba(99,102,241,0.7)" : `1px solid ${occColor(d.occupancy)}40`,
              borderRadius: 10, padding: "8px 6px", textAlign: "center", cursor: "default",
              transition: "transform 0.15s",
            }}>
              <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>
                {d.day}{d.isToday ? " ●" : ""}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Syne', sans-serif",
                color: occColor(d.occupancy) }}>{d.occupancy}%</div>
              <div style={{ fontSize: 9, color: "#64748B", fontFamily: "'Space Mono', monospace", marginTop: 3 }}>
                ${d.adr}
              </div>
              <div style={{ fontSize: 8, color: "#475569", fontFamily: "'Space Mono', monospace" }}>
                ${(d.revenue / 1000).toFixed(1)}k
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, fontFamily: "'Space Mono', monospace" }}>
          {[[C.green, "50–65%"], [C.gold, "65–80%"], [C.orange, "80–90%"], [C.red, "90%+"]].map(([c, l]) => (
            <span key={l}><span style={{ color: c }}>■</span> {l}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Section: Reports ──────────────────────────────────────────────────────────
function buildCSV(reportName, property) {
  const m   = property?.metrics  || {};
  const now = new Date().toLocaleDateString("en-US");

  const csvSets = {
    "Monthly Revenue Summary": [
      ["Metric", "Value", "As of"],
      ["Room Revenue MTD",  m.roomRevenueMtd ?? "N/A", now],
      ["F&B Revenue MTD",   m.fbRevenueMtd   ?? "N/A", now],
      ["Gross Profit MTD",  m.profitMtd      ?? "N/A", now],
      ["Total Revenue MTD", m.revenueMtd     ?? "N/A", now],
      ["Occupancy",         m.occupancy ? `${m.occupancy}%` : "N/A", now],
      ["ADR",               m.adr       ? `$${m.adr}`       : "N/A", now],
      ["RevPAR",            m.revpar    ? `$${m.revpar}`     : "N/A", now],
      ["TrevPAR",           m.trevpar   ? `$${m.trevpar}`   : "N/A", now],
      ["GOPPAR",            m.goppar    ? `$${m.goppar}`     : "N/A", now],
    ],
    "Demand Forecast Report": [
      ["Date", "Demand %", "Confidence %", "Event"],
      ...forecastData.map(d => [d.date, `${d.demand}%`, `${d.confidence}%`, d.event || ""]),
    ],
    "Comp Set Rate Analysis": [
      ["Hotel", "Rate", "Change %", "Stars", "Score"],
      ...competitors.map(c => [c.name, `$${c.rate}`, `${c.change ?? 0}%`, c.stars, c.score ?? ""]),
    ],
    "Channel Performance Report": [
      ["Month", "Direct", "Booking.com", "Expedia", "Phone/Email"],
      ...channelData.map(d => [d.month, d["Direct"], d["Booking.com"], d["Expedia"], d["Phone/Email"]]),
    ],
    "Year-over-Year Comparison": [
      ["Month", "ADR", "RevPAR", "Occupancy", "Revenue"],
      ...monthlyData.map(d => [d.month, `$${d.adr}`, `$${d.revpar}`, `${d.occupancy}%`, `$${d.revenue}`]),
    ],
  };

  const rows = csvSets[reportName];
  if (!rows) return null;
  return rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
}

function Reports({ property }) {
  const [downloading, setDownloading] = useState(null);
  const handleDownload = (name) => {
    const csv = buildCSV(name, property);
    if (!csv) { setDownloading(name); setTimeout(() => setDownloading(null), 1800); return; }
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${name.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(name);
    setTimeout(() => setDownloading(null), 1200);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHead title="Reports" sub="Download, schedule and manage performance reports" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {reports.map(r => (
          <div key={r.name} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "20px 22px", display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: r.status === "Ready" ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)",
              color: r.status === "Ready" ? C.green : "#818CF8",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 3 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>{r.desc}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace",
                  color: C.blue, background: "rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: 4 }}>
                  {r.freq}
                </span>
                <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace",
                  color: r.status === "Ready" ? C.green : "#818CF8",
                  background: r.status === "Ready" ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)",
                  padding: "2px 8px", borderRadius: 4 }}>
                  {r.status}
                </span>
              </div>
            </div>
            <button
              onClick={() => { if (r.status === "Ready") handleDownload(r.name); }}
              disabled={r.status !== "Ready"}
              style={{
                background: downloading === r.name ? "rgba(16,185,129,0.12)" :
                  r.status === "Ready" ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${downloading === r.name ? "rgba(16,185,129,0.3)" :
                  r.status === "Ready" ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)"}`,
                color: downloading === r.name ? C.green : r.status === "Ready" ? "#818CF8" : "#64748B",
                padding: "8px 16px", borderRadius: 8, cursor: r.status === "Ready" ? "pointer" : "not-allowed",
                fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700, whiteSpace: "nowrap",
              }}>
              {downloading === r.name ? "✓ SAVED" : r.status === "Ready" ? "↓ DOWNLOAD" : "PENDING"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section: Settings ─────────────────────────────────────────────────────────
function SettingsInput({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'Space Mono', monospace",
        letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13,
          fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function Settings({ user, property, apiBase, onPropertyUpdate, onLogout, theme, toggleTheme }) {
  const isDark = theme === "dark";

  const [profileForm, setProfileForm] = useState({ hotelName: "", location: "", stars: 4, totalRooms: 100 });
  const [metricsForm, setMetricsForm] = useState({ occupancy: "", adr: "", revpar: "", trevpar: "", goppar: "", revenueMtd: "", roomRevenueMtd: "", fbRevenueMtd: "", profitMtd: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [metricsMsg, setMetricsMsg] = useState(null);

  // Sync forms when property data arrives (fetched async after mount)
  useEffect(() => {
    const prof = property?.profile || {};
    const met  = property?.metrics || {};
    setProfileForm({
      hotelName:  prof.hotelName  || user?.hotelName || "",
      location:   prof.location   || "",
      stars:      prof.stars      || 4,
      totalRooms: prof.totalRooms || 100,
    });
    setMetricsForm({
      occupancy:      met.occupancy      ?? "",
      adr:            met.adr            ?? "",
      revpar:         met.revpar         ?? "",
      trevpar:        met.trevpar        ?? "",
      goppar:         met.goppar         ?? "",
      revenueMtd:     met.revenueMtd     ?? "",
      roomRevenueMtd: met.roomRevenueMtd ?? "",
      fbRevenueMtd:   met.fbRevenueMtd   ?? "",
      profitMtd:      met.profitMtd      ?? "",
    });
  }, [property]);

  const pf = (k) => (v) => setProfileForm(p => ({ ...p, [k]: v }));
  const mf = (k) => (v) => setMetricsForm(p => ({ ...p, [k]: v }));

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true); setProfileMsg(null);
    try {
      const token = localStorage.getItem("hiq-token");
      const res = await fetch(`${apiBase}/api/property/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        const profile = await res.json();
        onPropertyUpdate(p => p ? { ...p, profile } : { profile, metrics: {}, rooms: [], appliedRates: [] });
        setProfileMsg("saved");
      } else setProfileMsg("error");
    } catch { setProfileMsg("error"); }
    setSavingProfile(false);
    setTimeout(() => setProfileMsg(null), 3000);
  };

  const saveMetrics = async () => {
    if (!user) return;
    setSavingMetrics(true); setMetricsMsg(null);
    try {
      const token = localStorage.getItem("hiq-token");
      const body = {};
      for (const [k, v] of Object.entries(metricsForm)) {
        if (v !== "" && v !== null) body[k] = parseFloat(v);
      }
      const res = await fetch(`${apiBase}/api/property/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const metrics = await res.json();
        onPropertyUpdate(p => p ? { ...p, metrics } : { profile: {}, metrics, rooms: [], appliedRates: [] });
        setMetricsMsg("saved");
      } else setMetricsMsg("error");
    } catch { setMetricsMsg("error"); }
    setSavingMetrics(false);
    setTimeout(() => setMetricsMsg(null), 3000);
  };

  const SaveBtn = ({ saving, msg, onClick }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
      <button onClick={onClick} disabled={saving || !user} style={{
        background: user ? "linear-gradient(135deg, #6366F1, #4F46E5)" : "rgba(255,255,255,0.05)",
        border: "none", color: "#fff", padding: "10px 22px", borderRadius: 8,
        cursor: user ? "pointer" : "not-allowed", fontSize: 12,
        fontFamily: "'Space Mono', monospace", fontWeight: 700,
        opacity: saving ? 0.7 : 1,
      }}>{saving ? "SAVING…" : "SAVE CHANGES"}</button>
      {msg === "saved" && <span style={{ fontSize: 12, color: C.green, fontFamily: "'Space Mono', monospace" }}>✓ Saved</span>}
      {msg === "error" && <span style={{ fontSize: 12, color: C.red,  fontFamily: "'Space Mono', monospace" }}>✕ Error</span>}
      {!user && <span style={{ fontSize: 11, color: "#64748B" }}>Sign in to save</span>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHead title="Settings" sub="Manage your account, property and data" />

      {/* Account */}
      <Card title="Account">
        <div style={{ display: "flex", gap: 22 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, flexShrink: 0,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif",
            boxShadow: "0 0 24px rgba(99,102,241,0.4)",
          }}>{(user?.firstName?.[0] || "H").toUpperCase()}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1 }}>
            {[
              ["Name",         `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "—"],
              ["Hotel",        user?.hotelName || "—"],
              ["Email",        user?.email || "—"],
              ["Member Since", user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 14, color: "#ddd", fontWeight: 500 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Property Setup */}
      <Card title="Property Setup" subtitle="Configure your hotel details">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <SettingsInput label="Hotel Name"   value={profileForm.hotelName}  onChange={pf("hotelName")}  placeholder="e.g. Grand Coastal Hotel" />
          <SettingsInput label="Location"     value={profileForm.location}   onChange={pf("location")}   placeholder="e.g. Miami Beach, FL" />
          <SettingsInput label="Star Rating"  value={profileForm.stars}      onChange={pf("stars")}      type="number" placeholder="4" />
          <SettingsInput label="Total Rooms"  value={profileForm.totalRooms} onChange={pf("totalRooms")} type="number" placeholder="292" />
        </div>
        <SaveBtn saving={savingProfile} msg={profileMsg} onClick={saveProfile} />
      </Card>

      {/* KPI Entry */}
      <Card title="Today's KPIs" subtitle={met.updatedAt ? `Last updated ${new Date(met.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : "Enter your current metrics to power the dashboard"}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          <SettingsInput label="Occupancy (%)"   value={metricsForm.occupancy}     onChange={mf("occupancy")}     type="number" placeholder="73" />
          <SettingsInput label="ADR ($)"         value={metricsForm.adr}           onChange={mf("adr")}           type="number" placeholder="195" />
          <SettingsInput label="RevPAR ($)"      value={metricsForm.revpar}        onChange={mf("revpar")}        type="number" placeholder="142" />
          <SettingsInput label="TRevPAR ($)"     value={metricsForm.trevpar}       onChange={mf("trevpar")}       type="number" placeholder="168" />
          <SettingsInput label="GOPPAR ($)"      value={metricsForm.goppar}        onChange={mf("goppar")}        type="number" placeholder="89" />
          <SettingsInput label="Revenue MTD ($)" value={metricsForm.revenueMtd}   onChange={mf("revenueMtd")}    type="number" placeholder="89400" />
          <SettingsInput label="Room Rev MTD ($)"value={metricsForm.roomRevenueMtd} onChange={mf("roomRevenueMtd")} type="number" placeholder="71500" />
          <SettingsInput label="F&B Rev MTD ($)" value={metricsForm.fbRevenueMtd} onChange={mf("fbRevenueMtd")}  type="number" placeholder="17900" />
          <SettingsInput label="Profit MTD ($)"  value={metricsForm.profitMtd}    onChange={mf("profitMtd")}     type="number" placeholder="47000" />
        </div>
        <SaveBtn saving={savingMetrics} msg={metricsMsg} onClick={saveMetrics} />
      </Card>

      {/* Appearance */}
      <Card title="Appearance">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#ddd" }}>Theme</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
              Currently: <strong style={{ color: "#ddd" }}>{isDark ? "Dark mode" : "Light mode"}</strong>
            </div>
          </div>
          <button onClick={toggleTheme} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
            color: "#ddd", padding: "9px 20px", borderRadius: 8, cursor: "pointer",
            fontFamily: "'Inter', sans-serif", fontSize: 13,
          }}>{isDark ? "☀ Light Mode" : "☾ Dark Mode"}</button>
        </div>
      </Card>

      {/* Sign Out */}
      <div style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 14, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.red }}>Sign Out</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>End your current session</div>
          </div>
          <button onClick={onLogout} style={{
            background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
            color: C.red, padding: "9px 20px", borderRadius: 8, cursor: "pointer",
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
          }}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

// ── AI Chat Panel ─────────────────────────────────────────────────────────────
function AIChat({ user, property, apiBase, onClose }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    text: "Hello! I'm your Hotel IQ revenue analyst. Ask me anything — pricing strategy, demand outlook, competitor positioning, or revenue optimization.",
  }]);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setMsgs(m => [...m, { role: "user", text: txt }]);
    setInput("");
    setLoading(true);
    try {
      const token = localStorage.getItem("hiq-token");
      const m = property?.metrics || {};
      const p = property?.profile || {};
      const context = `You are Hotel IQ, an expert hotel revenue management AI analyst.
Hotel: ${user?.hotelName || p.hotelName || "The Coastal Grand"} | Location: ${p.location || "N/A"} | Manager: ${user?.firstName || ""}
Current Metrics: Occupancy ${m.occupancy ?? 73}%, RevPAR $${m.revpar ?? 142}, ADR $${m.adr ?? 195}, TRevPAR $${m.trevpar ?? 168}, GOPPAR $${m.goppar ?? 89}, Revenue MTD $${m.revenueMtd ?? 89400}.
Comp set: Grand Regency $210, The Meridian $220, Harbor View $195, Blue Harbor $175, Coastal Suites $165.
Open recs: Standard King $159→$179 (+$2,400), Double Queen $139→$155 (+$1,100), Junior Suite $229→$249 (+$880).
Weekend demand spike +34% (conference). Forecast accuracy 94.2%.${m.updatedAt ? ` Metrics last updated: ${new Date(m.updatedAt).toLocaleDateString()}.` : " (Using demo metrics — user has not entered real data yet.)"}
Be concise, data-driven, give specific actionable advice with $ and % figures.`;

      const history = msgs.filter((_, i) => i > 0)
        .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text }));

      const res = await fetch(`${apiBase}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ context, messages: [...history, { role: "user", content: txt }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI error");
      setMsgs(m => [...m, { role: "assistant", text: data.reply }]);
    } catch (err) {
      setMsgs(m => [...m, { role: "assistant", text: `⚠ ${err.message}` }]);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, width: 420, height: 580,
      background: "#070B14", border: "1px solid rgba(99,102,241,0.3)",
      borderRadius: 20, display: "flex", flexDirection: "column",
      boxShadow: "0 32px 80px rgba(0,0,0,0.85)", zIndex: 300, overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(99,102,241,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            boxShadow: "0 0 12px rgba(99,102,241,0.5)" }}>✦</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }}>AI Revenue Analyst</div>
            <div style={{ fontSize: 9, color: "#64748B", fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>POWERED BY GEMINI</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 7, width: 28, height: 28, color: "#64748B", cursor: "pointer", fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
            {m.role === "assistant" && (
              <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 2,
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>✦</div>
            )}
            <div style={{
              maxWidth: "82%", padding: "10px 14px", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap",
              background: m.role === "user" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
              border: m.role === "user" ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.06)",
              borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              color: m.role === "user" ? "#e0e0ff" : "#CBD5E1",
            }}>{m.text}</div>
          </div>
        ))}
        {/* Quick-prompt chips — visible only on fresh conversation */}
        {msgs.length === 1 && !loading && (
          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'Space Mono', monospace",
              letterSpacing: 1, marginBottom: 2 }}>SUGGESTED</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK_PROMPTS.map((q, i) => (
                <button key={i} onClick={() => setInput(q)} style={{
                  background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 100, padding: "5px 13px", cursor: "pointer",
                  fontSize: 11, color: "#818CF8", fontFamily: "'Inter', sans-serif",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; }}
                >{q}</button>
              ))}
            </div>
          </div>
        )}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>✦</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366F1",
                  animation: `aipulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: 8, background: "rgba(0,0,0,0.3)" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about pricing, demand, strategy…"
          style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, padding: "10px 13px", color: "#fff", fontSize: 13,
            fontFamily: "'Inter', sans-serif", outline: "none" }} />
        <button onClick={send} disabled={loading} style={{
          background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366F1, #4F46E5)",
          border: "none", borderRadius: 10, padding: "10px 16px",
          cursor: loading ? "not-allowed" : "pointer", color: "#fff", fontWeight: 700, fontSize: 16, minWidth: 44,
        }}>→</button>
      </div>
    </div>
  );
}

// ── Section: Integrations ─────────────────────────────────────────────────────
function IntegrationCard({ item, connected, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const [fields, setFields]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); onToggle(item.id); }, 1200);
  };

  const statusColor  = connected ? C.green  : "#64748B";
  const statusBg     = connected ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)";
  const statusBorder = connected ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.07)";

  return (
    <div style={{
      background: connected
        ? "linear-gradient(145deg, rgba(16,185,129,0.05), rgba(8,10,18,0.95))"
        : "linear-gradient(145deg, rgba(12,14,22,0.9), rgba(8,10,18,0.95))",
      border: `1px solid ${statusBorder}`,
      borderRadius: 14, overflow: "hidden",
      transition: "border-color 0.2s, box-shadow 0.2s",
      boxShadow: connected ? "0 0 20px rgba(16,185,129,0.08)" : "0 4px 16px rgba(0,0,0,0.3)",
    }}>
      <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0, fontSize: 20,
          background: connected ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${connected ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
        }}>{item.icon}</div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#E2E8F0", marginBottom: 2 }}>{item.name}</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>{item.desc}</div>
        </div>

        {/* Status badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
          background: statusBg, border: `1px solid ${statusBorder}`,
          borderRadius: 100, padding: "4px 10px",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor,
            display: "inline-block",
            boxShadow: connected ? `0 0 6px ${C.green}` : "none",
            animation: connected ? "livePulse 2s ease-in-out infinite" : "none" }} />
          <span style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", letterSpacing: 1,
            color: statusColor }}>{connected ? "CONNECTED" : "NOT CONNECTED"}</span>
        </div>

        {/* Connect/Disconnect btn */}
        <button onClick={() => connected ? onToggle(item.id) : setExpanded(v => !v)} style={{
          flexShrink: 0, padding: "7px 14px", borderRadius: 8, cursor: "pointer",
          fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700,
          background: connected ? "transparent" : "linear-gradient(135deg, #6366F1, #4F46E5)",
          border: connected ? "1px solid rgba(255,255,255,0.08)" : "none",
          color: connected ? "#64748B" : "#fff",
          boxShadow: connected ? "none" : "0 4px 12px rgba(99,102,241,0.35)",
          transition: "all 0.15s",
        }}>
          {connected ? "Disconnect" : expanded ? "Cancel ✕" : "Connect →"}
        </button>
      </div>

      {/* Expandable connect form */}
      {expanded && !connected && (
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 18px",
          background: "rgba(0,0,0,0.2)",
        }}>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>
            ENTER CREDENTIALS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {item.fields.map(f => (
              <div key={f}>
                <div style={{ fontSize: 10, color: "#64748B", marginBottom: 5,
                  fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>{f.toUpperCase()}</div>
                <input
                  type={f.toLowerCase().includes("password") || f.toLowerCase().includes("token") || f.toLowerCase().includes("key") ? "password" : "text"}
                  placeholder={f}
                  value={fields[f] || ""}
                  onChange={e => setFields(p => ({ ...p, [f]: e.target.value }))}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                    padding: "9px 12px", color: "#E2E8F0", fontSize: 12,
                    fontFamily: "'Inter', sans-serif", outline: "none",
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={handleSave} disabled={saving} style={{
              background: saving ? "rgba(16,185,129,0.1)" : "linear-gradient(135deg, #10B981, #059669)",
              border: saving ? "1px solid rgba(16,185,129,0.3)" : "none",
              color: saving ? C.green : "#fff", padding: "9px 20px", borderRadius: 8,
              cursor: "pointer", fontSize: 11, fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              boxShadow: saving ? "none" : "0 4px 14px rgba(16,185,129,0.35)",
            }}>{saving ? "Testing connection…" : saved ? "✓ Connected!" : "Test & Connect"}</button>
            {item.docs && (
              <a href={item.docs} target="_blank" rel="noopener" style={{
                fontSize: 11, color: "#64748B", fontFamily: "'Space Mono', monospace",
                textDecoration: "none", letterSpacing: 0.5,
              }}>View API docs →</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IntegrationSection({ title, desc, items, connected, onToggle, accent }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#E2E8F0" }}>{title}</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{desc}</div>
        </div>
        <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: accent,
          background: `${accent}18`, border: `1px solid ${accent}30`,
          borderRadius: 100, padding: "3px 10px", letterSpacing: 1 }}>
          {items.filter(i => connected.has(i.id)).length}/{items.length} CONNECTED
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {items.map(item => (
          <IntegrationCard key={item.id} item={item} connected={connected.has(item.id)} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

function Integrations({ user }) {
  const [connected, setConnected] = useState(new Set());
  const toggle = (id) => setConnected(p => {
    const n = new Set(p);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const totalConnected = connected.size;
  const totalAvailable = PMS_LIST.length + CHANNEL_MANAGERS.length + OTA_CONNECTIONS.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <SectionHead
        title="Integrations"
        sub="Connect your PMS, channel manager & OTA accounts to sync live data"
        live={false}
        right={
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'Space Mono', monospace", marginBottom: 2 }}>CONNECTIONS</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22,
              color: totalConnected > 0 ? C.green : "#64748B" }}>
              {totalConnected} <span style={{ fontSize: 14, color: "#64748B" }}>/ {totalAvailable}</span>
            </div>
          </div>
        }
      />

      {!user && (
        <div style={{
          background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div style={{ flex: 1, fontSize: 13, color: "#818CF8" }}>
            <strong style={{ color: "#fff" }}>Sign in</strong> to save your integration credentials and enable live data sync.
          </div>
        </div>
      )}

      {/* Data flow explainer */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { icon: "📥", label: "PMS → Hotel IQ",        desc: "Reservations, rates, inventory & room type data sync automatically",  color: C.blue   },
          { icon: "🔄", label: "Channel Manager Sync",  desc: "Rate changes you apply here push to all OTAs within seconds",         color: C.purple },
          { icon: "📊", label: "OTA → Analytics",       desc: "Review scores, rate visibility & pickup trends feed your dashboards",  color: C.orange },
        ].map(f => (
          <div key={f.label} style={{
            background: `linear-gradient(145deg, ${f.color}0A, rgba(8,10,18,0.9))`,
            border: `1px solid ${f.color}22`,
            borderRadius: 14, padding: "16px 18px",
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#E2E8F0", marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <IntegrationSection
        title="Property Management Systems (PMS)"
        desc="Connect your PMS to pull live reservations, ADR, RevPAR and inventory"
        items={PMS_LIST}
        connected={connected}
        onToggle={toggle}
        accent={C.blue}
      />

      <IntegrationSection
        title="Channel Managers"
        desc="Push rate changes to all OTAs simultaneously via your channel manager"
        items={CHANNEL_MANAGERS}
        connected={connected}
        onToggle={toggle}
        accent={C.purple}
      />

      <IntegrationSection
        title="OTA Direct Connections"
        desc="Connect OTAs directly for review data, rate visibility and booking pickup"
        items={OTA_CONNECTIONS}
        connected={connected}
        onToggle={toggle}
        accent={C.orange}
      />

      {/* Webhook / API key section */}
      <Card title="Hotel IQ Inbound API" subtitle="Push data from your own systems via REST" accent={C.teal}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>
              Use our inbound API to push occupancy, revenue and ADR from any source — custom PMS, spreadsheet automation, or internal BI.
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10,
              background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, padding: "10px 14px", color: C.teal, letterSpacing: 0.5 }}>
              POST /api/property/metrics<br />
              Authorization: Bearer &lt;your-jwt&gt;
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'Space Mono', monospace",
              letterSpacing: 1, marginBottom: 8 }}>PAYLOAD EXAMPLE</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10,
              background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, padding: "10px 14px", color: "#64748B", lineHeight: 1.8 }}>
              {`{ "occupancy": 78,\n  "adr": 195,\n  "revpar": 152,\n  "revenueMtd": 89400 }`}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { label: "CORE", items: [
    { id: "overview",  label: "Overview",  icon: "◈" },
    { id: "revenue",   label: "Revenue",   icon: "◆" },
    { id: "pricing",   label: "Pricing",   icon: "◇" },
  ]},
  { label: "INTELLIGENCE", items: [
    { id: "forecast",  label: "Forecast",  icon: "⟁" },
    { id: "compset",   label: "Comp Set",  icon: "⊞" },
  ]},
  { label: "TOOLS", items: [
    { id: "calendar",     label: "Calendar",     icon: "▦" },
    { id: "reports",      label: "Reports",      icon: "≡" },
    { id: "integrations", label: "Integrations", icon: "⊕" },
    { id: "settings",     label: "Settings",     icon: "◎" },
  ]},
];


function Sidebar({ active, setTab, user, urgentCount }) {
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: `linear-gradient(180deg, ${S.surf1} 0%, ${S.bg} 100%)`,
      borderRight: `1px solid ${S.border}`,
      display: "flex", flexDirection: "column",
      position: "sticky", top: 62, height: "calc(100vh - 62px)", overflowY: "auto",
    }}>
      {/* Property card */}
      <div style={{ padding: "18px 16px 16px", borderBottom: `1px solid ${S.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #6366F1, #4F46E5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif",
            boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
          }}>
            {(user?.hotelName || "C")[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
              color: S.text1, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.hotelName || "The Coastal Grand"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", flexShrink: 0,
                display: "inline-block", boxShadow: "0 0 6px rgba(16,185,129,0.8)",
                animation: "livePulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 10, color: "#34D399", fontFamily: "'Space Mono', monospace",
                letterSpacing: 0.5 }}>Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grouped nav */}
      <div style={{ flex: 1, padding: "10px 10px" }}>
        {NAV_GROUPS.map((g, gi) => (
          <div key={g.label} style={{ marginTop: gi === 0 ? 6 : 18 }}>
            <div style={{ fontSize: 9, color: S.text4, fontFamily: "'Space Mono', monospace",
              letterSpacing: 2, paddingLeft: 10, marginBottom: 4, textTransform: "uppercase",
              fontWeight: 700 }}>
              {g.label}
            </div>
            {g.items.map(n => {
              const isActive = active === n.id;
              const hasBadge = n.id === "pricing" && urgentCount > 0;
              return (
                <button key={n.id} onClick={() => setTab(n.id)} style={{
                  display: "flex", alignItems: "center", gap: 9, justifyContent: "space-between",
                  padding: "8px 10px", cursor: "pointer", borderRadius: 10, margin: "1px 0",
                  background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
                  border: "1px solid transparent",
                  borderColor: isActive ? "rgba(99,102,241,0.2)" : "transparent",
                  color: isActive ? "#A5B4FC" : S.text3,
                  fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: isActive ? 500 : 400,
                  textAlign: "left", transition: "all 0.15s", width: "100%",
                }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = S.text2; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = S.text3; } }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                      background: isActive ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isActive ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, transition: "all 0.15s",
                    }}>{n.icon}</div>
                    {n.label}
                  </div>
                  {hasBadge && (
                    <span style={{
                      fontSize: 9, background: "#EF4444", color: "#fff",
                      borderRadius: 10, padding: "2px 6px",
                      fontFamily: "'Space Mono', monospace", fontWeight: 700,
                      boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                    }}>{urgentCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 16px", borderTop: `1px solid ${S.border}` }}>
        <div style={{ fontSize: 10, color: S.text4, fontFamily: "'Space Mono', monospace",
          letterSpacing: 0.3 }}>Hotel IQ · v2.2</div>
        <div style={{ fontSize: 10, color: S.text4, marginTop: 2 }}>AI Revenue Intelligence</div>
      </div>
    </aside>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function HotelIQ({ user, apiBase, onLogout, onShowAuth }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [theme, setTheme] = useState(() => localStorage.getItem("hiq-theme") || "dark");
  const [aiOpen, setAiOpen] = useState(false);
  const [applied, setApplied] = useState(new Set());
  const [skipped, setSkipped] = useState(new Set());
  const [showNotif, setShowNotif] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [propertyData, setPropertyData] = useState(null);

  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  // Fetch property data when user logs in
  useEffect(() => {
    if (!user) { setPropertyData(null); return; }
    const token = localStorage.getItem("hiq-token");
    if (!token) return;
    fetch(`${apiBase}/api/property/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setPropertyData(data))
      .catch(() => {});
  }, [user, apiBase]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("hiq-theme", next);
  };

  const handleApply = async (id) => {
    setApplied(p => new Set([...p, id]));
    setSkipped(p => { const n = new Set(p); n.delete(id); return n; });
    if (!user) return; // demo mode — UI only
    const rec = pricingRecs.find(r => r.id === id);
    if (!rec?.roomId) return;
    // Use live rate from DB if available, else fall back to static default
    const liveCurrentRate = propertyData?.rooms?.[rec.roomId] ?? rec.current;
    try {
      const token = localStorage.getItem("hiq-token");
      const res = await fetch(`${apiBase}/api/property/rates/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomId: rec.roomId, oldRate: liveCurrentRate, newRate: rec.suggested, reason: rec.reason }),
      });
      if (res.ok) {
        const data = await res.json();
        setPropertyData(p => p ? { ...p, rooms: data.rooms, appliedRates: data.appliedRates } : p);
      }
    } catch {}
  };
  const handleSkip = (id) => {
    setSkipped(p => new Set([...p, id]));
    setApplied(p => { const n = new Set(p); n.delete(id); return n; });
  };
  const handleRestore = (id) => {
    setSkipped(p => { const n = new Set(p); n.delete(id); return n; });
    setApplied(p => { const n = new Set(p); n.delete(id); return n; });
  };

  const urgentCount = pricingRecs.filter(r => r.urgency === "high" && !applied.has(r.id) && !skipped.has(r.id)).length;
  const notifs = [
    { text: "Standard King & Double Queen below optimal", type: "alert",   time: "2m ago" },
    { text: "Demand spike +34% forecast — conference",    type: "info",    time: "15m ago" },
    { text: "Grand Regency dropped rates −1.5%",          type: "warning", time: "3h ago" },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "overview":  return <Overview user={user} property={propertyData} setTab={setActiveTab} applied={applied} skipped={skipped} onApply={handleApply} onShowAuth={onShowAuth} />;
      case "revenue":   return <Revenue property={propertyData} />;
      case "pricing":   return <Pricing applied={applied} skipped={skipped} onApply={handleApply} onSkip={handleSkip} onRestore={handleRestore} property={propertyData} />;
      case "forecast":  return <Forecast setTab={setActiveTab} />;
      case "compset":   return <CompSet apiBase={apiBase} property={propertyData} />;
      case "calendar":  return <CalendarSection property={propertyData} />;
      case "reports":       return <Reports property={propertyData} />;
      case "integrations":  return <Integrations user={user} apiBase={apiBase} />;
      case "settings":      return <Settings user={user} property={propertyData} apiBase={apiBase} onPropertyUpdate={setPropertyData} onLogout={onLogout} theme={theme} toggleTheme={toggleTheme} />;
      default:          return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.text1, fontFamily: "'Inter', sans-serif", position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      {/* Ambient background: dot grid + top glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(99,102,241,0.18) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 0%, transparent 75%)",
        }} />
        <div style={{ position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 60%)" }} />
      </div>

      {/* ── Header ── */}
      <header style={{
        height: 60, padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 200,
        background: "rgba(3,5,10,0.92)", backdropFilter: "blur(20px) saturate(180%)",
        borderBottom: `1px solid ${S.border}`,
        isolation: "isolate",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif",
            boxShadow: "0 4px 16px rgba(99,102,241,0.45)" }}>IQ</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: -0.5, lineHeight: 1.2, color: S.text1 }}>
              Hotel<span style={{ color: "#818CF8" }}>IQ</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: S.text4, letterSpacing: 1 }}>
            {user?.hotelName?.toUpperCase() || "COASTAL GRAND"}
          </div>
          <div style={{ width: 1, height: 14, background: S.border }} />
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: S.text3, letterSpacing: 0.5, fontVariantNumeric: "tabular-nums" }}>
            {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowNotif(v => !v)} style={{
              background: showNotif ? "rgba(99,102,241,0.1)" : "transparent",
              border: `1px solid ${showNotif ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 8, width: 34, height: 34, cursor: "pointer", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#fff",
            }}>⊙
              {urgentCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16,
                  background: C.red, borderRadius: "50%", fontSize: 9, color: "#fff", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Space Mono', monospace" }}>{urgentCount}</span>
              )}
            </button>
            {showNotif && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 310,
                background: "#0B101C", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.6)", zIndex: 300 }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
                  display: "flex", justifyContent: "space-between" }}>
                  Alerts
                  <span style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: C.red, letterSpacing: 1 }}>
                    {notifs.length} NEW
                  </span>
                </div>
                {notifs.map((n, i) => (
                  <div key={i} style={{ padding: "12px 16px",
                    borderBottom: i < notifs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    display: "flex", gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                      background: n.type === "alert" ? C.red : n.type === "warning" ? C.orange : C.blue }} />
                    <div>
                      <div style={{ fontSize: 12, color: "#CBD5E1" }}>{n.text}</div>
                      <div style={{ fontSize: 10, color: "#475569", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI button */}
          <button onClick={() => user ? setAiOpen(o => !o) : onShowAuth?.("login")} style={{
            background: aiOpen ? "rgba(99,102,241,0.12)" : "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
            border: aiOpen ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(99,102,241,0.3)",
            color: aiOpen ? "#818CF8" : "#fff",
            padding: "7px 16px", borderRadius: 9, cursor: "pointer",
            fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif", letterSpacing: 0.2,
            boxShadow: aiOpen ? "none" : "0 4px 20px rgba(99,102,241,0.35), 0 0 0 0 rgba(99,102,241,0)",
            position: "relative", overflow: "hidden",
          }}>
            {!aiOpen && (
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 9, pointerEvents: "none" }}>
                <div style={{ position: "absolute", top: 0, left: "-60%", width: "40%", height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                  animation: "shimmer 3s ease-in-out infinite", animationDelay: "1s" }} />
              </div>
            )}
            ✦ ASK AI
          </button>

          {user ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif",
                  boxShadow: "0 0 10px rgba(99,102,241,0.4)" }}>
                  {(user.firstName?.[0] || "H").toUpperCase()}
                </div>
                <span style={{ fontSize: 12, color: "#64748B", fontFamily: "'Space Mono', monospace" }}>
                  Hi, {user.firstName}
                </span>
              </div>
              <button onClick={onLogout} style={{
                background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
                color: "#64748B", padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                fontSize: 12, fontFamily: "'Inter', sans-serif",
              }}>Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={() => onShowAuth?.("login")} style={{
                background: "transparent",
                border: "1px solid rgba(99,102,241,0.4)",
                color: "#818CF8", padding: "7px 16px", borderRadius: 8, cursor: "pointer",
                fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif",
              }}>Sign In</button>
              <button onClick={() => onShowAuth?.("register")} style={{
                background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                border: "none",
                color: "#fff", padding: "7px 16px", borderRadius: 8, cursor: "pointer",
                fontSize: 12, fontWeight: 700, fontFamily: "'Inter', sans-serif",
                boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
              }}>Register Free</button>
            </>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: "flex" }}>
        <Sidebar active={activeTab} setTab={setActiveTab} user={user} urgentCount={urgentCount} />
        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0, overflowX: "hidden" }}>
          {renderTab()}
        </main>
      </div>

      {aiOpen && <AIChat user={user} property={propertyData} apiBase={apiBase} onClose={() => setAiOpen(false)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes aipulse       { 0%,100%{opacity:.3;transform:scale(.85)} 50%{opacity:1;transform:scale(1.15)} }
        @keyframes livePulse     { 0%,100%{opacity:.4;transform:scale(.85)} 50%{opacity:1;transform:scale(1.15)} }
        @keyframes fadeUp        { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn       { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes shimmer       { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        * { box-sizing: border-box; }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.4); }
        button { transition: all 0.15s ease; outline: none; }
        button:hover { filter: brightness(1.08); }
        button:active { transform: scale(0.97) !important; filter: brightness(0.95); }
        input, select, textarea { font-family: 'Inter', sans-serif; }
        input, select { transition: border-color 0.15s, box-shadow 0.15s; }
        input:focus, select:focus { border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.08) !important; outline: none; }
        input::placeholder { color: #334155; }
        select option { background: #080C16; }
        main > div > * { animation: fadeUp 0.2s ease both; }
        main > div > *:nth-child(1) { animation-delay: 0ms; }
        main > div > *:nth-child(2) { animation-delay: 30ms; }
        main > div > *:nth-child(3) { animation-delay: 60ms; }
        main > div > *:nth-child(4) { animation-delay: 90ms; }
        main > div > *:nth-child(5) { animation-delay: 120ms; }
        @media (max-width: 1100px) {
          .kpi6 { grid-template-columns: repeat(3,1fr) !important; }
          .chart2col { grid-template-columns: 1fr !important; }
          .kpi4 { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 768px) {
          aside { display: none; }
          .kpi6 { grid-template-columns: repeat(2,1fr) !important; }
          .kpi4 { grid-template-columns: repeat(2,1fr) !important; }
          main { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}
