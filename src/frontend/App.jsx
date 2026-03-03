import { useState, useEffect } from "react";
import Auth from "./Auth";
import HotelIQ from "./hotel-iq-dashboard";

const API_BASE = process.env.API_BASE || "http://localhost:5000";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: validate stored token and restore session
  useEffect(() => {
    const token = localStorage.getItem("hiq-token");
    if (!token) { setLoading(false); return; }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user);
        else localStorage.removeItem("hiq-token");
      })
      .catch(() => localStorage.removeItem("hiq-token"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem("hiq-token", token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("hiq-token");
    setUser(null);
  };

  if (loading) return <LoadingScreen />;
  if (!user) return <Auth apiBase={API_BASE} onLogin={handleLogin} />;
  return <HotelIQ user={user} apiBase={API_BASE} onLogout={handleLogout} />;
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", background: "#08080A",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300&family=Montserrat:wght@300;400&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300,
          color: "#fff", letterSpacing: 2, marginBottom: 24,
        }}>
          Hotel<span style={{ color: "#C9A84C", fontStyle: "italic" }}>IQ</span>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%", background: "#C9A84C",
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    </div>
  );
}
