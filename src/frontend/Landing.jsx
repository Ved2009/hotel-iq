export default function Landing({ onSignIn, onGetStarted }) {
  const NAV_LINKS = ["Platform", "Features", "Pricing", "About"];

  const STATS = [
    { value: "2,400+", label: "Hotels Worldwide" },
    { value: "94.2%", label: "Forecast Accuracy" },
    { value: "+18%", label: "Avg RevPAR Lift" },
    { value: "$4.2M", label: "Avg Annual Revenue Gain" },
  ];

  const FEATURES = [
    {
      icon: "◈",
      title: "AI Dynamic Pricing",
      desc: "Automatically adjusts room rates 24/7 based on real-time demand signals, comp set movements, and historical patterns.",
      color: "#4B8EF5",
    },
    {
      icon: "⌇",
      title: "Demand Forecasting",
      desc: "14-day demand predictions trained on 90 days of history. Event detection, confidence intervals, segment-level outlook.",
      color: "#10B981",
    },
    {
      icon: "⊞",
      title: "Comp Set Intelligence",
      desc: "Real-time competitor rate tracking with rate history, market position ranking, and AI-recommended rate adjustments.",
      color: "#C9A55A",
    },
    {
      icon: "▦",
      title: "Revenue Calendar",
      desc: "Visual monthly heatmap showing daily occupancy, ADR, and revenue. Identify opportunities and risk at a glance.",
      color: "#8B5CF6",
    },
    {
      icon: "≋",
      title: "Segment & Channel Analysis",
      desc: "Break down revenue by Leisure, Business, Group, and OTA. Understand which channels are driving profit.",
      color: "#F59E0B",
    },
    {
      icon: "≡",
      title: "Automated Reports",
      desc: "Monthly summaries, comp analysis, pickup reports — generated automatically and ready to share with ownership.",
      color: "#14B8A6",
    },
  ];

  const TESTIMONIALS = [
    {
      quote: "Hotel IQ increased our RevPAR by 22% in the first quarter. The demand forecasting is eerily accurate.",
      name: "Sarah Mitchell",
      role: "Director of Revenue, The Grand Coastal",
    },
    {
      quote: "We replaced three separate tools with Hotel IQ. The comp set intelligence alone is worth it.",
      name: "James Thornton",
      role: "VP Revenue Management, Meridian Hotels",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#06090F", color: "#E2E8F0", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* ── Navigation ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(6,9,15,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 60px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "linear-gradient(135deg, #C9A55A, #4B8EF5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif",
          }}>IQ</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>
            Hotel<span style={{ color: "#C9A55A" }}>IQ</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: 36 }}>
          {NAV_LINKS.map(l => (
            <a key={l} href="#" style={{ fontSize: 14, color: "#4B5563", textDecoration: "none",
              fontWeight: 500, transition: "color 0.15s" }}
              onMouseEnter={e => e.target.style.color = "#E2E8F0"}
              onMouseLeave={e => e.target.style.color = "#4B5563"}>
              {l}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={onSignIn} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
            color: "#9CA3AF", padding: "8px 18px", borderRadius: 8, cursor: "pointer",
            fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.target.style.borderColor = "rgba(255,255,255,0.25)"; e.target.style.color = "#E2E8F0"; }}
            onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.color = "#9CA3AF"; }}>
            Sign In
          </button>
          <button onClick={onGetStarted} style={{
            background: "linear-gradient(135deg, #4B8EF5, #2563EB)",
            border: "none", color: "#fff", padding: "8px 20px", borderRadius: 8,
            cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 4px 14px rgba(75,142,245,0.3)",
          }}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: "110px 60px 80px", maxWidth: 1280, margin: "0 auto", position: "relative" }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 900, height: 600, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(75,142,245,0.08) 0%, transparent 70%)",
        }} />

        <div style={{ position: "relative", textAlign: "center", maxWidth: 860, margin: "0 auto" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(75,142,245,0.1)", border: "1px solid rgba(75,142,245,0.25)",
            borderRadius: 100, padding: "6px 16px", marginBottom: 32,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4B8EF5",
              boxShadow: "0 0 8px #4B8EF5" }} />
            <span style={{ fontSize: 12, color: "#4B8EF5", fontFamily: "'Space Mono', monospace",
              letterSpacing: 1.5, textTransform: "uppercase" }}>AI-Powered Revenue Management</span>
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: "clamp(42px, 6vw, 72px)",
            fontWeight: 800, lineHeight: 1.05, letterSpacing: -2,
            margin: "0 0 24px", color: "#fff",
          }}>
            Maximize Every Room.
            <br />
            <span style={{ color: "#C9A55A" }}>Beat Every Competitor.</span>
          </h1>

          <p style={{
            fontSize: 18, color: "#6B7280", lineHeight: 1.75,
            margin: "0 auto 40px", maxWidth: 600,
          }}>
            Hotel IQ combines AI demand forecasting, real-time dynamic pricing, and
            competitive intelligence to help hotels consistently outperform their market.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 48 }}>
            <button onClick={onGetStarted} style={{
              background: "linear-gradient(135deg, #4B8EF5, #2563EB)",
              border: "none", color: "#fff", padding: "14px 32px",
              borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 4px 24px rgba(75,142,245,0.35)", transition: "all 0.2s",
            }}>
              Get Started Free →
            </button>
            <button onClick={onSignIn} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)", color: "#9CA3AF",
              padding: "14px 32px", borderRadius: 10, cursor: "pointer",
              fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
            }}>
              Sign In to Dashboard
            </button>
          </div>

          <p style={{ fontSize: 13, color: "#374151", fontFamily: "'Space Mono', monospace",
            letterSpacing: 0.5 }}>
            No credit card required · Free 14-day trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        padding: "36px 60px",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20,
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800,
                color: "#fff", letterSpacing: -1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#4B5563", fontFamily: "'Space Mono', monospace",
                letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "100px 60px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 11, color: "#4B8EF5", fontFamily: "'Space Mono', monospace",
            letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>Platform Features</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 40, fontWeight: 800,
            margin: 0, letterSpacing: -1, color: "#fff" }}>
            Everything a revenue manager needs.
          </h2>
          <p style={{ color: "#4B5563", fontSize: 16, marginTop: 16, lineHeight: 1.7 }}>
            Built by hoteliers, powered by AI. Hotel IQ replaces fragmented tools with one intelligent platform.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "28px 28px 32px",
              transition: "border-color 0.2s, transform 0.2s",
              cursor: "default",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${f.color}40`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.transform = "translateY(0)";
              }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 20,
                background: `${f.color}18`, border: `1px solid ${f.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, color: f.color,
              }}>{f.icon}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16,
                color: "#fff", marginBottom: 10 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.75 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{
        padding: "80px 60px",
        background: "rgba(255,255,255,0.02)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "32px 36px",
            }}>
              <div style={{ fontSize: 28, color: "#C9A55A", marginBottom: 16, lineHeight: 1 }}>"</div>
              <p style={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.8, margin: "0 0 24px", fontStyle: "italic" }}>
                {t.quote}
              </p>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#E2E8F0" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#4B5563", marginTop: 3 }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section style={{ padding: "100px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700, height: 400, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,165,90,0.06) 0%, transparent 70%)",
        }} />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800,
            letterSpacing: -1.5, color: "#fff", margin: "0 0 20px", lineHeight: 1.1 }}>
            Ready to outperform<br />your market?
          </h2>
          <p style={{ color: "#4B5563", fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            Join 2,400+ hotels using Hotel IQ to make smarter revenue decisions every day.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            <button onClick={onGetStarted} style={{
              background: "linear-gradient(135deg, #4B8EF5, #2563EB)",
              border: "none", color: "#fff", padding: "15px 36px",
              borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 4px 28px rgba(75,142,245,0.35)",
            }}>
              Create Free Account →
            </button>
            <button onClick={onSignIn} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              color: "#6B7280", padding: "15px 36px", borderRadius: 10, cursor: "pointer",
              fontSize: 15, fontFamily: "'DM Sans', sans-serif",
            }}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7,
            background: "linear-gradient(135deg, #C9A55A, #4B8EF5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif" }}>IQ</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }}>
            Hotel<span style={{ color: "#C9A55A" }}>IQ</span>
          </span>
          <span style={{ fontSize: 12, color: "#1F2937", marginLeft: 8 }}>
            © {new Date().getFullYear()} Hotel IQ. All rights reserved.
          </span>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {["Privacy", "Terms", "Security", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: "#374151", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
