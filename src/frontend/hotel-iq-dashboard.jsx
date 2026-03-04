import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ── Simulated Data ──────────────────────────────────────────────────────────
const generateOccupancyData = () =>
  ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => ({
    month: m,
    occupancy: Math.round(55 + Math.sin(i * 0.6) * 20 + Math.random() * 8),
    lastYear:  Math.round(50 + Math.sin(i * 0.6) * 18 + Math.random() * 6),
  }));

const generateRevenueData = () =>
  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => ({
    day: d,
    revpar: Math.round(110 + Math.random() * 90 + (i >= 4 ? 40 : 0)),
    adr:    Math.round(170 + Math.random() * 70 + (i >= 4 ? 30 : 0)),
  }));

const generateForecastData = () =>
  Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isConference = i >= 5 && i <= 7;
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      demand: Math.round(
        60 + Math.sin(i * 0.8) * 18 + Math.random() * 8
        + (isWeekend ? 15 : 0)
        + (isConference ? 22 : 0)
      ),
      confidence: Math.round(92 - i * 2.5 + Math.random() * 4),
      event: isConference ? "Conference" : isWeekend ? "Weekend" : null,
    };
  });

const generateWeeklyRevenue = () =>
  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => ({
    day: d,
    revenue: Math.round(8000 + Math.random() * 6000 + (i >= 4 ? 4000 : 0)),
    rooms: Math.round(180 + Math.random() * 80 + (i >= 4 ? 40 : 0)),
  }));

const competitorRates = [
  { name: "Your Hotel",    rate: 189, change: +3.2, recommended: 195, stars: 4 },
  { name: "Grand Regency", rate: 210, change: -1.5, recommended: null, stars: 5 },
  { name: "Blue Harbor Inn",rate: 175, change: +5.1, recommended: null, stars: 3 },
  { name: "The Meridian",  rate: 220, change:  0,   recommended: null, stars: 5 },
  { name: "Coastal Suites",rate: 165, change: +2.3, recommended: null, stars: 3 },
];

const pricingRecs = [
  { id: 1, room: "Standard King",    current: 159, suggested: 179, reason: "High demand + low comp supply",   impact: "+$2,400", impactVal: 2400,  urgency: "high" },
  { id: 2, room: "Ocean View Suite", current: 289, suggested: 269, reason: "3 similar comps dropped rates",   impact: "-$800",  impactVal: -800,  urgency: "medium" },
  { id: 3, room: "Double Queen",     current: 139, suggested: 155, reason: "Weekend spike forecasted",         impact: "+$1,100", impactVal: 1100, urgency: "high" },
  { id: 4, room: "Executive Floor",  current: 349, suggested: 349, reason: "Rate is optimal — hold position", impact: "—",      impactVal: 0,    urgency: "low" },
];

const activityLog = [
  { time: "2m ago",  icon: "✦", text: "AI detected +34% demand spike this weekend",   type: "alert" },
  { time: "14m ago", icon: "↑", text: "Occupancy hit 78% — 4-week high",              type: "positive" },
  { time: "1h ago",  icon: "✓", text: "Price rec applied: Penthouse Suite → $420",    type: "success" },
  { time: "3h ago",  icon: "↓", text: "Grand Regency dropped rates -1.5%",             type: "warning" },
  { time: "6h ago",  icon: "✦", text: "New demand forecast generated for 14 days",    type: "info" },
];

// ── Sub-components ───────────────────────────────────────────────────────────
const KPI = ({ label, value, sub, delta, accent, icon }) => (
  <div style={{
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "22px 24px", display: "flex", flexDirection: "column",
    gap: 5, position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, right: 0, width: 90, height: 90,
      background: `radial-gradient(circle at top right, ${accent}28, transparent)`,
      borderRadius: "0 16px 0 90px",
    }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: 2,
        textTransform: "uppercase", color: "#666" }}>{label}</span>
      {icon && <span style={{ fontSize: 16, opacity: 0.6 }}>{icon}</span>}
    </div>
    <span style={{ fontSize: 34, fontWeight: 700, color: "#fff",
      fontFamily: "'Syne', sans-serif", lineHeight: 1.1 }}>{value}</span>
    {sub && <span style={{ fontSize: 12, color: "#555" }}>{sub}</span>}
    {delta !== undefined && (
      <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace",
        color: delta >= 0 ? "#4ADE80" : "#F87171", marginTop: 2 }}>
        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs last month
      </span>
    )}
  </div>
);

const Badge = ({ urgency }) => {
  const map = {
    high:   ["#F87171","rgba(248,113,113,0.12)"],
    medium: ["#FBBF24","rgba(251,191,36,0.12)"],
    low:    ["#4ADE80","rgba(74,222,128,0.12)"],
  };
  const [color, bg] = map[urgency] || map.low;
  return (
    <span style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", letterSpacing: 1.5,
      textTransform: "uppercase", background: bg, color, padding: "3px 8px", borderRadius: 4,
      border: `1px solid ${color}44` }}>
      {urgency}
    </span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0F0F12", border: "1px solid #2A2A2A", borderRadius: 10,
      padding: "10px 14px", fontFamily: "'Space Mono', monospace", fontSize: 11,
      boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
      <div style={{ color: "#666", marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}{["occupancy","demand","lastYear"].includes(p.name) ? "%" : ""}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function HotelIQ({ user, apiBase, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [theme, setTheme] = useState(() => localStorage.getItem("hiq-theme") || "dark");
  const isDark = theme === "dark";
  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("hiq-theme", next);
  };

  const bg         = isDark ? "#09090B" : "#F8F8F8";
  const cardBg     = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
  const cardBorder = isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.09)";
  const textPrimary = isDark ? "#EFEFEF" : "#111";
  const textMuted   = isDark ? "#555"    : "#888";

  const [showNotif, setShowNotif]   = useState(false);
  const [appliedRecs, setAppliedRecs] = useState(new Set());
  const [skippedRecs, setSkippedRecs] = useState(new Set());

  const notifications = [
    { id: 1, text: "Standard King & Double Queen rates are below optimal", time: "2m ago",  type: "alert" },
    { id: 2, text: "Demand forecast: +34% spike this weekend",             time: "15m ago", type: "info"  },
    { id: 3, text: "Grand Regency dropped rates — comp movement detected", time: "3h ago",  type: "warning" },
  ];
  const unreadCount = notifications.length;

  const [occupancyData] = useState(generateOccupancyData);
  const [revenueData]   = useState(generateRevenueData);
  const [forecastData]  = useState(generateForecastData);
  const [weeklyData]    = useState(generateWeeklyRevenue);

  // ── AI Chat ──────────────────────────────────────────────────────────────
  const [aiOpen, setAiOpen]         = useState(false);
  const [aiInput, setAiInput]       = useState("");
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiMessages, setAiMessages] = useState([{
    role: "assistant",
    text: "Hello! I'm your Hotel IQ revenue analyst. Ask me anything — pricing strategy, demand outlook, competitive positioning, or revenue optimization.",
  }]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const sendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiMessages(m => [...m, { role: "user", text: userMsg }]);
    setAiInput("");
    setAiLoading(true);

    try {
      const token = localStorage.getItem("hiq-token");
      const context = `You are Hotel IQ, an expert hotel revenue management AI analyst.
Hotel: ${user?.hotelName || "The Coastal Grand"} | Manager: ${user?.firstName || ""}
Current data: Occupancy 73%, RevPAR $142, ADR $195, Revenue MTD $89.4K.
Comp set: Grand Regency $210, Blue Harbor Inn $175, The Meridian $220, Coastal Suites $165.
Pending recs: Standard King $159→$179 (+$2,400 impact), Double Queen $139→$155 (+$1,100 impact).
Weekend demand spike forecasted +34% due to regional conference.
Be concise, data-driven, give specific actionable advice. Use $ and %.`;

      const historyForApi = aiMessages
        .filter((_, i) => i > 0)
        .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text }));

      const res = await fetch(`${apiBase}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          context,
          messages: [...historyForApi, { role: "user", content: userMsg }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI error");
      setAiMessages(m => [...m, { role: "assistant", text: data.reply }]);
    } catch (err) {
      setAiMessages(m => [...m, { role: "assistant", text: `⚠ ${err.message}` }]);
    }
    setAiLoading(false);
  };

  const handleApply = (id) => {
    setAppliedRecs(prev => new Set([...prev, id]));
    setSkippedRecs(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleSkip = (id) => {
    setSkippedRecs(prev => new Set([...prev, id]));
    setAppliedRecs(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const totalOpportunity = pricingRecs
    .filter(r => !skippedRecs.has(r.id) && !appliedRecs.has(r.id) && r.impactVal > 0)
    .reduce((sum, r) => sum + r.impactVal, 0);

  const appliedRevenue = pricingRecs
    .filter(r => appliedRecs.has(r.id) && r.impactVal > 0)
    .reduce((sum, r) => sum + r.impactVal, 0);

  const tabs = [
    { id: "overview",     label: "Overview" },
    { id: "pricing",      label: "Pricing" },
    { id: "forecast",     label: "Forecast" },
    { id: "competitors",  label: "Comp Set" },
    { id: "settings",     label: "Settings" },
  ];

  // Market position rank for competitors tab
  const sortedByRate = [...competitorRates].sort((a, b) => b.rate - a.rate);
  const myRank = sortedByRate.findIndex(c => c.name === "Your Hotel") + 1;
  const avgCompRate = Math.round(
    competitorRates.filter(c => c.name !== "Your Hotel").reduce((s, c) => s + c.rate, 0) /
    (competitorRates.length - 1)
  );

  return (
    <div style={{ minHeight: "100vh", background: bg, color: textPrimary, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <header style={{
        borderBottom: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.09)",
        padding: "0 40px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 64,
        position: "sticky", top: 0,
        background: isDark ? "rgba(9,9,11,0.96)" : "rgba(255,255,255,0.96)",
        backdropFilter: "blur(20px)", zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #E8C547, #F97316)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, color: "#000", fontFamily: "'Syne', sans-serif",
          }}>IQ</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: -0.5, lineHeight: 1.2 }}>
              Hotel<span style={{ color: "#E8C547" }}>IQ</span>
            </div>
            <div style={{ fontSize: 9, color: textMuted, fontFamily: "'Space Mono', monospace", letterSpacing: 1.5, lineHeight: 1 }}>
              {user?.hotelName?.toUpperCase() || "REVENUE INTELLIGENCE"}
            </div>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav style={{ display: "flex", gap: 2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: activeTab === t.id ? "rgba(232,197,71,0.1)" : "transparent",
              border: activeTab === t.id ? "1px solid rgba(232,197,71,0.28)" : "1px solid transparent",
              color: activeTab === t.id ? "#E8C547" : textMuted,
              padding: "7px 16px", borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: activeTab === t.id ? 600 : 400,
              transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowNotif(v => !v)} style={{
              background: showNotif ? "rgba(232,197,71,0.1)" : "transparent",
              border: `1px solid ${showNotif ? "rgba(232,197,71,0.3)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, width: 34, height: 34, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", fontSize: 15, color: textPrimary,
            }}>🔔
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  width: 16, height: 16, background: "#F87171",
                  borderRadius: "50%", fontSize: 9, color: "#fff", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Space Mono', monospace",
                }}>{unreadCount}</span>
              )}
            </button>
            {showNotif && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0,
                width: 300, background: isDark ? "#0F0F12" : "#fff",
                border: cardBorder, borderRadius: 12, overflow: "hidden",
                boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 200,
              }}>
                <div style={{ padding: "12px 16px", borderBottom: cardBorder,
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  Alerts
                  <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#F87171" }}>
                    {unreadCount} NEW
                  </span>
                </div>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: "12px 16px",
                    borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.06)",
                    display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                      background: n.type === "alert" ? "#F87171" : n.type === "warning" ? "#FBBF24" : "#60A5FA",
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: textPrimary, lineHeight: 1.5 }}>{n.text}</div>
                      <div style={{ fontSize: 10, color: textMuted, marginTop: 3, fontFamily: "'Space Mono', monospace" }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User */}
          <div style={{ fontSize: 12, color: textMuted, fontFamily: "'Space Mono', monospace",
            padding: "0 4px", display: "flex", alignItems: "center", gap: 6 }}>
            {user?.firstName && (
              <div style={{ width: 26, height: 26, borderRadius: "50%",
                background: "linear-gradient(135deg, #E8C547, #F97316)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#000", fontFamily: "'Syne', sans-serif" }}>
                {user.firstName[0].toUpperCase()}
              </div>
            )}
            {user?.firstName ? `Hi, ${user.firstName}` : new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>

          {/* Ask AI */}
          <button onClick={() => setAiOpen(o => !o)} style={{
            background: aiOpen ? "rgba(232,197,71,0.15)" : "linear-gradient(135deg, #E8C547, #F97316)",
            border: aiOpen ? "1px solid rgba(232,197,71,0.4)" : "none",
            color: aiOpen ? "#E8C547" : "#000",
            padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12,
            fontWeight: 700, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5,
            transition: "all 0.2s",
          }}>✦ ASK AI</button>

          {/* Logout */}
          <button onClick={onLogout} title="Sign out" style={{
            background: "transparent",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.12)",
            color: textMuted, padding: "7px 12px", borderRadius: 8,
            cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s",
          }}>Sign Out</button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ padding: "36px 40px", maxWidth: 1440, margin: "0 auto" }}>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
                  Revenue Overview
                </h1>
                <p style={{ color: textMuted, margin: "5px 0 0", fontSize: 13 }}>
                  {user?.hotelName || "The Coastal Grand"} · Updated just now ·{" "}
                  <span style={{ color: "#4ADE80" }}>● Live</span>
                </p>
              </div>
              <div style={{ fontSize: 12, color: textMuted, fontFamily: "'Space Mono', monospace" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>

            {/* KPIs */}
            <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <KPI icon="🏨" label="Occupancy"   value="73%"    sub="214 / 292 rooms occupied"    delta={4.2}  accent="#E8C547" />
              <KPI icon="📈" label="RevPAR"      value="$142"   sub="Revenue per available room"  delta={7.8}  accent="#F97316" />
              <KPI icon="💰" label="ADR"         value="$195"   sub="Average daily rate"          delta={2.1}  accent="#60A5FA" />
              <KPI icon="📊" label="Revenue MTD" value="$89.4K" sub="Month to date"              delta={11.3} accent="#4ADE80" />
            </div>

            {/* Charts row */}
            <div className="overview-graph" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>
                    Occupancy Rate — 12 Month
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, fontFamily: "'Space Mono', monospace" }}>
                    <span style={{ color: "#E8C547" }}>— This Year</span>
                    <span style={{ color: "#444" }}>- - Last Year</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={occupancyData}>
                    <defs>
                      <linearGradient id="occ" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#E8C547" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#E8C547" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1A1A1A" : "#E8E8E8"} />
                    <XAxis dataKey="month" tick={{ fill: textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[30, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="occupancy" stroke="#E8C547" strokeWidth={2} fill="url(#occ)" name="occupancy" />
                    <Area type="monotone" dataKey="lastYear"  stroke="#444"    strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" name="lastYear" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 24 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 18 }}>
                  RevPAR by Day
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={revenueData} barSize={14} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1A1A1A" : "#E8E8E8"} vertical={false} />
                    <XAxis dataKey="day"    tick={{ fill: textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revpar" fill="#E8C547" radius={[4,4,0,0]} name="revpar" />
                    <Bar dataKey="adr"    fill="#F9731644" radius={[4,4,0,0]} name="adr" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Insight + Quick Actions row */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
              {/* AI Insight */}
              <div style={{
                background: "linear-gradient(135deg, rgba(232,197,71,0.07), rgba(249,115,22,0.07))",
                border: "1px solid rgba(232,197,71,0.18)", borderRadius: 16, padding: "20px 24px",
                display: "flex", alignItems: "flex-start", gap: 16,
              }}>
                <div style={{ fontSize: 24, marginTop: 2 }}>✦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#E8C547", marginBottom: 6 }}>
                    AI Revenue Insight
                  </div>
                  <div style={{ color: isDark ? "#aaa" : "#555", fontSize: 13, lineHeight: 1.7 }}>
                    Demand is forecasted to spike <strong style={{ color: textPrimary }}>+34%</strong> this weekend due to a regional conference.
                    Your Standard King and Double Queen rates are{" "}
                    <strong style={{ color: "#F97316" }}>$16–20 below optimal</strong>.
                    Accepting open recommendations could generate an additional{" "}
                    <strong style={{ color: "#4ADE80" }}>${(totalOpportunity + appliedRevenue).toLocaleString()}</strong> over 3 days.
                  </div>
                  <button onClick={() => setActiveTab("pricing")} style={{
                    marginTop: 14, background: "rgba(232,197,71,0.12)",
                    border: "1px solid rgba(232,197,71,0.35)", color: "#E8C547",
                    padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                    fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700,
                  }}>VIEW PRICING RECS →</button>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 20 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
                  Quick Actions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {pricingRecs.filter(r => r.urgency === "high").map(r => (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: appliedRecs.has(r.id)
                        ? "rgba(74,222,128,0.07)"
                        : skippedRecs.has(r.id)
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(232,197,71,0.06)",
                      border: appliedRecs.has(r.id)
                        ? "1px solid rgba(74,222,128,0.2)"
                        : skippedRecs.has(r.id)
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "1px solid rgba(232,197,71,0.15)",
                      borderRadius: 10, padding: "10px 14px",
                      opacity: skippedRecs.has(r.id) ? 0.5 : 1,
                      transition: "all 0.2s",
                    }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary,
                          textDecoration: skippedRecs.has(r.id) ? "line-through" : "none" }}>
                          {r.room}
                        </div>
                        <div style={{ fontSize: 11, color: textMuted, fontFamily: "'Space Mono', monospace" }}>
                          ${r.current} → <span style={{ color: appliedRecs.has(r.id) ? "#4ADE80" : "#E8C547" }}>${r.suggested}</span>
                          {" · "}<span style={{ color: "#4ADE80" }}>{r.impact}</span>
                        </div>
                      </div>
                      {appliedRecs.has(r.id) ? (
                        <span style={{ color: "#4ADE80", fontSize: 16 }}>✓</span>
                      ) : skippedRecs.has(r.id) ? (
                        <span style={{ color: textMuted, fontSize: 11, fontFamily: "'Space Mono', monospace" }}>SKIPPED</span>
                      ) : (
                        <button onClick={() => handleApply(r.id)} style={{
                          background: "linear-gradient(135deg, #E8C547, #F97316)", border: "none",
                          color: "#000", padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                          fontSize: 10, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                        }}>APPLY</button>
                      )}
                    </div>
                  ))}
                  {appliedRevenue > 0 && (
                    <div style={{ fontSize: 11, color: "#4ADE80", fontFamily: "'Space Mono', monospace",
                      textAlign: "center", padding: "6px 0", borderTop: "1px solid rgba(74,222,128,0.15)" }}>
                      ✓ +${appliedRevenue.toLocaleString()} revenue locked in
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Feed + Weekly Revenue */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
              {/* Activity Feed */}
              <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 20 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
                  Recent Activity
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {activityLog.map((a, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 12, paddingBottom: 12,
                      borderBottom: i < activityLog.length - 1
                        ? isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.06)"
                        : "none",
                      marginBottom: i < activityLog.length - 1 ? 12 : 0,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: a.type === "positive" ? "rgba(74,222,128,0.12)"
                          : a.type === "success" ? "rgba(74,222,128,0.12)"
                          : a.type === "warning" ? "rgba(251,191,36,0.12)"
                          : a.type === "alert"   ? "rgba(248,113,113,0.12)"
                          : "rgba(96,165,250,0.12)",
                        color: a.type === "positive" || a.type === "success" ? "#4ADE80"
                          : a.type === "warning" ? "#FBBF24"
                          : a.type === "alert"   ? "#F87171"
                          : "#60A5FA",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700,
                      }}>{a.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: textPrimary, lineHeight: 1.5 }}>{a.text}</div>
                        <div style={{ fontSize: 10, color: textMuted, marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                          {a.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Revenue */}
              <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>
                    This Week's Revenue
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#4ADE80" }}>
                    TOTAL: ${weeklyData.reduce((s, d) => s + d.revenue, 0).toLocaleString()}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weeklyData} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1A1A1A" : "#E8E8E8"} vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: textMuted, fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="revenue" radius={[6,6,0,0]}>
                      {weeklyData.map((_, i) => (
                        <Cell key={i} fill={i >= 4 ? "#E8C547" : isDark ? "#2A2A2A" : "#D8D8D8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10, color: textMuted, fontFamily: "'Space Mono', monospace",
                  textAlign: "center", marginTop: 8 }}>
                  <span style={{ color: "#E8C547" }}>■</span> Weekend premium active
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PRICING ── */}
        {activeTab === "pricing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
                  Dynamic Pricing
                </h1>
                <p style={{ color: textMuted, margin: "5px 0 0", fontSize: 13 }}>
                  AI-generated recommendations based on demand, comp set & 90-day history
                </p>
              </div>
              {totalOpportunity > 0 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: textMuted, marginBottom: 4 }}>
                    PENDING OPPORTUNITY
                  </div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: "#4ADE80" }}>
                    +${totalOpportunity.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pricingRecs.map((r) => {
                const isApplied = appliedRecs.has(r.id);
                const isSkipped = skippedRecs.has(r.id);
                return (
                  <div key={r.id} style={{
                    background: isApplied
                      ? "rgba(74,222,128,0.05)"
                      : isSkipped
                      ? "rgba(255,255,255,0.01)"
                      : cardBg,
                    border: isApplied
                      ? "1px solid rgba(74,222,128,0.25)"
                      : isSkipped
                      ? isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.06)"
                      : cardBorder,
                    borderRadius: 14, padding: "20px 26px",
                    display: "flex", alignItems: "center", gap: 22,
                    opacity: isSkipped ? 0.55 : 1, transition: "all 0.25s",
                  }}>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4,
                        color: textPrimary, textDecoration: isSkipped ? "line-through" : "none" }}>
                        {r.room}
                      </div>
                      <div style={{ fontSize: 12, color: textMuted }}>{r.reason}</div>
                      {isApplied && (
                        <div style={{ fontSize: 10, color: "#4ADE80", fontFamily: "'Space Mono', monospace",
                          marginTop: 4, letterSpacing: 1 }}>✓ APPLIED</div>
                      )}
                    </div>

                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: textMuted, fontFamily: "'Space Mono', monospace",
                        marginBottom: 4, letterSpacing: 1 }}>CURRENT</div>
                      <div style={{ fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 700,
                        color: textPrimary }}>${r.current}</div>
                    </div>

                    <div style={{ color: "#333", fontSize: 18 }}>→</div>

                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 10,
                        color: isApplied ? "#4ADE80" : "#E8C547",
                        fontFamily: "'Space Mono', monospace", marginBottom: 4, letterSpacing: 1 }}>
                        {isApplied ? "APPLIED" : "SUGGESTED"}
                      </div>
                      <div style={{ fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 700,
                        color: isApplied ? "#4ADE80" : "#E8C547" }}>${r.suggested}</div>
                    </div>

                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: textMuted, fontFamily: "'Space Mono', monospace",
                        marginBottom: 4, letterSpacing: 1 }}>IMPACT</div>
                      <div style={{ fontSize: 15, fontWeight: 700,
                        color: r.impact.startsWith("+") ? "#4ADE80" : r.impact === "—" ? textMuted : "#F87171" }}>
                        {r.impact}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <Badge urgency={r.urgency} />
                    </div>

                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {!isApplied && !isSkipped && r.urgency !== "low" && (
                        <button onClick={() => handleApply(r.id)} style={{
                          background: "linear-gradient(135deg, #E8C547, #F97316)", border: "none",
                          color: "#000", padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                          fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                          letterSpacing: 0.5,
                        }}>APPLY</button>
                      )}
                      {isApplied && (
                        <button onClick={() => setAppliedRecs(prev => { const n = new Set(prev); n.delete(r.id); return n; })}
                          style={{
                            background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
                            color: "#4ADE80", padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                            fontSize: 11, fontFamily: "'Space Mono', monospace",
                          }}>✓ APPLIED</button>
                      )}
                      {!isApplied && (
                        <button onClick={() => isSkipped ? setSkippedRecs(prev => { const n = new Set(prev); n.delete(r.id); return n; }) : handleSkip(r.id)}
                          style={{
                            background: "transparent",
                            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.12)",
                            color: textMuted, padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                            fontSize: 11, fontFamily: "'Space Mono', monospace",
                          }}>{isSkipped ? "RESTORE" : "SKIP"}</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary bar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {totalOpportunity > 0 && (
                <div style={{
                  background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)",
                  borderRadius: 14, padding: "16px 24px", display: "flex", alignItems: "center", gap: 16,
                }}>
                  <div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#4ADE80", letterSpacing: 1 }}>
                      REMAINING OPPORTUNITY
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#4ADE80" }}>
                      +${totalOpportunity.toLocaleString()}
                    </div>
                    <div style={{ color: textMuted, fontSize: 12 }}>if pending recommendations are accepted</div>
                  </div>
                  <button onClick={() => pricingRecs.filter(r => !skippedRecs.has(r.id) && !appliedRecs.has(r.id) && r.urgency !== "low").forEach(r => handleApply(r.id))}
                    style={{
                      marginLeft: "auto", background: "rgba(74,222,128,0.15)",
                      border: "1px solid rgba(74,222,128,0.4)", color: "#4ADE80",
                      padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                      fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700, whiteSpace: "nowrap",
                    }}>APPLY ALL</button>
                </div>
              )}
              {appliedRevenue > 0 && (
                <div style={{
                  background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)",
                  borderRadius: 14, padding: "16px 24px", display: "flex", alignItems: "center", gap: 16,
                }}>
                  <div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#60A5FA", letterSpacing: 1 }}>
                      APPLIED REVENUE GAIN
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#60A5FA" }}>
                      +${appliedRevenue.toLocaleString()}
                    </div>
                    <div style={{ color: textMuted, fontSize: 12 }}>from {appliedRecs.size} applied recommendation{appliedRecs.size !== 1 ? "s" : ""}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FORECAST ── */}
        {activeTab === "forecast" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
                Demand Forecast
              </h1>
              <p style={{ color: textMuted, margin: "5px 0 0", fontSize: 13 }}>
                14-day AI demand prediction with confidence intervals · Model trained on 90 days of history
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <KPI icon="📅" label="Next 7d Avg Demand" value="81%"    sub="High demand period"     delta={12}   accent="#60A5FA" />
              <KPI icon="🎯" label="Forecast Accuracy"  value="94.2%" sub="Based on last 90 days"  delta={1.1}  accent="#4ADE80" />
              <KPI icon="💵" label="Projected Revenue"  value="$41.2K" sub="Next 7 days"            delta={18.4} accent="#E8C547" />
            </div>

            {/* Events Banner */}
            <div style={{
              background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.2)",
              borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{ fontSize: 20 }}>📍</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#60A5FA", marginBottom: 3 }}>
                  Demand Event Detected — Regional Tech Conference
                </div>
                <div style={{ fontSize: 12, color: textMuted }}>
                  Mar 8–10 · Expected +34% demand spike · Recommended: raise rates 12–18% for those dates
                </div>
              </div>
              <button onClick={() => setActiveTab("pricing")} style={{
                marginLeft: "auto", whiteSpace: "nowrap",
                background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)",
                color: "#60A5FA", padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700,
              }}>ADJUST RATES →</button>
            </div>

            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 24 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 18, fontSize: 15 }}>
                14-Day Demand Outlook
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="demand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#60A5FA" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1A1A1A" : "#E8E8E8"} />
                  <XAxis dataKey="date" tick={{ fill: textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="demand" stroke="#60A5FA" strokeWidth={2.5} fill="url(#demand)" name="demand" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 24 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>
                Day-by-Day Breakdown
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
                {forecastData.slice(0, 7).map((d, i) => {
                  const isHigh = d.demand > 85;
                  const isMed = d.demand > 70 && !isHigh;
                  const hasEvent = d.event;
                  return (
                    <div key={i} style={{
                      background: hasEvent ? "rgba(96,165,250,0.08)"
                        : isHigh ? "rgba(232,197,71,0.08)"
                        : "rgba(255,255,255,0.03)",
                      borderRadius: 12, padding: "14px 10px", textAlign: "center",
                      border: hasEvent ? "1px solid rgba(96,165,250,0.3)"
                        : isHigh ? "1px solid rgba(232,197,71,0.3)"
                        : "1px solid transparent",
                    }}>
                      <div style={{ fontSize: 10, color: textMuted, fontFamily: "'Space Mono', monospace",
                        marginBottom: 8, letterSpacing: 0.5 }}>{d.date}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif",
                        color: hasEvent ? "#60A5FA" : isHigh ? "#E8C547" : isMed ? textPrimary : textMuted }}>
                        {d.demand}%
                      </div>
                      {hasEvent && (
                        <div style={{ fontSize: 8, color: "#60A5FA", fontFamily: "'Space Mono', monospace",
                          marginTop: 4, letterSpacing: 0.5 }}>{d.event.toUpperCase()}</div>
                      )}
                      <div style={{ fontSize: 9, color: textMuted, marginTop: hasEvent ? 2 : 6,
                        fontFamily: "'Space Mono', monospace" }}>
                        {d.confidence}% conf
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 14, fontSize: 11,
                fontFamily: "'Space Mono', monospace", color: textMuted }}>
                <span><span style={{ color: "#E8C547" }}>■</span> High &gt;85%</span>
                <span><span style={{ color: "#60A5FA" }}>■</span> Event day</span>
                <span><span style={{ color: textMuted }}>■</span> Normal</span>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPETITORS ── */}
        {activeTab === "competitors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
                  Comp Set
                </h1>
                <p style={{ color: textMuted, margin: "5px 0 0", fontSize: 13 }}>
                  Rate comparison across your competitive set · Refreshed 12 min ago
                </p>
              </div>
            </div>

            {/* Market Position Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: "18px 22px" }}>
                <div style={{ fontSize: 10, color: textMuted, fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1.5, marginBottom: 8 }}>MARKET POSITION</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: "#E8C547" }}>
                  #{myRank}
                </div>
                <div style={{ fontSize: 12, color: textMuted }}>of {competitorRates.length} comp properties</div>
              </div>
              <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: "18px 22px" }}>
                <div style={{ fontSize: 10, color: textMuted, fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1.5, marginBottom: 8 }}>YOUR RATE vs AVG COMP</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800,
                  color: 189 < avgCompRate ? "#F87171" : "#4ADE80" }}>
                  {189 < avgCompRate ? "-" : "+"}${Math.abs(189 - avgCompRate)}
                </div>
                <div style={{ fontSize: 12, color: textMuted }}>vs $${avgCompRate} comp average</div>
              </div>
              <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: "18px 22px" }}>
                <div style={{ fontSize: 10, color: textMuted, fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1.5, marginBottom: 8 }}>AI RECOMMENDED</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: "#60A5FA" }}>
                  $195
                </div>
                <div style={{ fontSize: 12, color: textMuted }}>+$6 from current · optimal position</div>
              </div>
            </div>

            {/* Competitor list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...competitorRates].sort((a, b) => b.rate - a.rate).map((c, i) => {
                const isYou = c.name === "Your Hotel";
                return (
                  <div key={i} style={{
                    background: isYou ? "rgba(232,197,71,0.05)" : cardBg,
                    border: isYou ? "1px solid rgba(232,197,71,0.22)" : cardBorder,
                    borderRadius: 14, padding: "18px 24px",
                    display: "flex", alignItems: "center", gap: 20,
                  }}>
                    <div style={{ width: 28, textAlign: "center", fontFamily: "'Space Mono', monospace",
                      fontSize: 12, color: i === 0 ? "#E8C547" : textMuted, fontWeight: 700 }}>
                      #{i + 1}
                    </div>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        {c.name}
                        {isYou && (
                          <span style={{ fontSize: 9, background: "rgba(232,197,71,0.18)", color: "#E8C547",
                            padding: "2px 7px", borderRadius: 4, fontFamily: "'Space Mono', monospace",
                            letterSpacing: 1 }}>YOU</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: textMuted, marginTop: 3 }}>
                        {"★".repeat(c.stars)}{"☆".repeat(5 - c.stars)} {c.stars}-star
                      </div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 800,
                        color: isYou ? "#E8C547" : textPrimary }}>${c.rate}</div>
                      <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace",
                        color: c.change > 0 ? "#4ADE80" : c.change < 0 ? "#F87171" : textMuted }}>
                        {c.change > 0 ? "▲" : c.change < 0 ? "▼" : "—"}{c.change !== 0 ? ` ${Math.abs(c.change)}%` : " unchanged"}
                      </div>
                    </div>
                    {c.recommended && (
                      <div style={{ flex: 1, textAlign: "center",
                        background: "rgba(232,197,71,0.07)", border: "1px solid rgba(232,197,71,0.2)",
                        borderRadius: 10, padding: "10px 14px" }}>
                        <div style={{ fontSize: 10, color: "#E8C547", fontFamily: "'Space Mono', monospace",
                          marginBottom: 4, letterSpacing: 1 }}>AI TARGET</div>
                        <div style={{ fontSize: 20, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#E8C547" }}>
                          ${c.recommended}
                        </div>
                      </div>
                    )}
                    <div style={{ flex: 2 }}>
                      <div style={{ height: 5, background: isDark ? "#1A1A1A" : "#E0E0E0", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 3,
                          background: isYou
                            ? "linear-gradient(90deg, #E8C547, #F97316)"
                            : isDark ? "#2E2E2E" : "#C8C8C8",
                          width: `${((c.rate - 100) / 150) * 100}%`, transition: "width 1s ease",
                        }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4,
                        fontSize: 9, color: isDark ? "#333" : "#CCC", fontFamily: "'Space Mono', monospace" }}>
                        <span>$100</span><span>$250</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rate Position Chart */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 24 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 18, fontSize: 15 }}>
                Rate Position Analysis
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[...competitorRates].sort((a,b) => b.rate - a.rate)} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1A1A1A" : "#E8E8E8"} horizontal={false} />
                  <XAxis type="number" tick={{ fill: textMuted, fontSize: 11 }} axisLine={false} tickLine={false}
                    domain={[100, 250]} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: textMuted, fontSize: 11 }}
                    axisLine={false} tickLine={false} width={125} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" radius={[0,6,6,0]} name="rate">
                    {[...competitorRates].sort((a,b) => b.rate - a.rate).map((c, i) => (
                      <Cell key={i} fill={c.name === "Your Hotel" ? "#E8C547" : isDark ? "#2A2A2A" : "#D0D0D0"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
                Settings
              </h1>
              <p style={{ color: textMuted, margin: "5px 0 0", fontSize: 13 }}>Manage your account, preferences, and property details</p>
            </div>

            {/* Account Info */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 26 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20,
                display: "flex", alignItems: "center", gap: 10 }}>
                <span>Account</span>
                <span style={{ fontSize: 10, background: "rgba(74,222,128,0.12)", color: "#4ADE80",
                  padding: "3px 8px", borderRadius: 4, fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1 }}>ACTIVE</span>
              </div>
              <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 16,
                  background: "linear-gradient(135deg, #E8C547, #F97316)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 800, color: "#000", fontFamily: "'Syne', sans-serif", flexShrink: 0,
                }}>
                  {(user?.firstName?.[0] || "H").toUpperCase()}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1 }}>
                  {[
                    ["Name",         `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "—"],
                    ["Hotel",        user?.hotelName || "—"],
                    ["Email",        user?.email || "—"],
                    ["Member Since", user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
                        color: textMuted, marginBottom: 5, fontFamily: "'Space Mono', monospace" }}>{label}</div>
                      <div style={{ fontSize: 14, color: textPrimary, fontWeight: 500 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Property Stats */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 26 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 18 }}>
                Property Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {[
                  ["Total Rooms", "292"],
                  ["Room Types", "4"],
                  ["Star Rating", "4 ★"],
                  ["Comp Set Size", "4 hotels"],
                ].map(([label, val]) => (
                  <div key={label} style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                    borderRadius: 10, padding: "14px 16px",
                    border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.06)",
                  }}>
                    <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
                      color: textMuted, marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>{label}</div>
                    <div style={{ fontSize: 20, fontFamily: "'Syne', sans-serif", fontWeight: 700,
                      color: textPrimary }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 26 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 18 }}>
                Notification Preferences
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Pricing recommendations",     desc: "Alert when AI detects a rate opportunity",    on: true },
                  { label: "Demand spike alerts",          desc: "Notify when forecast demand rises sharply",   on: true },
                  { label: "Competitor rate changes",      desc: "Alert when comp set moves rates significantly", on: true },
                  { label: "Weekly performance digest",   desc: "Summary email every Monday morning",          on: false },
                ].map((item, i, arr) => (
                  <div key={item.label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 0",
                    borderBottom: i < arr.length - 1
                      ? isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.06)"
                      : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: textPrimary }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <div style={{
                      width: 40, height: 22, borderRadius: 11,
                      background: item.on ? "#E8C547" : isDark ? "#2A2A2A" : "#D0D0D0",
                      position: "relative", cursor: "pointer", transition: "background 0.2s",
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", background: "#fff",
                        position: "absolute", top: 3, left: item.on ? 21 : 3, transition: "left 0.2s",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 26 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>Appearance</div>
                  <div style={{ color: textMuted, fontSize: 13, marginTop: 4 }}>
                    Currently: <strong style={{ color: textPrimary }}>{isDark ? "Dark mode" : "Light mode"}</strong>
                  </div>
                </div>
                <button onClick={toggleTheme} style={{
                  background: "transparent",
                  border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.12)",
                  color: textPrimary, padding: "9px 20px", borderRadius: 8, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {isDark ? "☀ Switch to Light" : "☾ Switch to Dark"}
                </button>
              </div>
            </div>

            {/* Danger zone */}
            <div style={{
              background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.15)",
              borderRadius: 16, padding: 26,
            }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#F87171", marginBottom: 16 }}>
                Session
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, color: textPrimary, fontWeight: 500 }}>Sign out of Hotel IQ</div>
                  <div style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>
                    You'll need to sign in again to access your dashboard
                  </div>
                </div>
                <button onClick={onLogout} style={{
                  background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                  color: "#F87171", padding: "9px 20px", borderRadius: 8, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                }}>Sign Out</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── AI Chat Panel ── */}
      {aiOpen && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          width: 420, height: 580,
          background: "#0D0D10", border: "1px solid rgba(232,197,71,0.22)",
          borderRadius: 20, display: "flex", flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.85)", zIndex: 200, overflow: "hidden",
        }}>
          {/* Chat header */}
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(232,197,71,0.07), rgba(249,115,22,0.07))",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "linear-gradient(135deg, #E8C547, #F97316)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>✦</div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }}>
                  AI Revenue Analyst
                </div>
                <div style={{ fontSize: 9, color: "#555", fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>
                  POWERED BY GEMINI
                </div>
              </div>
            </div>
            <button onClick={() => setAiOpen(false)} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 7, width: 28, height: 28, color: "#666", cursor: "pointer",
              fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px",
            display: "flex", flexDirection: "column", gap: 12 }}>
            {aiMessages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "assistant" && (
                  <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginRight: 8, marginTop: 2,
                    background: "linear-gradient(135deg, #E8C547, #F97316)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#000" }}>✦</div>
                )}
                <div style={{
                  maxWidth: "82%",
                  background: m.role === "user"
                    ? "rgba(232,197,71,0.12)"
                    : "rgba(255,255,255,0.04)",
                  border: m.role === "user"
                    ? "1px solid rgba(232,197,71,0.25)"
                    : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  padding: "11px 15px", fontSize: 13, lineHeight: 1.65,
                  color: m.role === "user" ? "#E8C547" : "#CCC",
                  whiteSpace: "pre-wrap",
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ display: "flex", gap: 5, padding: "8px 10px", alignItems: "center" }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #E8C547, #F97316)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#000" }}>✦</div>
                <div style={{ display: "flex", gap: 4, padding: "0 8px" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%", background: "#E8C547",
                      animation: `aipulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex", gap: 8, background: "rgba(0,0,0,0.3)" }}>
            <input
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendAiMessage()}
              placeholder="Ask about pricing, demand, strategy…"
              style={{
                flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 10, padding: "10px 14px", color: "#fff",
                fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none",
              }}
            />
            <button onClick={sendAiMessage} disabled={aiLoading} style={{
              background: aiLoading ? "rgba(232,197,71,0.3)" : "linear-gradient(135deg, #E8C547, #F97316)",
              border: "none", borderRadius: 10, padding: "10px 16px",
              cursor: aiLoading ? "not-allowed" : "pointer", fontSize: 16, color: "#000",
              fontWeight: 700, minWidth: 44,
            }}>→</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes aipulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
        button:hover { filter: brightness(1.08); }
        @media (max-width: 900px) {
          header { flex-direction: column; align-items: flex-start; padding: 12px 20px; height: auto; gap: 8px; }
          header nav { overflow-x: auto; width: 100%; }
          main { padding: 20px !important; }
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .overview-graph { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
