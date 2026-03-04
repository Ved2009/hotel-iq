import { useState, useEffect } from "react";
import Auth from "./Auth";
import HotelIQ from "./hotel-iq-dashboard";

const API_BASE = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? ""
  : "http://localhost:5000";

export default function App() {
  const [user, setUser]         = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab]   = useState("login");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hiq-token");
    if (!token) { setChecking(false); return; }

    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user);
        else localStorage.removeItem("hiq-token");
      })
      .catch(() => localStorage.removeItem("hiq-token"))
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem("hiq-token", token);
    setUser(userData);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("hiq-token");
    setUser(null);
  };

  const handleShowAuth = (tab = "login") => {
    setAuthTab(tab);
    setShowAuth(true);
  };

  if (checking) return <LoadingScreen />;

  return (
    <>
      <HotelIQ
        user={user}
        apiBase={API_BASE}
        onLogout={handleLogout}
        onShowAuth={handleShowAuth}
      />

      {showAuth && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowAuth(false); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(4px)",
          }}
        >
          <Auth
            apiBase={API_BASE}
            onLogin={handleLogin}
            initialTab={authTab}
            onClose={() => setShowAuth(false)}
          />
        </div>
      )}
    </>
  );
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
