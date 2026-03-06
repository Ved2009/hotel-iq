import { useState, useEffect } from "react";
import Landing from "./Landing";
import Auth from "./Auth";
import HotelIQ from "./hotel-iq-dashboard";

const API_BASE = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? ""
  : "http://localhost:5000";

// view: "loading" | "landing" | "app"
export default function App() {
  const [view, setView]         = useState("loading");
  const [user, setUser]         = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab]   = useState("login");

  useEffect(() => {
    const token = localStorage.getItem("hiq-token");
    if (!token) { setView("landing"); return; }

    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.user) { setUser(data.user); setView("app"); }
        else { localStorage.removeItem("hiq-token"); setView("landing"); }
      })
      .catch(() => { localStorage.removeItem("hiq-token"); setView("landing"); });
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem("hiq-token", token);
    setUser(userData);
    setShowAuth(false);
    setView("app");
  };

  const handleLogout = () => {
    localStorage.removeItem("hiq-token");
    setUser(null);
    setView("landing");
  };

  // Opens auth modal; if on landing, first transition to dashboard (demo mode)
  const handleShowAuth = (tab = "login") => {
    setAuthTab(tab);
    setShowAuth(true);
    if (view === "landing") setView("app");
  };

  const AuthModal = showAuth && (
    <div
      onClick={e => { if (e.target === e.currentTarget) setShowAuth(false); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(6px)",
      }}
    >
      <Auth
        apiBase={API_BASE}
        onLogin={handleLogin}
        initialTab={authTab}
        onClose={() => setShowAuth(false)}
      />
    </div>
  );

  if (view === "loading") return <LoadingScreen />;

  if (view === "landing") return (
    <>
      <Landing
        onSignIn={() => handleShowAuth("login")}
        onGetStarted={() => handleShowAuth("register")}
      />
      {AuthModal}
    </>
  );

  return (
    <>
      <HotelIQ
        user={user}
        apiBase={API_BASE}
        onLogout={handleLogout}
        onShowAuth={handleShowAuth}
      />
      {AuthModal}
    </>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", background: "#030712",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800,
          color: "#fff", letterSpacing: -0.5, marginBottom: 28 }}>
          Hotel<span style={{ color: "#F59E0B" }}>IQ</span>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%", background: "#6366F1",
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
      </div>
    </div>
  );
}
