import { useState } from "react";

export default function Auth({ apiBase, onLogin, initialTab = "login", onBack }) {
  const [tab, setTab]       = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd,   setLoginPwd]   = useState("");
  const [regFirst,   setRegFirst]   = useState("");
  const [regLast,    setRegLast]    = useState("");
  const [regHotel,   setRegHotel]   = useState("");
  const [regEmail,   setRegEmail]   = useState("");
  const [regPwd,     setRegPwd]     = useState("");

  const submit = async (endpoint, body) => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${apiBase}/api/auth/${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, type = "text", value, onChange, placeholder, required, minLength }) => (
    <div style={{ marginBottom: 22 }}>
      <label style={{ display: "block", fontSize: 11, letterSpacing: "1.5px",
        textTransform: "uppercase", color: "#4B5563", marginBottom: 8,
        fontFamily: "'Space Mono', monospace" }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required} minLength={minLength}
        style={{
          width: "100%", background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 8, padding: "12px 14px", color: "#E2E8F0",
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={e  => e.target.style.borderColor = "rgba(75,142,245,0.5)"}
        onBlur={e   => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
      />
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#06090F",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "40px 20px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* Background glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(75,142,245,0.07) 0%, transparent 70%)",
      }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 460 }}>
        {/* Back to landing */}
        {onBack && (
          <button onClick={onBack} style={{
            background: "transparent", border: "none", color: "#374151",
            fontSize: 13, cursor: "pointer", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "'DM Sans', sans-serif", padding: 0,
          }}>
            ← Back to Hotel IQ
          </button>
        )}

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "44px 44px 40px",
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24,
              letterSpacing: -0.5, marginBottom: 4 }}>
              Hotel<span style={{ color: "#C9A55A" }}>IQ</span>
            </div>
            <div style={{ fontSize: 13, color: "#4B5563" }}>
              {tab === "login" ? "Sign in to your revenue dashboard" : "Create your free account"}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", marginBottom: 32,
            borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {[["login","Sign In"], ["register","Register"]].map(([key, label]) => (
              <button key={key} onClick={() => { setTab(key); setError(""); }} style={{
                padding: "10px 20px", fontSize: 13, fontWeight: 500,
                color: tab === key ? "#E2E8F0" : "#4B5563",
                cursor: "pointer", background: "none", border: "none",
                borderBottom: tab === key ? "2px solid #4B8EF5" : "2px solid transparent",
                marginBottom: -1, fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
              }}>{label}</button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontSize: 13, color: "#EF4444", marginBottom: 20,
              padding: "10px 14px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8,
            }}>{error}</div>
          )}

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={e => { e.preventDefault(); submit("login", { email: loginEmail, password: loginPwd }); }}>
              <Field label="Email Address" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="you@hotel.com" required />
              <Field label="Password" type="password" value={loginPwd} onChange={setLoginPwd} placeholder="••••••••" required />
              <button type="submit" disabled={loading} style={{
                width: "100%", background: loading ? "rgba(75,142,245,0.5)" : "linear-gradient(135deg, #4B8EF5, #2563EB)",
                border: "none", color: "#fff", padding: "13px",
                borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                marginTop: 6, letterSpacing: 0.3,
              }}>
                {loading ? "Signing in…" : "Access Dashboard"}
              </button>
              <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#374151" }}>
                <a href="#" style={{ color: "#4B8EF5", textDecoration: "none" }}>Forgot password?</a>
              </p>
            </form>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <form onSubmit={e => {
              e.preventDefault();
              submit("register", { firstName: regFirst, lastName: regLast, hotelName: regHotel, email: regEmail, password: regPwd });
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="First Name" value={regFirst} onChange={setRegFirst} placeholder="Jane" required />
                <Field label="Last Name"  value={regLast}  onChange={setRegLast}  placeholder="Smith" />
              </div>
              <Field label="Hotel Name"     value={regHotel}  onChange={setRegHotel}  placeholder="The Grand Hotel" required />
              <Field label="Email Address"  type="email"    value={regEmail}  onChange={setRegEmail}  placeholder="jane@hotel.com" required />
              <Field label="Password"       type="password" value={regPwd}    onChange={setRegPwd}    placeholder="At least 6 characters" required minLength={6} />
              <button type="submit" disabled={loading} style={{
                width: "100%", background: loading ? "rgba(75,142,245,0.5)" : "linear-gradient(135deg, #4B8EF5, #2563EB)",
                border: "none", color: "#fff", padding: "13px",
                borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginTop: 4,
              }}>
                {loading ? "Creating account…" : "Create Free Account"}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#1F2937" }}>
          By continuing you agree to Hotel IQ's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
