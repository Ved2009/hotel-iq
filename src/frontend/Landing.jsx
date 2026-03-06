import { useState, useEffect, useRef } from "react";

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let frame;
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(ease * target));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]);
  return value;
}

// ─── Mini sparkline (pure SVG) ────────────────────────────────────────────────
function Spark({ data, color, height = 36 }) {
  const w = 120, h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(" ");
  const area = `M0,${h} L${pts.split(" ").map(p => p).join(" L")} L${w},${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sg${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Landing({ onSignIn, onGetStarted }) {
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const c1 = useCounter(2400, 1600, statsVisible);
  const c2 = useCounter(94, 1400, statsVisible);
  const c3 = useCounter(18, 1200, statsVisible);
  const c4 = useCounter(4.2, 1800, statsVisible);

  const FEATURES = [
    {
      icon: "◈", label: "AI PRICING ENGINE",
      title: "Dynamic Rates, 24/7",
      desc: "AI adjusts every room type every hour based on demand signals, competitor moves, and booking pace — without lifting a finger.",
      color: "#6366F1", glow: "rgba(99,102,241,0.15)",
    },
    {
      icon: "⌖", label: "DEMAND FORECASTING",
      title: "14-Day Demand Vision",
      desc: "Trained on 90 days of your history. Detects events, identifies weekday vs weekend patterns, and gives confidence-graded predictions.",
      color: "#10B981", glow: "rgba(16,185,129,0.12)",
    },
    {
      icon: "⊞", label: "COMP INTELLIGENCE",
      title: "Know Your Competition",
      desc: "Real-time rate tracking across all major OTAs. See exactly where you stand and get AI recommendations to win on price.",
      color: "#F59E0B", glow: "rgba(245,158,11,0.12)",
    },
    {
      icon: "▦", label: "REVENUE CALENDAR",
      title: "Spot Gaps Instantly",
      desc: "Color-coded monthly view of occupancy, ADR, and revenue per day. Identify soft dates before they cost you.",
      color: "#EC4899", glow: "rgba(236,72,153,0.12)",
    },
    {
      icon: "≋", label: "CHANNEL & SEGMENT",
      title: "Where Profit Lives",
      desc: "Break down revenue by Leisure, Business, Group, and OTA. Understand which channels are driving margin, not just volume.",
      color: "#14B8A6", glow: "rgba(20,184,166,0.12)",
    },
    {
      icon: "⌇", label: "AUTOMATED REPORTS",
      title: "Boardroom-Ready Reports",
      desc: "Monthly revenue summaries, pickup reports, and comp analyses — generated overnight and ready to share.",
      color: "#8B5CF6", glow: "rgba(139,92,246,0.12)",
    },
  ];

  const STEPS = [
    { n: "01", title: "Connect Your Property", desc: "Sync your PMS in minutes. Hotel IQ pulls historical bookings, rates, and channel data automatically." },
    { n: "02", title: "AI Learns Your Patterns", desc: "Our models train on your hotel's seasonality, events, and comp set within 48 hours of connection." },
    { n: "03", title: "Approve & Earn More", desc: "Review AI pricing recommendations daily. One click to apply. Track the revenue impact in real time." },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#030712", color: "#E2E8F0",
      fontFamily: "'DM Sans', sans-serif", overflowX: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Global ambient bg ── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 60%)",
      }} />

      {/* ── Navigation ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrollY > 20 ? "rgba(3,7,18,0.95)" : "transparent",
        backdropFilter: scrollY > 20 ? "blur(24px)" : "none",
        borderBottom: scrollY > 20 ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        padding: "0 64px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #6366F1, #4F46E5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif",
            boxShadow: "0 0 20px rgba(99,102,241,0.5)",
          }}>IQ</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: -0.5 }}>
            Hotel<span style={{ color: "#F59E0B" }}>IQ</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: 40 }}>
          {["Platform", "Features", "Pricing", "About"].map(l => (
            <a key={l} href="#" style={{
              fontSize: 14, color: "#6B7280", textDecoration: "none", fontWeight: 500,
              transition: "color 0.15s",
            }}
              onMouseEnter={e => e.target.style.color = "#E2E8F0"}
              onMouseLeave={e => e.target.style.color = "#6B7280"}>
              {l}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={onSignIn} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
            color: "#9CA3AF", padding: "9px 20px", borderRadius: 8, cursor: "pointer",
            fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.target.style.borderColor = "rgba(255,255,255,0.25)"; e.target.style.color = "#fff"; }}
            onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.color = "#9CA3AF"; }}>
            Sign In
          </button>
          <button onClick={onGetStarted} style={{
            background: "linear-gradient(135deg, #6366F1, #4F46E5)",
            border: "none", color: "#fff", padding: "9px 22px", borderRadius: 8,
            cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 28px rgba(99,102,241,0.6)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.4)"}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: "100px 64px 80px", maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

          {/* Left — copy */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 100, padding: "6px 16px", marginBottom: 28,
            }}>
              <span style={{
                display: "inline-block", width: 7, height: 7, borderRadius: "50%",
                background: "#6366F1", boxShadow: "0 0 10px #6366F1",
                animation: "livePulse 2s ease-in-out infinite",
              }} />
              <span style={{ fontSize: 11, color: "#818CF8", fontFamily: "'Space Mono', monospace",
                letterSpacing: 2, textTransform: "uppercase" }}>Live Revenue Intelligence</span>
            </div>

            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(38px, 4.5vw, 64px)",
              fontWeight: 800, lineHeight: 1.08, letterSpacing: -2,
              margin: "0 0 24px", color: "#fff",
            }}>
              The Revenue Brain<br />
              Behind the World's<br />
              <span style={{
                background: "linear-gradient(135deg, #F59E0B, #F97316)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Top Hotels.</span>
            </h1>

            <p style={{ fontSize: 17, color: "#6B7280", lineHeight: 1.8, margin: "0 0 36px", maxWidth: 480 }}>
              Hotel IQ combines AI demand forecasting, real-time dynamic pricing, and
              competitive intelligence into one platform. Stop guessing. Start outperforming.
            </p>

            <div style={{ display: "flex", gap: 14, marginBottom: 40, flexWrap: "wrap" }}>
              <button onClick={onGetStarted} style={{
                background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                border: "none", color: "#fff", padding: "14px 32px",
                borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 4px 28px rgba(99,102,241,0.45)",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                Start Free — No Card →
              </button>
              <button onClick={onSignIn} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)", color: "#9CA3AF",
                padding: "14px 28px", borderRadius: 10, cursor: "pointer",
                fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}>
                Sign In to Dashboard
              </button>
            </div>

            <div style={{ display: "flex", gap: 32 }}>
              {[
                { val: "14-day", lbl: "free trial" },
                { val: "2 min", lbl: "setup" },
                { val: "24/7", lbl: "AI updates" },
              ].map((x, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", letterSpacing: -0.5 }}>{x.val}</div>
                  <div style={{ fontSize: 11, color: "#4B5563", fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>{x.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Live dashboard preview */}
          <div style={{ position: "relative" }}>
            {/* Glow behind card */}
            <div style={{
              position: "absolute", inset: -40, borderRadius: 40,
              background: "radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24, padding: 28, position: "relative",
              backdropFilter: "blur(20px)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}>
              {/* Dashboard header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>
                    The Grand Coastal — Live
                  </div>
                  <div style={{ fontSize: 11, color: "#4B5563", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                    Updated just now
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: 100, padding: "4px 12px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981",
                    display: "inline-block", boxShadow: "0 0 6px #10B981" }} />
                  <span style={{ fontSize: 10, color: "#10B981", fontFamily: "'Space Mono', monospace",
                    letterSpacing: 1 }}>LIVE</span>
                </div>
              </div>

              {/* KPI row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
                {[
                  { lbl: "Occupancy", val: "78%", delta: "+4.2%", col: "#F59E0B", spark: [62,65,70,68,72,75,74,78] },
                  { lbl: "RevPAR", val: "$147", delta: "+8.1%", col: "#6366F1", spark: [120,125,131,128,135,139,142,147] },
                  { lbl: "ADR", val: "$188", delta: "+2.4%", col: "#10B981", spark: [175,178,180,177,182,185,184,188] },
                ].map((k, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12, padding: "12px 14px", overflow: "hidden",
                  }}>
                    <div style={{ fontSize: 9, color: "#4B5563", fontFamily: "'Space Mono', monospace",
                      letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{k.lbl}</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22,
                      color: "#fff", letterSpacing: -0.5, marginBottom: 2 }}>{k.val}</div>
                    <div style={{ fontSize: 10, color: "#10B981", fontFamily: "'Space Mono', monospace",
                      marginBottom: 6 }}>{k.delta} vs last mo</div>
                    <Spark data={k.spark} color={k.col} />
                  </div>
                ))}
              </div>

              {/* Pricing recommendation */}
              <div style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(79,70,229,0.08))",
                border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, padding: "14px 16px",
                marginBottom: 14,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#818CF8", fontFamily: "'Space Mono', monospace",
                    letterSpacing: 1, textTransform: "uppercase" }}>✦ AI Recommendation</div>
                  <span style={{ fontSize: 9, background: "rgba(239,68,68,0.15)", color: "#F87171",
                    border: "1px solid rgba(239,68,68,0.25)", borderRadius: 4, padding: "2px 8px",
                    fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>HIGH</span>
                </div>
                <div style={{ fontSize: 13, color: "#C7D2FE", lineHeight: 1.6, marginBottom: 10 }}>
                  Standard King: raise to <strong style={{ color: "#fff" }}>$179</strong> (was $159).
                  Conference demand spike +34% this weekend.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{
                    background: "linear-gradient(135deg, #6366F1, #4F46E5)", border: "none",
                    color: "#fff", padding: "6px 16px", borderRadius: 6, cursor: "pointer",
                    fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                  }}>APPLY +$2,400</button>
                  <button style={{
                    background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#4B5563", padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                    fontSize: 11, fontFamily: "'Space Mono', monospace",
                  }}>SKIP</button>
                </div>
              </div>

              {/* Bottom metric row */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0",
                borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {[
                  { lbl: "Revenue MTD", val: "$91.4K", col: "#10B981" },
                  { lbl: "Comp Position", val: "#2 of 6", col: "#F59E0B" },
                  { lbl: "Pending Recs", val: "3 high", col: "#EF4444" },
                ].map((m, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#374151", fontFamily: "'Space Mono', monospace",
                      letterSpacing: 1, marginBottom: 4 }}>{m.lbl}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: m.col, fontFamily: "'Syne', sans-serif" }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.015)",
        padding: "22px 64px", zIndex: 1, position: "relative",
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#374151", fontFamily: "'Space Mono', monospace",
            letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>
            Trusted by hotels worldwide
          </span>
          {["Meridian Hotels", "Grand Pacific", "Coastal Suites", "Harborview Group", "Azure Resorts"].map((n, i) => (
            <span key={i} style={{ fontSize: 13, color: "#374151", fontWeight: 600,
              fontFamily: "'Syne', sans-serif", letterSpacing: -0.3, whiteSpace: "nowrap" }}>{n}</span>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <section ref={statsRef} style={{
        padding: "90px 64px", position: "relative", zIndex: 1,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid",
          gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
          {[
            { val: c1, suffix: "+", label: "Hotels Worldwide", sub: "across 40 countries", color: "#6366F1" },
            { val: c2, suffix: "%", label: "Forecast Accuracy", sub: "14-day demand model", color: "#10B981" },
            { val: c3, suffix: "%", label: "Avg RevPAR Lift", sub: "in first 90 days", color: "#F59E0B" },
            { val: `$${c4.toFixed(1)}M`, suffix: "", label: "Avg Annual Gain", sub: "per property", color: "#EC4899" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: "32px 28px",
              position: "relative", overflow: "hidden",
              transition: "transform 0.2s, border-color 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = `${s.color}40`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${s.color}, transparent)`,
              }} />
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800,
                color: s.color, letterSpacing: -2, lineHeight: 1, marginBottom: 8 }}>
                {s.val}{s.suffix}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#E2E8F0", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "#4B5563", fontFamily: "'Space Mono', monospace" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "80px 64px 100px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <div style={{ fontSize: 11, color: "#6366F1", fontFamily: "'Space Mono', monospace",
              letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>What Hotel IQ Does</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(30px, 3.5vw, 48px)",
              fontWeight: 800, margin: 0, letterSpacing: -1.5, color: "#fff", lineHeight: 1.1 }}>
              One platform to replace<br />your entire revenue stack.
            </h2>
            <p style={{ color: "#6B7280", fontSize: 17, marginTop: 18, lineHeight: 1.75, maxWidth: 540, margin: "18px auto 0" }}>
              Built by revenue managers who were tired of stitching together 4 different tools.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20, padding: "32px 30px 36px",
                transition: "all 0.25s", cursor: "default", position: "relative", overflow: "hidden",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = f.glow;
                  e.currentTarget.style.borderColor = `${f.color}50`;
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14, marginBottom: 22,
                  background: `${f.color}18`, border: `1px solid ${f.color}35`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, color: f.color,
                  boxShadow: `0 0 20px ${f.color}25`,
                }}>{f.icon}</div>
                <div style={{ fontSize: 9, color: f.color, fontFamily: "'Space Mono', monospace",
                  letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>{f.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18,
                  color: "#fff", marginBottom: 12, letterSpacing: -0.3 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.8 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{
        padding: "90px 64px",
        background: "rgba(255,255,255,0.015)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 11, color: "#F59E0B", fontFamily: "'Space Mono', monospace",
              letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>How It Works</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 40, fontWeight: 800,
              margin: 0, letterSpacing: -1, color: "#fff" }}>Up and earning in 48 hours.</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 40 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: "absolute", top: 28, left: "calc(100% - 20px)", width: "40%",
                    height: 1, background: "linear-gradient(90deg, rgba(99,102,241,0.4), transparent)",
                  }} />
                )}
                <div style={{ marginBottom: 20 }}>
                  <span style={{
                    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 48,
                    color: "rgba(99,102,241,0.2)", letterSpacing: -2, lineHeight: 1,
                  }}>{s.n}</span>
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20,
                  color: "#fff", marginBottom: 12, letterSpacing: -0.3 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.8 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: "90px 64px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 11, color: "#EC4899", fontFamily: "'Space Mono', monospace",
              letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>What Hotels Say</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 40, fontWeight: 800,
              margin: 0, letterSpacing: -1, color: "#fff" }}>Revenue results, not promises.</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {[
              {
                quote: "Hotel IQ increased our RevPAR by 22% in the first quarter. The AI demand forecasting is eerily accurate — it predicted a local event we didn't even know about.",
                name: "Sarah Mitchell", role: "Director of Revenue, The Grand Coastal",
                metric: "+22% RevPAR", color: "#10B981",
              },
              {
                quote: "We replaced three separate tools with Hotel IQ. The comp set intelligence alone saved us 10 hours a week. The ROI was clear within the first 30 days.",
                name: "James Thornton", role: "VP Revenue Management, Meridian Hotels",
                metric: "3 tools replaced", color: "#6366F1",
              },
            ].map((t, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20, padding: "36px 36px 32px",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${t.color}80, transparent)`,
                }} />
                <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ color: "#F59E0B", fontSize: 14 }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: 16, color: "#9CA3AF", lineHeight: 1.85, margin: "0 0 28px",
                  fontStyle: "italic" }}>"{t.quote}"</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#4B5563", marginTop: 3 }}>{t.role}</div>
                  </div>
                  <div style={{
                    background: `${t.color}15`, border: `1px solid ${t.color}30`,
                    borderRadius: 8, padding: "6px 14px",
                    fontSize: 13, fontWeight: 700, color: t.color,
                    fontFamily: "'Space Mono', monospace",
                  }}>{t.metric}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: "100px 64px", textAlign: "center", position: "relative", zIndex: 1,
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 11, color: "#6366F1", fontFamily: "'Space Mono', monospace",
            letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>Get Started Today</div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontSize: "clamp(34px, 4vw, 52px)",
            fontWeight: 800, letterSpacing: -2, color: "#fff", margin: "0 0 20px", lineHeight: 1.1,
          }}>
            Your competitors are already<br />
            <span style={{
              background: "linear-gradient(135deg, #F59E0B, #F97316)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>using AI pricing.</span>
          </h2>
          <p style={{ color: "#6B7280", fontSize: 17, lineHeight: 1.75, marginBottom: 40 }}>
            Join 2,400+ hotels using Hotel IQ to make smarter revenue decisions every single day.
            Free 14-day trial. No credit card.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 24 }}>
            <button onClick={onGetStarted} style={{
              background: "linear-gradient(135deg, #6366F1, #4F46E5)",
              border: "none", color: "#fff", padding: "16px 40px",
              borderRadius: 12, cursor: "pointer", fontSize: 16, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 4px 32px rgba(99,102,241,0.5)",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              Create Free Account →
            </button>
            <button onClick={onSignIn} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
              color: "#6B7280", padding: "16px 36px", borderRadius: 12, cursor: "pointer",
              fontSize: 16, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}>
              Sign In
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#374151", fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>
            No credit card · Cancel anytime · Full dashboard access from day 1
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "36px 64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 20, zIndex: 1, position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #6366F1, #4F46E5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif",
          }}>IQ</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>
            Hotel<span style={{ color: "#F59E0B" }}>IQ</span>
          </span>
          <span style={{ fontSize: 12, color: "#1F2937", marginLeft: 6 }}>
            © {new Date().getFullYear()} Hotel IQ. All rights reserved.
          </span>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {["Privacy", "Terms", "Security", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: "#374151", textDecoration: "none",
              transition: "color 0.15s" }}
              onMouseEnter={e => e.target.style.color = "#9CA3AF"}
              onMouseLeave={e => e.target.style.color = "#374151"}>{l}</a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 0.6; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
