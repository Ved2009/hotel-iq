import { useState, useEffect } from "react";
import Landing from "./Landing";
import Auth from "./Auth";
import HotelIQ from "./hotel-iq-dashboard";

const API_BASE = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? ""
  : "http://localhost:5000";

// view: "landing" | "auth" | "app" | "loading"
export default function App() {
  const [view, setView]   = useState("loading");
  const [authTab, setAuthTab] = useState("login"); // which tab Auth opens on
  const [user, setUser]   = useState(null);

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
    setView("app");
  };

  const handleLogout = () => {
    localStorage.removeItem("hiq-token");
    setUser(null);
    setView("landing");
  };

  const goToAuth = (tab = "login") => {
    setAuthTab(tab);
    setView("auth");
  };

  if (view === "loading") return <LoadingScreen />;
  if (view === "landing") return (
    <Landing
      onSignIn={() => goToAuth("login")}
      onGetStarted={() => goToAuth("register")}
    />
  );
  if (view === "auth") return (
    <Auth
      apiBase={API_BASE}
      onLogin={handleLogin}
      initialTab={authTab}
      onBack={() => setView("landing")}
    />
  );
  return <HotelIQ user={user} apiBase={API_BASE} onLogout={handleLogout} />;
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", background: "#06090F",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800,
          color: "#fff", letterSpacing: -0.5, marginBottom: 28 }}>
          Hotel<span style={{ color: "#C9A55A" }}>IQ</span>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%", background: "#4B8EF5",
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
      </div>
    </div>
  );
}
