"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY_NOTIFS = "teslamine_notifications";

const INITIAL_NOTIFS = [
  { id: 1, type: "mining",    title: "Mining Milestone Reached!",     body: "Your balance hit $500 — you're halfway to unlocking withdrawals!", time: Date.now() - 1000 * 60 * 5,  read: false, icon: "⛏" },
  { id: 2, type: "withdrawal",title: "Withdrawal Pending",             body: "Your withdrawal of $1,200 has been submitted and is being processed. Payment within 24 hours.", time: Date.now() - 1000 * 60 * 40, read: false, icon: "💸" },
  { id: 3, type: "referral",  title: "New Referral Joined!",           body: "James K. signed up using your referral link. You'll earn 10% of their mining rewards.", time: Date.now() - 1000 * 60 * 120, read: true,  icon: "👥" },
  { id: 4, type: "security",  title: "New Login Detected",             body: "A new login was detected from Chrome on Windows in Lagos, Nigeria.", time: Date.now() - 1000 * 3600 * 3, read: true,  icon: "🔐" },
  { id: 5, type: "system",    title: "Platform Maintenance Scheduled", body: "Scheduled maintenance on March 10, 2026 from 02:00–04:00 UTC. Mining will continue uninterrupted.", time: Date.now() - 1000 * 3600 * 24, read: true,  icon: "⚙️" },
  { id: 6, type: "mining",    title: "Daily Earnings Summary",         body: "Yesterday you earned $96.88 net after fees. Your total mined balance is now $874.32.", time: Date.now() - 1000 * 3600 * 25, read: true,  icon: "📊" },
  { id: 7, type: "referral",  title: "Referral Bonus Credited",        body: "Sofia R. mined $320 yesterday. Your 10% bonus of $32.00 has been credited to your balance.", time: Date.now() - 1000 * 3600 * 48, read: true,  icon: "💰" },
];

const TYPE_COLORS = {
  mining:     { color: "#e31937", bg: "rgba(227,25,55,0.08)",    border: "rgba(227,25,55,0.2)"    },
  withdrawal: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",   border: "rgba(245,158,11,0.2)"   },
  referral:   { color: "#00c896", bg: "rgba(0,200,150,0.08)",    border: "rgba(0,200,150,0.2)"    },
  security:   { color: "#6366f1", bg: "rgba(99,102,241,0.08)",   border: "rgba(99,102,241,0.2)"   },
  system:     { color: "#888",    bg: "rgba(255,255,255,0.04)",   border: "rgba(255,255,255,0.1)"  },
};

function timeAgo(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)   return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function TeslaLogo({ size = 32, color = "#e31937" }) {
  return (
    <img
      src="/favicon-512.png"
      alt="Tesla"
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        filter: color === "#e31937" || color === "#cc0000" || color === "#aa0000"
          ? "none"
          : color === "#222" || color === "#333" || color === "#2a0a0a" || color === "#2a2a2a"
          ? "brightness(0.15)"
          : "none",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

function useIsMobile(bp = 768) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < bp);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [bp]);
  return m;
}

export default function NotificationsCenter({ onBack }) {
  const isMobile = useIsMobile();
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);
  const [filter, setFilter] = useState("all");

  const unreadCount = notifs.filter(n => !n.read).length;

  function markRead(id) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }
  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }
  function deleteNotif(id) {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }

  const filtered = filter === "all" ? notifs : filter === "unread" ? notifs.filter(n => !n.read) : notifs.filter(n => n.type === filter);

  const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'JetBrains Mono', monospace", color: "#fff", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; border:none; outline:none; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1e1e2e; border-radius:4px; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 28px 48px" }}>

        {/* HEADER */}
        <header style={{ padding: isMobile ? "18px 0 14px" : "24px 0 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeIn 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={onBack} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#666", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>
              ← Back
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TeslaLogo size={26} color="#e31937" />
              <div>
                <div style={{ fontSize: 9, color: "#e31937", letterSpacing: 3, textTransform: "uppercase", marginBottom: 1 }}>Inbox</div>
                <h1 style={{ fontSize: isMobile ? 17 : 21, fontFamily: "'Syne',sans-serif", fontWeight: 800, letterSpacing: -0.5 }}>
                  NOTIFICATIONS {unreadCount > 0 && <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: "#e31937", fontSize: 11, fontWeight: 700, marginLeft: 8 }}>{unreadCount}</span>}
                </h1>
              </div>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.2)", color: "#00c896", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
              ✓ Mark all read
            </button>
          )}
        </header>

        {/* FILTER PILLS */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", animation: "fadeIn 0.4s ease 0.05s both" }}>
          {["all", "unread", "mining", "withdrawal", "referral", "security", "system"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s", background: filter === f ? "rgba(227,25,55,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${filter === f ? "rgba(227,25,55,0.3)" : "rgba(255,255,255,0.06)"}`, color: filter === f ? "#e31937" : "#444", textTransform: "capitalize" }}>
              {f}{f === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>

        {/* NOTIFICATIONS LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.4s ease 0.1s both" }}>
          {filtered.length === 0 ? (
            <div style={{ ...card, padding: 52, textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🔔</div>
              <div style={{ fontSize: 15, color: "#444" }}>No notifications here</div>
            </div>
          ) : filtered.map((notif) => {
            const t = TYPE_COLORS[notif.type] || TYPE_COLORS.system;
            return (
              <div key={notif.id} style={{
                background: notif.read ? "rgba(255,255,255,0.02)" : t.bg,
                border: `1px solid ${notif.read ? "rgba(255,255,255,0.05)" : t.border}`,
                borderRadius: 14, padding: "16px 18px",
                display: "flex", gap: 14, alignItems: "flex-start",
                borderLeft: notif.read ? "3px solid transparent" : `3px solid ${t.color}`,
                transition: "all 0.2s",
                cursor: "pointer",
                position: "relative",
              }}
                onClick={() => markRead(notif.id)}
              >
                {/* Icon */}
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${t.color}18`, border: `1px solid ${t.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {notif.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 5 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: notif.read ? "#888" : "#fff" }}>{notif.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: "#333" }}>{timeAgo(notif.time)}</span>
                      {!notif.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.color, animation: "pulse 2s ease-in-out infinite" }} />}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#555", lineHeight: 1.7 }}>{notif.body}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 9, color: t.color, background: `${t.color}18`, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 1 }}>{notif.type}</span>
                  </div>
                </div>

                {/* Delete */}
                <button onClick={e => { e.stopPropagation(); deleteNotif(notif.id); }} style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#333", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,68,85,0.12)"; e.currentTarget.style.color = "#ff4455"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#333"; }}
                >×</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}