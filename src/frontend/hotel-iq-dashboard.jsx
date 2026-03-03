import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Simulated Data ──────────────────────────────────────────────────────────
const generateOccupancyData = () =>
  ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => ({
    month: m,
    occupancy: Math.round(55 + Math.sin(i * 0.6) * 20 + Math.random() * 8),
    lastYear:  Math.round(50 + Math.sin(i * 0.6) * 18 + Math.random() * 6),
  }));

const generateRevenueData = () =>
  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => ({
    day: d,
    revpar: Math.round(120 + Math.random() * 80),
    adr:    Math.round(180 + Math.random() * 60),
  }));

const generateForecastData = () =>
  Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      demand:     Math.round(60 + Math.sin(i * 0.8) * 25 + Math.random() * 10),
      confidence: Math.round(85 - i * 2 + Math.random() * 5),
    };
  });

const competitorRates = [
  { name: "Your Hotel",    rate: 189, change: +3.2, recommended: 195 },
  { name: "Grand Regency", rate: 210, change: -1.5, recommended: null },
  { name: "Blue Harbor Inn",rate: 175, change: +5.1, recommended: null },
  { name: "The Meridian",  rate: 220, change:  0,   recommended: null },
  { name: "Coastal Suites",rate: 165, change: +2.3, recommended: null },
];

const pricingRecs = [
  { room: "Standard King",   current: 159, suggested: 179, reason: "High demand + low comp supply",      impact: "+$2,400", urgency: "high" },
  { room: "Ocean View Suite",current: 289, suggested: 269, reason: "3 similar comps dropped rates",      impact: "-$800",   urgency: "medium" },
  { room: "Double Queen",    current: 139, suggested: 155, reason: "Weekend spike forecasted",            impact: "+$1,100", urgency: "high" },
  { room: "Executive Floor", current: 349, suggested: 349, reason: "Rate is optimal",                    impact: "—",       urgency: "low" },
];

// ── Sub-components ───────────────────────────────────────────────────────────
const KPI = ({ label, value, sub, delta, accent }) => (
  <div style={{
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "24px 28px", display: "flex", flexDirection: "column",
    gap: 6, position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, right: 0, width: 80, height: 80,
      background: `radial-gradient(circle at top right, ${accent}22, transparent)`,
      borderRadius: "0 16px 0 80px",
    }} />
    <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 2,
      textTransform: "uppercase", color: "#888" }}>{label}</span>
    <span style={{ fontSize: 36, fontWeight: 700, color: "#fff",
      fontFamily: "'Syne', sans-serif", lineHeight: 1.1 }}>{value}</span>
    {sub && <span style={{ fontSize: 13, color: "#666" }}>{sub}</span>}
    {delta !== undefined && (
      <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace",
        color: delta >= 0 ? "#4ADE80" : "#F87171" }}>
        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs last month
      </span>
    )}
  </div>
);

const Badge = ({ urgency }) => {
  const map = { high: ["#F87171","#2A1A1A"], medium: ["#FBBF24","#2A2010"], low: ["#4ADE80","#0F2A16"] };
  const [color, bg] = map[urgency] || map.low;
  return (
    <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: 1,
      textTransform: "uppercase", background: bg, color, padding: "3px 8px", borderRadius: 4 }}>
      {urgency}
    </span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #333", borderRadius: 10,
      padding: "10px 14px", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
      <div style={{ color: "#888", marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {p.value}{["occupancy","demand","lastYear"].includes(p.name) ? "%" : ""}
        </div>
      ))}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function HotelIQ({ user, apiBase, onLogout, onShowAuth }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [theme, setTheme] = useState(() => localStorage.getItem("hiq-theme") || "dark");
  const isDark = theme === "dark";
  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("hiq-theme", next);
  };

  const cardBg     = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.06)";
  const cardBorder = isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.1)";

  const [showNotif, setShowNotif] = useState(false);
  const notifications = [
    { id: 1, text: "New demand forecast available", time: "2m ago" },
    { id: 2, text: "Price recommendation applied",  time: "1h ago" },
  ];

  const [occupancyData] = useState(generateOccupancyData);
  const [revenueData]   = useState(generateRevenueData);
  const [forecastData]  = useState(generateForecastData);

  // ── AI Chat ──────────────────────────────────────────────────────────────
  const [aiOpen, setAiOpen]       = useState(false);
  const [aiInput, setAiInput]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState([{
    role: "assistant",
    text: "Hello! I'm your Hotel IQ revenue analyst. Ask me anything — pricing strategy, demand outlook, competitive positioning.",
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
Current data: Occupancy 73%, RevPAR $142, ADR $195.
Comp set: Grand Regency $210, Blue Harbor Inn $175, The Meridian $220, Coastal Suites $165.
Pending recs: Standard King $159→$179, Double Queen $139→$155.
Be concise, data-driven, give specific actionable advice. Use $ and %.`;

      // Build message history for API (skip the initial assistant greeting for API call)
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

  const tabs = ["overview", "pricing", "forecast", "competitors", "settings"];

  return (
    <div style={{
      minHeight: "100vh",
      background: isDark ? "#0A0A0A" : "#fafafa",
      color: isDark ? "#E8E8E8" : "#111",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <header style={{
        borderBottom: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.1)",
        padding: "0 40px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 64,
        position: "sticky", top: 0,
        background: isDark ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)", zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #E8C547, #F97316)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#000", fontFamily: "'Syne', sans-serif",
          }}>IQ</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>
              Hotel<span style={{ color: "#E8C547" }}>IQ</span>
            </div>
            <div style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>
              {user?.hotelName?.toUpperCase() || "REVENUE INTELLIGENCE"}
            </div>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav style={{ display: "flex", gap: 4 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              background: activeTab === t ? "rgba(232,197,71,0.12)" : "transparent",
              border: activeTab === t ? "1px solid rgba(232,197,71,0.3)" : "1px solid transparent",
              color: activeTab === t ? "#E8C547" : "#666",
              padding: "7px 18px", borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              textTransform: "capitalize", transition: "all 0.2s",
            }}>{t}</button>
          ))}
        </nav>

        {/* Right side actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowNotif(v => !v)} style={{
              background: "transparent", border: "none", color: "#fff",
              fontSize: 18, cursor: "pointer", padding: 0, position: "relative",
            }}>🔔
              {notifications.length > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  width: 16, height: 16, background: "#F87171",
                  borderRadius: "50%", fontSize: 10, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{notifications.length}</span>
              )}
            </button>
            {showNotif && (
              <div style={{
                position: "absolute", top: "100%", right: 0, marginTop: 4,
                width: 260, background: isDark ? "#111" : "#fff",
                border: cardBorder, borderRadius: 8, padding: 12,
                boxShadow: "0 8px 20px rgba(0,0,0,0.5)", zIndex: 150,
              }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 13, color: isDark ? "#eee" : "#111",
                  }}>
                    <div>{n.text}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>{n.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User greeting */}
          <div style={{ fontSize: 12, color: isDark ? "#555" : "#444", fontFamily: "'Space Mono', monospace" }}>
            {user?.firstName ? `Hi, ${user.firstName}` : new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>

          {/* Ask AI */}
          <button onClick={() => user ? setAiOpen(o => !o) : onShowAuth?.("login")} style={{
            background: "linear-gradient(135deg, #E8C547, #F97316)",
            border: "none", color: "#000", padding: "8px 16px",
            borderRadius: 8, cursor: "pointer", fontSize: 12,
            fontWeight: 700, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5,
          }}>✦ ASK AI</button>

          {/* Auth buttons or Logout */}
          {user ? (
            <button onClick={onLogout} title="Sign out" style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#555", padding: "7px 12px", borderRadius: 8,
              cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
            }}>Sign Out</button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onShowAuth?.("login")} style={{
                background: "transparent", border: "1px solid #C9A84C",
                color: "#C9A84C", padding: "7px 14px", borderRadius: 8,
                cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              }}>Sign In</button>
              <button onClick={() => onShowAuth?.("register")} style={{
                background: "#C9A84C", border: "none",
                color: "#000", padding: "7px 14px", borderRadius: 8,
                cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
              }}>Register</button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ padding: "40px", maxWidth: 1400, margin: "0 auto" }}>

        {/* Overview */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
                Revenue Overview
              </h1>
              <p style={{ color: "#555", margin: "6px 0 0", fontSize: 14 }}>
                {user?.hotelName || "The Coastal Grand"} — Live dashboard · Updated just now
              </p>
            </div>

            <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <KPI label="Occupancy"   value="73%"    sub="214 / 292 rooms"             delta={4.2}  accent="#E8C547" />
              <KPI label="RevPAR"      value="$142"   sub="Revenue per available room"  delta={7.8}  accent="#F97316" />
              <KPI label="ADR"         value="$195"   sub="Avg daily rate"              delta={2.1}  accent="#60A5FA" />
              <KPI label="Revenue MTD" value="$89.4K" sub="Month to date"               delta={11.3} accent="#4ADE80" />
            </div>

            <div className="overview-graph" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
              <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 28 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 20, fontSize: 16 }}>
                  Occupancy Rate — 12 Month View
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={occupancyData}>
                    <defs>
                      <linearGradient id="occ" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#E8C547" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E8C547" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                    <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} domain={[30, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="occupancy" stroke="#E8C547" strokeWidth={2} fill="url(#occ)" name="occupancy" />
                    <Area type="monotone" dataKey="lastYear"  stroke="#444"    strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" name="lastYear" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 28 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 20, fontSize: 16 }}>
                  RevPAR by Day
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueData} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                    <XAxis dataKey="day"    tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revpar" fill="#E8C547" radius={[4,4,0,0]} name="revpar" />
                    <Bar dataKey="adr"    fill="#F97316" radius={[4,4,0,0]} name="adr" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Insight Banner */}
            <div style={{
              background: "linear-gradient(135deg, rgba(232,197,71,0.08), rgba(249,115,22,0.08))",
              border: "1px solid rgba(232,197,71,0.2)", borderRadius: 16, padding: "20px 28px",
              display: "flex", alignItems: "center", gap: 20,
            }}>
              <div style={{ fontSize: 28 }}>✦</div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#E8C547" }}>
                  AI Revenue Insight
                </div>
                <div style={{ color: "#aaa", fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>
                  Demand is forecasted to spike <strong style={{ color: "#fff" }}>+34%</strong> this weekend due to a regional conference.
                  Your Standard King and Double Queen rates are <strong style={{ color: "#F97316" }}>$20–26 below optimal</strong>.
                  Accepting recommendations could generate an additional <strong style={{ color: "#4ADE80" }}>$3,500</strong> over 3 days.
                </div>
              </div>
              <button onClick={() => setActiveTab("pricing")} style={{
                marginLeft: "auto", whiteSpace: "nowrap",
                background: "rgba(232,197,71,0.15)", border: "1px solid rgba(232,197,71,0.4)",
                color: "#E8C547", padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                fontSize: 12, fontFamily: "'Space Mono', monospace", fontWeight: 700,
              }}>VIEW PRICING →</button>
            </div>
          </div>
        )}

        {/* Pricing */}
        {activeTab === "pricing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
                Dynamic Pricing
              </h1>
              <p style={{ color: "#555", margin: "6px 0 0", fontSize: 14 }}>
                AI-generated recommendations based on demand, comp set & history
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pricingRecs.map((r, i) => (
                <div key={i} style={{
                  background: cardBg, border: cardBorder, borderRadius: 14,
                  padding: "22px 28px", display: "flex", alignItems: "center", gap: 24,
                }}>
                  <div style={{ flex: 2 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{r.room}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{r.reason}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>CURRENT</div>
                    <div style={{ fontSize: 24, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>${r.current}</div>
                  </div>
                  <div style={{ fontSize: 20, color: "#333" }}>→</div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#E8C547", fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>SUGGESTED</div>
                    <div style={{ fontSize: 24, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#E8C547" }}>${r.suggested}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>IMPACT</div>
                    <div style={{ fontSize: 16, fontWeight: 600,
                      color: r.impact.startsWith("+") ? "#4ADE80" : r.impact === "—" ? "#555" : "#F87171" }}>
                      {r.impact}
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                    <Badge urgency={r.urgency} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {r.urgency !== "low" && (
                      <button style={{
                        background: "linear-gradient(135deg, #E8C547, #F97316)", border: "none",
                        color: "#000", padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                        fontSize: 12, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                      }}>APPLY</button>
                    )}
                    <button style={{
                      background: "transparent", border: "1px solid #333",
                      color: "#666", padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                      fontSize: 12, fontFamily: "'Space Mono', monospace",
                    }}>SKIP</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)",
              borderRadius: 14, padding: "18px 28px", display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#4ADE80" }}>TOTAL OPPORTUNITY</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#4ADE80" }}>+$3,500</div>
              <div style={{ color: "#666", fontSize: 13 }}>estimated additional revenue if all recommendations are accepted</div>
              <button style={{
                marginLeft: "auto", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)",
                color: "#4ADE80", padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                fontSize: 12, fontFamily: "'Space Mono', monospace", fontWeight: 700,
              }}>APPLY ALL</button>
            </div>
          </div>
        )}

        {/* Forecast */}
        {activeTab === "forecast" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
                Demand Forecast
              </h1>
              <p style={{ color: "#555", margin: "6px 0 0", fontSize: 14 }}>14-day AI demand prediction with confidence intervals</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <KPI label="Next 7d Avg Demand" value="81%"    sub="High demand period"      delta={12}   accent="#60A5FA" />
              <KPI label="Forecast Accuracy"  value="94.2%" sub="Based on last 90 days"   delta={1.1}  accent="#4ADE80" />
              <KPI label="Projected Revenue"  value="$41.2K" sub="Next 7 days"             delta={18.4} accent="#E8C547" />
            </div>

            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 28 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 20, fontSize: 16 }}>
                14-Day Demand Outlook
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="demand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#60A5FA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                  <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="demand" stroke="#60A5FA" strokeWidth={2.5} fill="url(#demand)" name="demand" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 28 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
                Day-by-Day Breakdown
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
                {forecastData.slice(0, 7).map((d, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px 10px", textAlign: "center",
                    border: d.demand > 85 ? "1px solid rgba(232,197,71,0.4)" : "1px solid transparent",
                  }}>
                    <div style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>{d.date}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Syne', sans-serif",
                      color: d.demand > 85 ? "#E8C547" : d.demand > 70 ? "#fff" : "#888" }}>{d.demand}%</div>
                    <div style={{ fontSize: 9, color: "#555", marginTop: 6, fontFamily: "'Space Mono', monospace" }}>
                      {d.confidence}% conf.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Competitors */}
        {activeTab === "competitors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
                Competitor Rates
              </h1>
              <p style={{ color: "#555", margin: "6px 0 0", fontSize: 14 }}>
                Live rate comparison across your comp set · Refreshed 12 min ago
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {competitorRates.map((c, i) => (
                <div key={i} style={{
                  background: c.name === "Your Hotel" ? "rgba(232,197,71,0.06)" : cardBg,
                  border: c.name === "Your Hotel" ? "1px solid rgba(232,197,71,0.25)" : cardBorder,
                  borderRadius: 14, padding: "22px 28px",
                  display: "flex", alignItems: "center", gap: 24,
                }}>
                  <div style={{ flex: 2 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", gap: 10 }}>
                      {c.name}
                      {c.name === "Your Hotel" && (
                        <span style={{ fontSize: 10, background: "rgba(232,197,71,0.2)", color: "#E8C547",
                          padding: "2px 8px", borderRadius: 4, fontFamily: "'Space Mono', monospace" }}>YOU</span>
                      )}
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800,
                      color: c.name === "Your Hotel" ? "#E8C547" : "#fff" }}>${c.rate}</div>
                    <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace",
                      color: c.change > 0 ? "#4ADE80" : c.change < 0 ? "#F87171" : "#555" }}>
                      {c.change > 0 ? "▲" : c.change < 0 ? "▼" : "—"} {Math.abs(c.change)}%
                    </div>
                  </div>
                  {c.recommended && (
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#E8C547", fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>
                        AI RECOMMENDS
                      </div>
                      <div style={{ fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#E8C547" }}>
                        ${c.recommended}
                      </div>
                    </div>
                  )}
                  <div style={{ flex: 2 }}>
                    <div style={{ height: 6, background: "#1A1A1A", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3,
                        background: c.name === "Your Hotel" ? "#E8C547" : "#333",
                        width: `${(c.rate / 250) * 100}%`, transition: "width 1s ease",
                      }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4,
                      fontSize: 9, color: "#444", fontFamily: "'Space Mono', monospace" }}>
                      <span>$100</span><span>$250</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 28 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 20, fontSize: 16 }}>
                Rate Position Analysis
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={competitorRates} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} domain={[100, 250]} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" radius={[0,4,4,0]} name="rate" fill="#444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
                Settings
              </h1>
              <p style={{ color: "#555", margin: "6px 0 0", fontSize: 14 }}>Manage your account and preferences</p>
            </div>

            {/* Account Info */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 28 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Account</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {[
                  ["Name",  `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "—"],
                  ["Hotel", user?.hotelName || "—"],
                  ["Email", user?.email || "—"],
                  ["Member Since", user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "#555", marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 15, color: isDark ? "#ddd" : "#111" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>Theme</div>
                  <div style={{ color: "#555", fontSize: 13, marginTop: 4 }}>Currently: {isDark ? "Dark" : "Light"}</div>
                </div>
                <button onClick={toggleTheme} style={{
                  background: "transparent", border: `1px solid ${isDark ? "#555" : "#ccc"}`,
                  color: isDark ? "#fff" : "#111", padding: "8px 18px", borderRadius: 8, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, transition: "all 0.2s",
                }}>Switch to {isDark ? "Light" : "Dark"}</button>
              </div>
            </div>

            {/* Sign out */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>Sign Out</div>
                  <div style={{ color: "#555", fontSize: 13, marginTop: 4 }}>End your current session</div>
                </div>
                <button onClick={onLogout} style={{
                  background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                  color: "#F87171", padding: "8px 18px", borderRadius: 8, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
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
          width: 400, height: 560,
          background: "#111", border: "1px solid rgba(232,197,71,0.25)",
          borderRadius: 20, display: "flex", flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)", zIndex: 200, overflow: "hidden",
        }}>
          <div style={{
            padding: "18px 22px", borderBottom: "1px solid #1E1E1E",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(232,197,71,0.08), rgba(249,115,22,0.08))",
          }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>✦ AI Revenue Analyst</div>
              <div style={{ fontSize: 10, color: "#666", fontFamily: "'Space Mono', monospace" }}>POWERED BY CLAUDE</div>
            </div>
            <button onClick={() => setAiOpen(false)} style={{
              background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 18,
            }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {aiMessages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%",
                  background: m.role === "user" ? "rgba(232,197,71,0.15)" : "rgba(255,255,255,0.05)",
                  border: m.role === "user" ? "1px solid rgba(232,197,71,0.3)" : "1px solid #1E1E1E",
                  borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  padding: "12px 16px", fontSize: 13, lineHeight: 1.6,
                  color: m.role === "user" ? "#E8C547" : "#ccc",
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ display: "flex", gap: 4, padding: "8px 12px" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#E8C547",
                    animation: `aipulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: "14px 18px", borderTop: "1px solid #1E1E1E", display: "flex", gap: 10 }}>
            <input
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendAiMessage()}
              placeholder="Ask about pricing, demand, strategy…"
              style={{
                flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid #2A2A2A",
                borderRadius: 10, padding: "10px 14px", color: "#fff",
                fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none",
              }}
            />
            <button onClick={sendAiMessage} disabled={aiLoading} style={{
              background: "linear-gradient(135deg, #E8C547, #F97316)",
              border: "none", borderRadius: 10, padding: "10px 16px",
              cursor: aiLoading ? "not-allowed" : "pointer", fontSize: 16, fontWeight: 700,
              opacity: aiLoading ? 0.7 : 1,
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
        ::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 2px; }
        @media (max-width: 768px) {
          header { flex-direction: column; align-items: flex-start; padding: 0 20px; height: auto; }
          header nav { margin-top: 8px; overflow-x: auto; width: 100%; }
          main { padding: 20px; }
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
