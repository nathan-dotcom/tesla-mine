"use client";
import { useState, useEffect } from "react";

const FAKE_REFERRALS = [
  { name: "James K.", joined: Date.now() - 8640000 * 3,  earned: 142.5, status: "Active", avatar: "JK" },
  { name: "Sofia R.", joined: Date.now() - 8640000 * 7,  earned: 89.2,  status: "Active", avatar: "SR" },
  { name: "Chen W.",  joined: Date.now() - 8640000 * 1,  earned: 12.0,  status: "Mining", avatar: "CW" },
  { name: "Amara O.", joined: Date.now() - 8640000 * 14, earned: 310.7, status: "Active", avatar: "AO" },
];

const TIERS = [
  { name: "Bronze",  min: 0,  max: 5,   bonus: "5%",  color: "#cd7f32", icon: "🥉" },
  { name: "Silver",  min: 5,  max: 15,  bonus: "8%",  color: "#aaa",    icon: "🥈" },
  { name: "Gold",    min: 15, max: 30,  bonus: "12%", color: "#ffd700", icon: "🥇" },
  { name: "Platinum",min: 30, max: 999, bonus: "15%", color: "#e0e0ff", icon: "💎" },
];

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

export default function ReferralPage({ onBack }) {
  const [copied, setCopied] = useState(false);
  const [referrals] = useState(FAKE_REFERRALS);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const refCode = "TESLA-X9F4K2";
  const refLink = `https://teslamine.io/join?ref=${refCode}`;
  const totalEarned = referrals.reduce((s, r) => s + r.earned, 0);
  const totalRef = referrals.length;
  const currentTier = TIERS.find(t => totalRef >= t.min && totalRef < t.max) || TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];

  const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'JetBrains Mono', monospace", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        button{cursor:pointer;border:none;outline:none}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e1e2e;border-radius:4px}
      `}</style>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 28px 48px" }}>
        <header style={{ padding: isMobile ? "18px 0 14px" : "24px 0 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#666", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>← Back</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TeslaLogo size={28} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 1 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffd700", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 9, color: "#ffd700", letterSpacing: 3, textTransform: "uppercase" }}>Referral Programme</span>
              </div>
              <h1 style={{ fontSize: isMobile ? 18 : 22, fontFamily: "'Syne',sans-serif", fontWeight: 800, letterSpacing: -0.5 }}>REFER <span style={{ color: "#2a2a2a", fontSize: 14, fontWeight: 400 }}>/ Earn</span></h1>
            </div>
          </div>
        </header>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Referrals", value: totalRef,              color: "#e31937", bg: "rgba(227,25,55,0.07)" },
            { label: "Bonus Earned",    value: `$${totalEarned.toFixed(2)}`, color: "#ffd700", bg: "rgba(255,215,0,0.07)" },
            { label: "Current Tier",    value: currentTier.name,      color: currentTier.color, bg: "rgba(255,255,255,0.02)" },
            { label: "Bonus Rate",      value: currentTier.bonus,     color: "#00c896", bg: "rgba(0,200,150,0.07)" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ ...card, padding: "14px 16px", background: bg }}>
              <div style={{ fontSize: 9, color: "#444", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color, fontFamily: "'Syne',sans-serif" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* REFERRAL LINK */}
        <div style={{ ...card, padding: isMobile ? 20 : 28, marginBottom: 20, background: "rgba(255,215,0,0.03)", border: "1px solid rgba(255,215,0,0.12)" }}>
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔗</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 6 }}>Your Referral Link</h2>
            <p style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>Share this link and earn <span style={{ color: "#ffd700" }}>{currentTier.bonus}</span> of every friend's mining earnings — forever.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "13px 16px", fontSize: isMobile ? 10 : 12, color: "#ccc", wordBreak: "break-all" }}>{refLink}</div>
            <button onClick={() => { navigator.clipboard.writeText(refLink).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2500); }}
              style={{ flexShrink: 0, padding: "13px 18px", borderRadius: 12, background: copied ? "rgba(0,200,150,0.12)" : "rgba(255,215,0,0.1)", border: `1px solid ${copied ? "rgba(0,200,150,0.3)" : "rgba(255,215,0,0.25)"}`, color: copied ? "#00c896" : "#ffd700", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s" }}>
              {copied ? "✓ Copied!" : "📋 Copy"}
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ padding: "8px 20px", borderRadius: 30, background: "rgba(227,25,55,0.08)", border: "1px solid rgba(227,25,55,0.2)", fontSize: 12, fontWeight: 700, color: "#e31937", letterSpacing: 2 }}>Code: {refCode}</div>
          </div>
        </div>

        {/* TIER SYSTEM */}
        <div style={{ ...card, padding: isMobile ? 20 : 28, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Tier System</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
            {TIERS.map(tier => {
              const active = tier.name === currentTier.name;
              return (
                <div key={tier.name} style={{ background: active ? `${tier.color}12` : "rgba(255,255,255,0.02)", border: `1px solid ${active ? tier.color + "44" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, padding: "18px 14px", textAlign: "center", boxShadow: active ? `0 0 24px ${tier.color}18` : "none" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{tier.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: active ? tier.color : "#555", fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>{tier.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: active ? "#fff" : "#333", marginBottom: 4 }}>{tier.bonus}</div>
                  <div style={{ fontSize: 10, color: "#444" }}>{tier.min}–{tier.max === 999 ? "∞" : tier.max} referrals</div>
                  {active && <div style={{ marginTop: 8, fontSize: 9, color: tier.color, letterSpacing: 1.5, textTransform: "uppercase" }}>● Current</div>}
                </div>
              );
            })}
          </div>
          {nextTier && (
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "#555" }}>Progress to {nextTier.name}</span>
                <span style={{ fontSize: 11, color: "#ccc" }}>{totalRef} / {nextTier.min}</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min((totalRef / nextTier.min) * 100, 100)}%`, background: `linear-gradient(90deg,${currentTier.color},${nextTier.color})`, borderRadius: 3 }} />
              </div>
            </div>
          )}
        </div>

        {/* REFERRALS LIST */}
        <div style={{ ...card, padding: isMobile ? 16 : 24, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 }}>Your Referrals ({referrals.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {referrals.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(227,25,55,0.12)", border: "1px solid rgba(227,25,55,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#e31937", flexShrink: 0 }}>{r.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: "#444" }}>Joined {new Date(r.joined).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#ffd700" }}>+${r.earned.toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: r.status === "Active" ? "#00c896" : "#6366f1", marginTop: 2 }}>● {r.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ ...card, padding: isMobile ? 20 : 28 }}>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>How It Works</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {[
              { step: "01", icon: "🔗", title: "Share Your Link", desc: "Copy your unique referral link and share it with friends or on social media." },
              { step: "02", icon: "⛏️", title: "They Mine",       desc: "When your referral signs up and starts mining, you earn a % of their earnings." },
              { step: "03", icon: "💰", title: "You Earn",        desc: "Bonuses are credited to your balance daily — no cap, earn forever!" },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: "18px 16px", position: "relative" }}>
                <div style={{ position: "absolute", top: 14, right: 14, fontSize: 11, color: "#1a1a1a", fontWeight: 700 }}>{step}</div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6, fontFamily: "'Syne',sans-serif" }}>{title}</div>
                <div style={{ fontSize: 11, color: "#555", lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}