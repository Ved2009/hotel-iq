import { useState, useEffect, useRef, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  gold:   "#C9A55A",  // muted gold — revenue metrics
  blue:   "#4B8EF5",  // primary action
  green:  "#22C55E",  // positive/success
  red:    "#EF4444",  // negative/alert
  amber:  "#F59E0B",  // warning
  purple: "#8B5CF6",  // secondary metric
  teal:   "#14B8A6",  // tertiary
  orange: "#F59E0B",  // alias for amber (used in some gradients)
  pink:   "#EC4899",  // GOPPAR accent
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

const weeklyRevpar = DAYS_SHORT.map((d, i) => ({
  day: d,
  revpar: Math.round(110 + rng(i) * 90 + (i >= 4 ? 40 : 0)),
  adr:    Math.round(170 + rng(i + 7) * 60 + (i >= 4 ? 30 : 0)),
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
  { id: 1, room: "Standard King",    current: 159, suggested: 179, reason: "High demand — comp supply low",    impact: 2400,  urgency: "high",   minStay: 2 },
  { id: 2, room: "Ocean View Suite", current: 289, suggested: 269, reason: "3 comps dropped rates below",      impact: -800,  urgency: "medium", minStay: null },
  { id: 3, room: "Double Queen",     current: 139, suggested: 155, reason: "Weekend demand spike forecast",    impact: 1100,  urgency: "high",   minStay: 2 },
  { id: 4, room: "Executive Floor",  current: 349, suggested: 349, reason: "Rate is optimal — hold position",  impact: 0,     urgency: "low",    minStay: null },
  { id: 5, room: "Junior Suite",     current: 229, suggested: 249, reason: "Conference demand surge",          impact: 880,   urgency: "high",   minStay: 3 },
];

const activityLog = [
  { time: "2m ago",  type: "alert",    icon: "⚡", text: "Demand spike detected: +34% this weekend" },
  { time: "18m ago", type: "positive", icon: "↑",  text: "Occupancy hit 78% — 4-week high" },
  { time: "1h ago",  type: "success",  icon: "✓",  text: "Price applied: Penthouse Suite → $420" },
  { time: "3h ago",  type: "warning",  icon: "↓",  text: "Grand Regency dropped rates −1.5%" },
  { time: "5h ago",  type: "info",     icon: "★",  text: "New 5-star review on Booking.com" },
  { time: "8h ago",  type: "alert",    icon: "⚡", text: "Fresh 14-day demand forecast generated" },
];

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

// ── Reusable Components ────────────────────────────────────────────────────────
const Card = ({ title, subtitle, action, children, style = {} }) => (
  <div style={{
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "20px 22px", ...style,
  }}>
    {(title || action) && (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          {title && <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 11, color: "#555", marginTop: 3 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

const KPI = ({ label, value, sub, delta, accent, icon }) => (
  <div style={{
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, right: 0, width: 70, height: 70,
      background: `radial-gradient(circle at top right, ${accent}30, transparent)`,
    }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: 2,
        textTransform: "uppercase", color: "#555" }}>{label}</span>
      <span style={{ fontSize: 16, opacity: 0.45 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 30, fontWeight: 800, fontFamily: "'Syne', sans-serif",
      color: "#fff", lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{sub}</div>}
    {delta !== undefined && (
      <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace",
        color: delta >= 0 ? C.green : C.red }}>
        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs last month
      </div>
    )}
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
    <div style={{ background: "#0D0D10", border: "1px solid #1E1E24", borderRadius: 10,
      padding: "10px 14px", fontSize: 11, fontFamily: "'Space Mono', monospace",
      boxShadow: "0 8px 32px rgba(0,0,0,0.7)" }}>
      <div style={{ color: "#555", marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{
            p.value > 999 ? `$${p.value.toLocaleString()}` :
            ["occupancy","demand","lastYear"].includes(p.dataKey) ? `${p.value}%` : p.value
          }</strong>
        </div>
      ))}
    </div>
  );
};

const SectionHead = ({ title, sub, right }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 26 }}>
    <div>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800,
        margin: 0, letterSpacing: -0.5, color: "#fff" }}>{title}</h1>
      {sub && <p style={{ color: "#555", margin: "5px 0 0", fontSize: 13 }}>{sub}</p>}
    </div>
    {right}
  </div>
);

// ── Section: Overview ─────────────────────────────────────────────────────────
function Overview({ user, setTab, applied, skipped, onApply }) {
  const urgent = pricingRecs.filter(r => r.urgency === "high" && !applied.has(r.id) && !skipped.has(r.id));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHead
        title="Revenue Overview"
        sub={`${user?.hotelName || "The Coastal Grand"} · Live · Updated just now`}
        right={<span style={{ fontSize: 12, color: "#444", fontFamily: "'Space Mono', monospace" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>}
      />

      <div className="kpi6" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
        <KPI icon="🏨" label="Occupancy"    value="73%"    sub="214 / 292 rooms"    delta={4.2}  accent={C.gold} />
        <KPI icon="📈" label="RevPAR"       value="$142"   sub="vs $131 last mo."   delta={7.8}  accent={C.orange} />
        <KPI icon="💰" label="ADR"          value="$195"   sub="Avg daily rate"     delta={2.1}  accent={C.blue} />
        <KPI icon="🏷️"  label="TRevPAR"    value="$168"   sub="Total rev / room"   delta={5.4}  accent={C.purple} />
        <KPI icon="📊" label="Revenue MTD"  value="$89.4K" sub="Month to date"      delta={11.3} accent={C.green} />
        <KPI icon="✨" label="GOPPAR"       value="$89"    sub="Gross op. profit"   delta={3.1}  accent={C.pink} />
      </div>

      <div className="chart2col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card title="12-Month Occupancy" subtitle="This year vs last year">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gOcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.gold} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A20" />
              <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} domain={[30,100]} tickFormatter={v=>`${v}%`} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="occupancy" stroke={C.gold} strokeWidth={2} fill="url(#gOcc)" name="This Year" />
              <Area type="monotone" dataKey="lastYear" stroke="#333" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" name="Last Year" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#555" }}>
            <span><span style={{ color: C.gold }}>—</span> This Year</span>
            <span><span style={{ color: "#444" }}>- -</span> Last Year</span>
          </div>
        </Card>

        <Card title="This Week Revenue" subtitle="Gold = weekend">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyRevenue} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A20" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="revenue" radius={[5,5,0,0]} name="Revenue">
                {weeklyRevenue.map((_, i) => <Cell key={i} fill={i >= 4 ? C.gold : "#202024"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="chart2col" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(232,197,71,0.08), rgba(249,115,22,0.06))",
          border: "1px solid rgba(232,197,71,0.18)", borderRadius: 14, padding: "20px 24px",
        }}>
          <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
            <span style={{ fontSize: 24 }}>✦</span>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: C.gold, marginBottom: 6 }}>AI Revenue Insight</div>
              <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.8 }}>
                Demand spike forecasted <strong style={{ color: "#fff" }}>+34%</strong> this weekend — regional tech conference in town.
                Standard King & Double Queen rates are <strong style={{ color: C.orange }}>$16–20 below optimal</strong>.
                Applying open recommendations could generate <strong style={{ color: C.green }}>$4,380</strong> additional revenue.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setTab("pricing")} style={{
              background: "rgba(232,197,71,0.12)", border: "1px solid rgba(232,197,71,0.3)",
              color: C.gold, padding: "8px 16px", borderRadius: 8, cursor: "pointer",
              fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700,
            }}>REVIEW PRICING →</button>
            <button onClick={() => setTab("forecast")} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
              color: "#555", padding: "8px 16px", borderRadius: 8, cursor: "pointer",
              fontSize: 11, fontFamily: "'Space Mono', monospace",
            }}>VIEW FORECAST</button>
          </div>
        </div>

        <Card title="Quick Actions" subtitle={urgent.length > 0 ? `${urgent.length} urgent recs open` : "All clear"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {urgent.slice(0, 3).map(r => (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(232,197,71,0.05)", border: "1px solid rgba(232,197,71,0.12)",
                borderRadius: 8, padding: "10px 12px",
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{r.room}</div>
                  <div style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono', monospace" }}>
                    ${r.current} → <span style={{ color: C.gold }}>${r.suggested}</span>
                    {" · "}<span style={{ color: C.green }}>+${r.impact.toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => onApply(r.id)} style={{
                  background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, border: "none",
                  color: "#000", padding: "5px 12px", borderRadius: 6, cursor: "pointer",
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
                  <div style={{ fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>{a.text}</div>
                  <div style={{ fontSize: 10, color: "#444", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>{a.time}</div>
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
function Revenue() {
  const channelColors = { "Direct": C.gold, "Booking.com": C.blue, "Expedia": C.purple, "Phone/Email": C.green };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHead title="Revenue Analysis" sub="Breakdown by segment, channel & performance metrics" />
      <div className="kpi4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KPI icon="💵" label="Room Revenue"    value="$89.4K" sub="Month to date"   delta={11.3} accent={C.gold} />
        <KPI icon="🍽️"  label="F&B Revenue"   value="$18.2K" sub="Month to date"   delta={6.4}  accent={C.orange} />
        <KPI icon="💆" label="Spa & Ancillary" value="$7.8K"  sub="Month to date"   delta={14.2} accent={C.blue} />
        <KPI icon="📉" label="Gross Profit"    value="$47.3K" sub="44.7% GOP margin" delta={8.1} accent={C.green} />
      </div>

      <div className="chart2col" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        <Card title="Revenue by Channel" subtitle="Last 6 months — stacked">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={channelData} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A20" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<Tip />} />
              {Object.entries(channelColors).map(([key, color]) => (
                <Bar key={key} dataKey={key} stackId="ch" fill={color} name={key} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            {Object.entries(channelColors).map(([k, c]) => (
              <span key={k} style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 6 }}>
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
                  <span style={{ fontSize: 12, color: "#aaa" }}>{s.name}</span>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A20" />
            <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} />
            <Tooltip content={<Tip />} />
            <Line type="monotone" dataKey="adr"    stroke={C.gold}  strokeWidth={2.5} dot={false} name="ADR" />
            <Line type="monotone" dataKey="revpar" stroke={C.blue}  strokeWidth={2.5} dot={false} name="RevPAR" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#555" }}>
          <span><span style={{ color: C.gold }}>—</span> ADR</span>
          <span><span style={{ color: C.blue }}>—</span> RevPAR</span>
        </div>
      </Card>
    </div>
  );
}

// ── Section: Pricing ──────────────────────────────────────────────────────────
function Pricing({ applied, skipped, onApply, onSkip, onRestore }) {
  const pending = pricingRecs.filter(r => !applied.has(r.id) && !skipped.has(r.id) && r.impact > 0);
  const totalPending = pending.reduce((s, r) => s + r.impact, 0);
  const totalApplied = pricingRecs.filter(r => applied.has(r.id) && r.impact > 0).reduce((s, r) => s + r.impact, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHead
        title="Dynamic Pricing"
        sub="AI-generated recommendations based on demand, comp set & 90-day history"
        right={totalPending > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 3 }}>PENDING OPPORTUNITY</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: C.green }}>+${totalPending.toLocaleString()}</div>
          </div>
        )}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pricingRecs.map(r => {
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
                <div style={{ fontSize: 12, color: "#555" }}>{r.reason}</div>
                {r.minStay && <div style={{ fontSize: 10, color: C.blue, fontFamily: "'Space Mono', monospace",
                  marginTop: 4 }}>MIN STAY {r.minStay}N RECOMMENDED</div>}
                {isApplied && <div style={{ fontSize: 10, color: C.green, fontFamily: "'Space Mono', monospace", marginTop: 4 }}>✓ RATE UPDATED</div>}
              </div>
              <div style={{ textAlign: "center", minWidth: 70 }}>
                <div style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 4, letterSpacing: 1 }}>CURRENT</div>
                <div style={{ fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#fff" }}>${r.current}</div>
              </div>
              <div style={{ color: "#2A2A2A", fontSize: 20, fontWeight: 200 }}>→</div>
              <div style={{ textAlign: "center", minWidth: 70 }}>
                <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", marginBottom: 4, letterSpacing: 1,
                  color: isApplied ? C.green : C.gold }}>
                  {isApplied ? "APPLIED" : "SUGGESTED"}
                </div>
                <div style={{ fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 800,
                  color: isApplied ? C.green : C.gold }}>${r.suggested}</div>
              </div>
              <div style={{ textAlign: "center", minWidth: 70 }}>
                <div style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 4, letterSpacing: 1 }}>IMPACT</div>
                <div style={{ fontSize: 15, fontWeight: 700,
                  color: r.impact > 0 ? C.green : r.impact < 0 ? C.red : "#555" }}>
                  {r.impact > 0 ? `+$${r.impact.toLocaleString()}` : r.impact < 0 ? `-$${Math.abs(r.impact)}` : "—"}
                </div>
              </div>
              <Badge urgency={r.urgency} />
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {!isApplied && !isSkipped && r.urgency !== "low" && (
                  <button onClick={() => onApply(r.id)} style={{
                    background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, border: "none",
                    color: "#000", padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                    fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono', monospace",
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
                  color: "#555", padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                  fontSize: 11, fontFamily: "'Space Mono', monospace",
                }}>{isSkipped ? "RESTORE" : "SKIP"}</button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {totalPending > 0 && (
          <div style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)",
            borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: C.green, fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>REMAINING OPPORTUNITY</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: C.green }}>+${totalPending.toLocaleString()}</div>
              <div style={{ color: "#555", fontSize: 12 }}>from {pending.length} open recommendation{pending.length !== 1 ? "s" : ""}</div>
            </div>
            <button onClick={() => pending.forEach(r => onApply(r.id))} style={{
              marginLeft: "auto", background: "rgba(74,222,128,0.14)", border: "1px solid rgba(74,222,128,0.35)",
              color: C.green, padding: "10px 20px", borderRadius: 8, cursor: "pointer",
              fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700, whiteSpace: "nowrap",
            }}>APPLY ALL</button>
          </div>
        )}
        {totalApplied > 0 && (
          <div style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.2)",
            borderRadius: 14, padding: "16px 22px" }}>
            <div style={{ fontSize: 10, color: C.blue, fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>APPLIED REVENUE GAIN</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: C.blue }}>+${totalApplied.toLocaleString()}</div>
            <div style={{ color: "#555", fontSize: 12 }}>from {applied.size} applied recommendation{applied.size !== 1 ? "s" : ""}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section: Forecast ─────────────────────────────────────────────────────────
function Forecast({ setTab }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHead title="Demand Forecast" sub="14-day AI prediction · 90-day training window · 94% historical accuracy" />

      <div className="kpi4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KPI icon="📅" label="7-Day Avg Demand" value="81%"    sub="High demand period"    delta={12}   accent={C.blue} />
        <KPI icon="🎯" label="Forecast Accuracy" value="94.2%" sub="Last 90 days"           delta={1.1}  accent={C.green} />
        <KPI icon="💵" label="Projected Revenue" value="$41.2K" sub="Next 7 days"           delta={18.4} accent={C.gold} />
        <KPI icon="📍" label="Events Detected"   value="2"     sub="Conference + weekend"   delta={0}    accent={C.purple} />
      </div>

      <div style={{ background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.2)",
        borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 20 }}>📍</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: C.blue, marginBottom: 2 }}>
            Event Detected — Regional Tech Conference (Days 6–8)
          </div>
          <div style={{ fontSize: 12, color: "#555" }}>
            Expected +34% demand spike · Raise rates 12–18% · Consider 3-night minimum stay restriction
          </div>
        </div>
        <button onClick={() => setTab("pricing")} style={{
          marginLeft: "auto", whiteSpace: "nowrap", background: "rgba(96,165,250,0.12)",
          border: "1px solid rgba(96,165,250,0.3)", color: C.blue, padding: "8px 16px",
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
            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A20" />
            <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0,100]} tickFormatter={v=>`${v}%`} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="demand" stroke={C.blue} strokeWidth={2.5} fill="url(#gDemand)" name="demand" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="chart2col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card title="Booking Pickup" subtitle="New bookings made per day (last 7 days)">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pickupData} barSize={18} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A20" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="bookings"      fill={C.green}  radius={[4,4,0,0]} name="Bookings" />
              <Bar dataKey="cancellations" fill={C.red}    radius={[4,4,0,0]} name="Cancellations" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#555" }}>
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
                  background: isEvent ? "rgba(96,165,250,0.08)" : isHigh ? "rgba(232,197,71,0.08)" : "rgba(255,255,255,0.03)",
                  border: isEvent ? "1px solid rgba(96,165,250,0.3)" : isHigh ? "1px solid rgba(232,197,71,0.3)" : "1px solid transparent",
                  borderRadius: 10, padding: "10px 6px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 9, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 6 }}>{d.date}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif",
                    color: isEvent ? C.blue : isHigh ? C.gold : "#aaa" }}>{d.demand}%</div>
                  {d.event && <div style={{ fontSize: 7, color: isEvent ? C.blue : C.gold,
                    fontFamily: "'Space Mono', monospace", marginTop: 4 }}>{d.event.toUpperCase()}</div>}
                  <div style={{ fontSize: 8, color: "#444", marginTop: 4, fontFamily: "'Space Mono', monospace" }}>
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
function CompSet() {
  const sorted = [...competitors].sort((a, b) => b.rate - a.rate);
  const myIdx = sorted.findIndex(c => c.name === "Your Hotel");
  const avgComp = Math.round(
    competitors.filter(c => c.name !== "Your Hotel").reduce((s, c) => s + c.rate, 0) /
    (competitors.length - 1)
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHead title="Comp Set" sub="Live rate comparison · Refreshed 12 min ago" />

      <div className="kpi4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KPI icon="🏆" label="Market Position" value={`#${myIdx + 1}`} sub={`of ${competitors.length} properties`} accent={C.gold} />
        <KPI icon="💰" label="Your Rate"       value="$189"  sub={`vs $${avgComp} avg comp`}  delta={189 > avgComp ? 1 : -1} accent={C.blue} />
        <KPI icon="🎯" label="AI Target Rate"  value="$195"  sub="+$6 from current · optimal"  accent={C.green} />
        <KPI icon="⭐" label="Review Score"    value="4.4"   sub="Booking.com avg"              accent={C.purple} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((c, i) => {
          const isYou = c.name === "Your Hotel";
          return (
            <div key={i} style={{
              background: isYou ? "rgba(232,197,71,0.05)" : "rgba(255,255,255,0.03)",
              border: isYou ? "1px solid rgba(232,197,71,0.22)" : "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 18,
            }}>
              <div style={{ width: 24, fontFamily: "'Space Mono', monospace", fontSize: 12,
                color: i === 0 ? C.gold : "#444", fontWeight: 700, textAlign: "center" }}>#{i + 1}</div>
              <div style={{ flex: 2 }}>
                <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  {c.name}
                  {isYou && <span style={{ fontSize: 9, background: "rgba(232,197,71,0.18)", color: C.gold,
                    padding: "2px 7px", borderRadius: 4, fontFamily: "'Space Mono', monospace" }}>YOU</span>}
                </div>
                <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
                  {"★".repeat(c.stars)}{"☆".repeat(5 - c.stars)} · {c.score} score
                </div>
              </div>
              <div style={{ textAlign: "center", minWidth: 80 }}>
                <div style={{ fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 800,
                  color: isYou ? C.gold : "#fff" }}>${c.rate}</div>
                <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace",
                  color: c.change > 0 ? C.green : c.change < 0 ? C.red : "#444" }}>
                  {c.change > 0 ? `▲ ${c.change}%` : c.change < 0 ? `▼ ${Math.abs(c.change)}%` : "— unchanged"}
                </div>
              </div>
              {isYou && c.target && (
                <div style={{ textAlign: "center", background: "rgba(232,197,71,0.07)",
                  border: "1px solid rgba(232,197,71,0.18)", borderRadius: 10, padding: "10px 16px" }}>
                  <div style={{ fontSize: 9, color: C.gold, fontFamily: "'Space Mono', monospace", marginBottom: 3 }}>AI TARGET</div>
                  <div style={{ fontSize: 20, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: C.gold }}>${c.target}</div>
                </div>
              )}
              <div style={{ flex: 2 }}>
                <div style={{ height: 5, background: "#1A1A20", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    background: isYou ? `linear-gradient(90deg, ${C.gold}, ${C.orange})` : "#2A2A30",
                    width: `${((c.rate - 130) / 120) * 100}%`, transition: "width 1s",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4,
                  fontSize: 9, color: "#2A2A30", fontFamily: "'Space Mono', monospace" }}>
                  <span>$130</span><span>$250</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Card title="Rate Trend — Last 7 Days" subtitle="Your hotel vs top competitors">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rateHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A20" />
            <XAxis dataKey="day" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} domain={[140, 260]} tickFormatter={v=>`$${v}`} />
            <Tooltip content={<Tip />} />
            <Line type="monotone" dataKey="Your Hotel"    stroke={C.gold}   strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Grand Regency" stroke={C.blue}   strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="The Meridian"  stroke={C.purple} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="Blue Harbor"   stroke={C.orange} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#555" }}>
          {[["Your Hotel", C.gold], ["Grand Regency", C.blue], ["The Meridian", C.purple], ["Blue Harbor", C.orange]].map(([n, c]) => (
            <span key={n}><span style={{ color: c }}>—</span> {n}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Section: Calendar ─────────────────────────────────────────────────────────
function CalendarSection() {
  const { offset, days } = useMemo(generateCalendar, []);
  const now = new Date();
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const occColor = (occ) =>
    occ >= 90 ? C.red : occ >= 80 ? C.orange : occ >= 65 ? C.gold : occ >= 50 ? C.green : "#2A2A30";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHead title="Revenue Calendar" sub={`${monthName} · Daily occupancy, ADR & revenue`} />

      <div className="kpi4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KPI icon="📊" label="Avg Occupancy MTD" value="73%"   sub="vs 69% last month" delta={4.2} accent={C.gold} />
        <KPI icon="💵" label="Avg ADR MTD"       value="$195"  sub="vs $191 last month" delta={2.1} accent={C.blue} />
        <KPI icon="📈" label="Best Day"          value="$14.2K" sub="Revenue single day" accent={C.green} />
        <KPI icon="📉" label="Lowest Occ Day"    value="51%"    sub="Opportunity exists"  accent={C.red} />
      </div>

      <Card title={`${monthName} — Occupancy Heatmap`} subtitle="Click a day to see details">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 8 }}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#444",
              fontFamily: "'Space Mono', monospace", paddingBottom: 6 }}>{d}</div>
          ))}
          {Array.from({ length: offset }, (_, i) => <div key={`e${i}`} />)}
          {days.map((d) => (
            <div key={d.day} style={{
              background: d.isToday ? "rgba(232,197,71,0.15)" : `${occColor(d.occupancy)}18`,
              border: d.isToday ? `2px solid ${C.gold}` : `1px solid ${occColor(d.occupancy)}40`,
              borderRadius: 10, padding: "8px 6px", textAlign: "center", cursor: "default",
              transition: "transform 0.15s",
            }}>
              <div style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>
                {d.day}{d.isToday ? " ●" : ""}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Syne', sans-serif",
                color: occColor(d.occupancy) }}>{d.occupancy}%</div>
              <div style={{ fontSize: 9, color: "#444", fontFamily: "'Space Mono', monospace", marginTop: 3 }}>
                ${d.adr}
              </div>
              <div style={{ fontSize: 8, color: "#333", fontFamily: "'Space Mono', monospace" }}>
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
function Reports() {
  const [downloading, setDownloading] = useState(null);
  const simulateDownload = (name) => {
    setDownloading(name);
    setTimeout(() => setDownloading(null), 1800);
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
              background: r.status === "Ready" ? "rgba(74,222,128,0.1)" : "rgba(232,197,71,0.1)",
              color: r.status === "Ready" ? C.green : C.gold,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 3 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "#555" }}>{r.desc}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace",
                  color: C.blue, background: "rgba(96,165,250,0.1)", padding: "2px 8px", borderRadius: 4 }}>
                  {r.freq}
                </span>
                <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace",
                  color: r.status === "Ready" ? C.green : C.gold,
                  background: r.status === "Ready" ? "rgba(74,222,128,0.1)" : "rgba(232,197,71,0.1)",
                  padding: "2px 8px", borderRadius: 4 }}>
                  {r.status}
                </span>
              </div>
            </div>
            <button
              onClick={() => r.status === "Ready" && simulateDownload(r.name)}
              disabled={r.status !== "Ready"}
              style={{
                background: downloading === r.name ? "rgba(74,222,128,0.15)" :
                  r.status === "Ready" ? "rgba(232,197,71,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${downloading === r.name ? "rgba(74,222,128,0.3)" :
                  r.status === "Ready" ? "rgba(232,197,71,0.25)" : "rgba(255,255,255,0.06)"}`,
                color: downloading === r.name ? C.green : r.status === "Ready" ? C.gold : "#444",
                padding: "8px 16px", borderRadius: 8, cursor: r.status === "Ready" ? "pointer" : "not-allowed",
                fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700, whiteSpace: "nowrap",
              }}>
              {downloading === r.name ? "↓ SAVING..." : r.status === "Ready" ? "↓ DOWNLOAD" : "PENDING"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section: Settings ─────────────────────────────────────────────────────────
function Settings({ user, onLogout, theme, toggleTheme }) {
  const isDark = theme === "dark";
  const notifItems = [
    { label: "Pricing recommendations", desc: "Alert when AI detects a rate opportunity", on: true },
    { label: "Demand spike alerts",      desc: "Notify when forecast demand rises sharply", on: true },
    { label: "Competitor rate changes",  desc: "Alert when comp set moves rates significantly", on: true },
    { label: "Weekly digest email",      desc: "Performance summary every Monday morning", on: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHead title="Settings" sub="Manage your account, property and preferences" />

      <Card title="Account">
        <div style={{ display: "flex", gap: 22 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 800, color: "#000", fontFamily: "'Syne', sans-serif",
          }}>{(user?.firstName?.[0] || "H").toUpperCase()}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1 }}>
            {[
              ["Name",         `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "—"],
              ["Hotel",        user?.hotelName || "—"],
              ["Email",        user?.email || "—"],
              ["Member Since", user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "#444", fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 14, color: "#ddd", fontWeight: 500 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Property Details">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[["Total Rooms","292"],["Room Types","5"],["Star Rating","4 ★"],["Comp Set Size","5 hotels"]].map(([l,v]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "14px 16px",
              border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 10, color: "#444", fontFamily: "'Space Mono', monospace",
                letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{l}</div>
              <div style={{ fontSize: 20, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#fff" }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Notification Preferences">
        {notifItems.map((item, i) => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 0",
            borderBottom: i < notifItems.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#ddd" }}>{item.label}</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{item.desc}</div>
            </div>
            <div style={{ width: 40, height: 22, borderRadius: 11, background: item.on ? C.gold : "#1A1A20",
              position: "relative", cursor: "pointer", flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3, left: item.on ? 21 : 3, transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
            </div>
          </div>
        ))}
      </Card>

      <Card title="Appearance">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#ddd" }}>Theme</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
              Currently: <strong style={{ color: "#ddd" }}>{isDark ? "Dark mode" : "Light mode"}</strong>
            </div>
          </div>
          <button onClick={toggleTheme} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
            color: "#ddd", padding: "9px 20px", borderRadius: 8, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          }}>{isDark ? "☀ Light Mode" : "☾ Dark Mode"}</button>
        </div>
      </Card>

      <div style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 14, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.red }}>Sign Out</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>End your current session</div>
          </div>
          <button onClick={onLogout} style={{
            background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
            color: C.red, padding: "9px 20px", borderRadius: 8, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
          }}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

// ── AI Chat Panel ─────────────────────────────────────────────────────────────
function AIChat({ user, apiBase, onClose }) {
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
      const context = `You are Hotel IQ, an expert hotel revenue management AI analyst.
Hotel: ${user?.hotelName || "The Coastal Grand"} | Manager: ${user?.firstName || ""}
Metrics: Occupancy 73%, RevPAR $142, ADR $195, TRevPAR $168, GOPPAR $89, Revenue MTD $89.4K.
Comp set: Grand Regency $210, The Meridian $220, Harbor View $195, Blue Harbor $175, Coastal Suites $165.
Open recs: Standard King $159→$179 (+$2,400), Double Queen $139→$155 (+$1,100), Junior Suite $229→$249 (+$880).
Weekend demand spike +34% (conference). Forecast accuracy 94.2%.
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
      background: "#080D18", border: "1px solid rgba(75,142,245,0.2)",
      borderRadius: 20, display: "flex", flexDirection: "column",
      boxShadow: "0 32px 80px rgba(0,0,0,0.85)", zIndex: 300, overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(75,142,245,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }}>AI Revenue Analyst</div>
            <div style={{ fontSize: 9, color: "#444", fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>POWERED BY GEMINI</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 7, width: 28, height: 28, color: "#555", cursor: "pointer", fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
            {m.role === "assistant" && (
              <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 2,
                background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#000" }}>✦</div>
            )}
            <div style={{
              maxWidth: "82%", padding: "10px 14px", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap",
              background: m.role === "user" ? "rgba(232,197,71,0.1)" : "rgba(255,255,255,0.04)",
              border: m.role === "user" ? "1px solid rgba(232,197,71,0.22)" : "1px solid rgba(255,255,255,0.06)",
              borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              color: m.role === "user" ? C.gold : "#ccc",
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#000" }}>✦</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold,
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
            fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
        <button onClick={send} disabled={loading} style={{
          background: loading ? "rgba(232,197,71,0.3)" : `linear-gradient(135deg, ${C.gold}, ${C.orange})`,
          border: "none", borderRadius: 10, padding: "10px 16px",
          cursor: loading ? "not-allowed" : "pointer", color: "#000", fontWeight: 700, fontSize: 16, minWidth: 44,
        }}>→</button>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV = [
  { id: "overview",    label: "Overview",   icon: "▦" },
  { id: "revenue",     label: "Revenue",    icon: "💰" },
  { id: "pricing",     label: "Pricing",    icon: "🏷️" },
  { id: "forecast",    label: "Forecast",   icon: "📈" },
  { id: "compset",     label: "Comp Set",   icon: "🏨" },
  { id: "calendar",    label: "Calendar",   icon: "📅" },
  { id: "reports",     label: "Reports",    icon: "📄" },
  { id: "settings",    label: "Settings",   icon: "⚙️" },
];

function Sidebar({ active, setTab }) {
  return (
    <aside style={{
      width: 210, flexShrink: 0, background: "#080D18",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", padding: "20px 0",
      position: "sticky", top: 62, height: "calc(100vh - 62px)", overflowY: "auto",
    }}>
      {NAV.map(n => {
        const isActive = active === n.id;
        return (
          <button key={n.id} onClick={() => setTab(n.id)} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 20px", cursor: "pointer",
            background: isActive ? "rgba(75,142,245,0.1)" : "transparent",
            border: "none",
            borderLeft: isActive ? `3px solid ${C.blue}` : "3px solid transparent",
            color: isActive ? "#E2E8F0" : "#4B5563",
            fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: isActive ? 600 : 400,
            textAlign: "left", transition: "all 0.15s", width: "100%",
          }}>
            <span style={{ fontSize: 15, opacity: isActive ? 1 : 0.7 }}>{n.icon}</span>
            {n.label}
          </button>
        );
      })}
    </aside>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function HotelIQ({ user, apiBase, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [theme, setTheme] = useState(() => localStorage.getItem("hiq-theme") || "dark");
  const [aiOpen, setAiOpen] = useState(false);
  const [applied, setApplied] = useState(new Set());
  const [skipped, setSkipped] = useState(new Set());
  const [showNotif, setShowNotif] = useState(false);
  const [clock, setClock] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("hiq-theme", next);
  };

  const handleApply = (id) => {
    setApplied(p => new Set([...p, id]));
    setSkipped(p => { const n = new Set(p); n.delete(id); return n; });
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
      case "overview":  return <Overview user={user} setTab={setActiveTab} applied={applied} skipped={skipped} onApply={handleApply} />;
      case "revenue":   return <Revenue />;
      case "pricing":   return <Pricing applied={applied} skipped={skipped} onApply={handleApply} onSkip={handleSkip} onRestore={handleRestore} />;
      case "forecast":  return <Forecast setTab={setActiveTab} />;
      case "compset":   return <CompSet />;
      case "calendar":  return <CalendarSection />;
      case "reports":   return <Reports />;
      case "settings":  return <Settings user={user} onLogout={onLogout} theme={theme} toggleTheme={toggleTheme} />;
      default:          return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#06090F", color: "#E2E8F0", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <header style={{
        height: 62, padding: "0 28px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 200,
        background: "rgba(6,9,15,0.97)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #C9A55A, #4B8EF5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif" }}>IQ</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: -0.5, lineHeight: 1.2 }}>
              Hotel<span style={{ color: C.gold }}>IQ</span>
            </div>
            <div style={{ fontSize: 9, color: "#333", fontFamily: "'Space Mono', monospace", letterSpacing: 1.5 }}>
              REVENUE INTELLIGENCE
            </div>
          </div>
        </div>

        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#333", letterSpacing: 1 }}>
          {user?.hotelName?.toUpperCase() || "THE COASTAL GRAND"}
          {"  ·  "}
          {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowNotif(v => !v)} style={{
              background: showNotif ? "rgba(232,197,71,0.08)" : "transparent",
              border: `1px solid ${showNotif ? "rgba(232,197,71,0.25)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 8, width: 34, height: 34, cursor: "pointer", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#fff",
            }}>🔔
              {urgentCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16,
                  background: C.red, borderRadius: "50%", fontSize: 9, color: "#fff", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Space Mono', monospace" }}>{urgentCount}</span>
              )}
            </button>
            {showNotif && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 310,
                background: "#0D0D10", border: "1px solid rgba(255,255,255,0.07)",
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
                      <div style={{ fontSize: 12, color: "#ccc" }}>{n.text}</div>
                      <div style={{ fontSize: 10, color: "#333", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#000", fontFamily: "'Syne', sans-serif" }}>
              {(user?.firstName?.[0] || "H").toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: "#444", fontFamily: "'Space Mono', monospace" }}>
              {user?.firstName ? `Hi, ${user.firstName}` : ""}
            </span>
          </div>

          {/* AI button */}
          <button onClick={() => setAiOpen(o => !o)} style={{
            background: aiOpen ? "rgba(75,142,245,0.12)" : `linear-gradient(135deg, ${C.blue}, #2563EB)`,
            border: aiOpen ? `1px solid rgba(75,142,245,0.35)` : "none",
            color: aiOpen ? C.blue : "#fff",
            padding: "8px 16px", borderRadius: 8, cursor: "pointer",
            fontSize: 12, fontWeight: 700, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5,
          }}>✦ ASK AI</button>

          <button onClick={onLogout} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
            color: "#444", padding: "7px 14px", borderRadius: 8, cursor: "pointer",
            fontSize: 12, fontFamily: "'DM Sans', sans-serif",
          }}>Sign Out</button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: "flex" }}>
        <Sidebar active={activeTab} setTab={setActiveTab} />
        <main style={{ flex: 1, padding: "32px 36px", minWidth: 0, overflowX: "hidden" }}>
          {renderTab()}
        </main>
      </div>

      {aiOpen && <AIChat user={user} apiBase={apiBase} onClose={() => setAiOpen(false)} />}

      <style>{`
        @keyframes aipulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E1E24; border-radius: 2px; }
        button:hover { filter: brightness(1.1); }
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
