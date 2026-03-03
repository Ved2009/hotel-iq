import { useState } from "react";

const gold = "#C9A84C";
const dark = "#08080A";
const dark2 = "#0F0F12";

const labelStyle = {
  display: "block",
  fontSize: 10, letterSpacing: "2.5px",
  textTransform: "uppercase", color: "#666",
  marginBottom: 10, fontFamily: "'Montserrat', sans-serif", fontWeight: 400,
};
const inputStyle = {
  width: "100%", background: "transparent", border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  padding: "12px 0", color: "#fff",
  fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 300,
  outline: "none", transition: "border-color 0.3s",
  WebkitAppearance: "none",
};

export default function Auth({ apiBase, onLogin }) {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");

  // Register fields
  const [regFirst, setRegFirst] = useState("");
  const [regLast, setRegLast] = useState("");
  const [regHotel, setRegHotel] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPwd, setRegPwd] = useState("");

  const submit = async (endpoint, body) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const handleLogin = e => {
    e.preventDefault();
    submit("login", { email: loginEmail, password: loginPwd });
  };

  const handleRegister = e => {
    e.preventDefault();
    submit("register", {
      firstName: regFirst, lastName: regLast,
      hotelName: regHotel, email: regEmail, password: regPwd,
    });
  };

  return (
    <div style={{
      minHeight: "100vh", background: dark,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Tenor+Sans&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* Ambient glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,76,0.05) 0%, transparent 70%)",
      }} />

      <div style={{
        background: dark2, border: `1px solid rgba(201,168,76,0.2)`,
        padding: "60px", width: "100%", maxWidth: 460,
        position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "#fff", marginBottom: 6 }}>
          Hotel<span style={{ color: gold, fontStyle: "italic" }}>IQ</span>
        </div>
        <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "#555", marginBottom: 44 }}>
          Revenue Intelligence Platform
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 36 }}>
          {[["login", "Sign In"], ["register", "Register"]].map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setError(""); }} style={{
              padding: "12px 24px", fontSize: 11, letterSpacing: "2px",
              textTransform: "uppercase", color: tab === key ? gold : "#555",
              cursor: "pointer", background: "none", border: "none",
              borderBottom: tab === key ? `2px solid ${gold}` : "2px solid transparent",
              marginBottom: -1, fontFamily: "'Montserrat', sans-serif",
              transition: "all 0.3s", fontWeight: 400,
            }}>{label}</button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            fontSize: 12, color: "#F87171", marginBottom: 20,
            padding: "10px 14px", background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)", borderRadius: 4, letterSpacing: "0.3px",
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                placeholder="your@hotel.com" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={loginPwd} onChange={e => setLoginPwd(e.target.value)}
                placeholder="••••••••" required style={inputStyle} />
            </div>
            <button type="submit" disabled={loading} style={{
              width: "100%", background: gold, color: dark, border: "none",
              padding: "16px 40px", fontFamily: "'Montserrat', sans-serif",
              fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer", fontWeight: 500, marginTop: 8,
              opacity: loading ? 0.7 : 1, transition: "all 0.3s",
            }}>
              {loading ? "Signing in…" : "Access Dashboard"}
            </button>
            <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#444" }}>
              <a href="#" style={{ color: gold, textDecoration: "none", letterSpacing: "1px" }}>Forgot password?</a>
            </p>
          </form>
        )}

        {/* Register Form */}
        {tab === "register" && (
          <form onSubmit={handleRegister}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input type="text" value={regFirst} onChange={e => setRegFirst(e.target.value)}
                  placeholder="John" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input type="text" value={regLast} onChange={e => setRegLast(e.target.value)}
                  placeholder="Smith" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Hotel Name</label>
              <input type="text" value={regHotel} onChange={e => setRegHotel(e.target.value)}
                placeholder="The Grand Hotel" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                placeholder="john@hotel.com" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={regPwd} onChange={e => setRegPwd(e.target.value)}
                placeholder="At least 6 characters" required minLength={6} style={inputStyle} />
            </div>
            <button type="submit" disabled={loading} style={{
              width: "100%", background: gold, color: dark, border: "none",
              padding: "16px 40px", fontFamily: "'Montserrat', sans-serif",
              fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer", fontWeight: 500, marginTop: 8,
              opacity: loading ? 0.7 : 1, transition: "all 0.3s",
            }}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
