"use client";
import { useState, useEffect } from "react";

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

const PLANS = [
  { id: "starter",    name: "Starter",    min: 100,   max: 999,    dailyRate: 0.012, color: "#888",    badge: "🌱", features: ["Basic hashrate", "BTC mining only", "Standard support"] },
  { id: "growth",     name: "Growth",     min: 1000,  max: 4999,   dailyRate: 0.018, color: "#6366f1", badge: "🚀", features: ["2x hashrate boost", "BTC + ETH mining", "Priority support"] },
  { id: "pro",        name: "Pro",        min: 5000,  max: 19999,  dailyRate: 0.024, color: "#e31937", badge: "⚡", features: ["5x hashrate boost", "All coins", "24/7 VIP support", "Auto-reinvest"] },
  { id: "enterprise", name: "Enterprise", min: 20000, max: 999999, dailyRate: 0.032, color: "#ffd700", badge: "👑", features: ["10x hashrate boost", "All coins + new launches", "Dedicated manager", "Priority payouts", "Custom contracts"] },
];

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

function AnimatedNumber({ value, prefix = "$", decimals = 2 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display;
    const end = value;
    const duration = 600;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{prefix}{display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

export default function EarningsCalculator({ onBack, onInvest }) {
  const isMobile = useIsMobile();
  const [investment, setInvestment] = useState(1000);
  const [duration, setDuration] = useState(30);
  const [selectedPlan, setSelectedPlan] = useState("growth");

  const plan = PLANS.find(p => p.id === selectedPlan);
  const dailyEarnings = investment * plan.dailyRate;
  const totalEarnings = dailyEarnings * duration;
  const roi = (totalEarnings / investment) * 100;
  const totalReturn = investment + totalEarnings;

  const card = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    backdropFilter: "blur(12px)",
  };

  const projections = [
    { label: "7 Days",   value: dailyEarnings * 7 },
    { label: "30 Days",  value: dailyEarnings * 30 },
    { label: "90 Days",  value: dailyEarnings * 90 },
    { label: "1 Year",   value: dailyEarnings * 365 },
  ];

  const barMax = dailyEarnings * 365;

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'JetBrains Mono', monospace", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(227,25,55,0.2)} 50%{box-shadow:0 0 40px rgba(227,25,55,0.5)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; border:none; outline:none; }
        input[type=range] { -webkit-appearance:none; width:100%; height:4px; border-radius:2px; background:rgba(255,255,255,0.08); outline:none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:linear-gradient(135deg,#aa0000,#e31937); cursor:pointer; box-shadow:0 0 10px rgba(227,25,55,0.5); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1e1e2e; border-radius:4px; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 28px 48px" }}>

        {/* HEADER */}
        <header style={{ padding: isMobile ? "18px 0 14px" : "24px 0 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, animation: "fadeIn 0.4s ease" }}>
          <button onClick={onBack} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#666", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>
            ← Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TeslaLogo size={28} color="#e31937" />
            <div>
              <div style={{ fontSize: 9, color: "#e31937", letterSpacing: 3, textTransform: "uppercase", marginBottom: 1 }}>Project Your Returns</div>
              <h1 style={{ fontSize: isMobile ? 18 : 22, fontFamily: "'Syne',sans-serif", fontWeight: 800, letterSpacing: -0.5 }}>
                EARNINGS <span style={{ color: "#e31937" }}>CALCULATOR</span>
              </h1>
            </div>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 20, animation: "fadeIn 0.5s ease 0.1s both" }}>

          {/* LEFT — Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Plan selector */}
            <div style={{ ...card, padding: 24 }}>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Select Mining Plan</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {PLANS.map(p => (
                  <button key={p.id} onClick={() => setSelectedPlan(p.id)} style={{
                    padding: "14px 16px", borderRadius: 13, textAlign: "left",
                    background: selectedPlan === p.id ? `${p.color}14` : "rgba(255,255,255,0.02)",
                    border: `1.5px solid ${selectedPlan === p.id ? p.color + "55" : "rgba(255,255,255,0.06)"}`,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{p.badge}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: selectedPlan === p.id ? "#fff" : "#555", marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: p.color, fontWeight: 700 }}>{(p.dailyRate * 100).toFixed(1)}%/day</div>
                    <div style={{ fontSize: 9, color: "#333", marginTop: 2 }}>Min ${p.min.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Investment slider */}
            <div style={{ ...card, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase" }}>Investment Amount</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: plan.color, fontFamily: "'Syne',sans-serif" }}>
                  ${investment.toLocaleString()}
                </div>
              </div>
              <input type="range" min={plan.min} max={plan.max > 50000 ? 50000 : plan.max} value={Math.max(investment, plan.min)} step={plan.min < 1000 ? 50 : 500}
                onChange={e => setInvestment(Number(e.target.value))}
                style={{ accentColor: plan.color }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 10, color: "#333" }}>${plan.min.toLocaleString()}</span>
                <span style={{ fontSize: 10, color: "#333" }}>${(plan.max > 50000 ? 50000 : plan.max).toLocaleString()}</span>
              </div>

              {/* Quick amounts */}
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {[plan.min, plan.min * 2, plan.min * 5, plan.min * 10].map(v => (
                  <button key={v} onClick={() => setInvestment(v)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, background: investment === v ? `${plan.color}18` : "rgba(255,255,255,0.04)", border: `1px solid ${investment === v ? plan.color + "44" : "rgba(255,255,255,0.06)"}`, color: investment === v ? plan.color : "#444", cursor: "pointer", transition: "all 0.15s" }}>
                    ${v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration slider */}
            <div style={{ ...card, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase" }}>Mining Duration</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif" }}>
                  {duration} <span style={{ fontSize: 13, color: "#555" }}>days</span>
                </div>
              </div>
              <input type="range" min={1} max={365} value={duration} step={1}
                onChange={e => setDuration(Number(e.target.value))}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 10, color: "#333" }}>1 day</span>
                <span style={{ fontSize: 10, color: "#333" }}>365 days</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {[7, 30, 90, 180, 365].map(d => (
                  <button key={d} onClick={() => setDuration(d)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, background: duration === d ? "rgba(227,25,55,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${duration === d ? "rgba(227,25,55,0.3)" : "rgba(255,255,255,0.06)"}`, color: duration === d ? "#e31937" : "#444", cursor: "pointer", transition: "all 0.15s" }}>
                    {d === 365 ? "1yr" : `${d}d`}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan features */}
            <div style={{ ...card, padding: 20, background: `${plan.color}08`, border: `1px solid ${plan.color}22` }}>
              <div style={{ fontSize: 10, color: plan.color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>{plan.badge} {plan.name} Plan Features</div>
              {plan.features.map(f => (
                <div key={f} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <span style={{ color: plan.color, fontSize: 11, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 11, color: "#888" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Main result card */}
            <div style={{ ...card, padding: 26, background: `${plan.color}08`, border: `1.5px solid ${plan.color}33`, position: "relative", overflow: "hidden", animation: "glow 3s ease-in-out infinite" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${plan.color},transparent)` }} />
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Estimated Total Profit</div>
                <div style={{ fontSize: 44, fontWeight: 800, color: plan.color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>
                  <AnimatedNumber value={totalEarnings} prefix="$" decimals={2} />
                </div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>over {duration} days</div>
              </div>

              {[
                { label: "Investment",    value: `$${investment.toLocaleString()}`,         color: "#888" },
                { label: "Daily Profit",  value: `$${dailyEarnings.toFixed(2)}/day`,         color: "#ccc" },
                { label: "Total Return",  value: `$${totalReturn.toFixed(2)}`,               color: "#fff", bold: true },
                { label: "ROI",           value: `${roi.toFixed(1)}%`,                       color: plan.color, bold: true },
              ].map(({ label, value, color, bold }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 12, color: "#444" }}>{label}</span>
                  <span style={{ fontSize: 13, color, fontWeight: bold ? 700 : 500 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Projection bars */}
            <div style={{ ...card, padding: 20 }}>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Earnings Projections</div>
              {projections.map(({ label, value }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#555" }}>{label}</span>
                    <span style={{ fontSize: 12, color: "#00c896", fontWeight: 700 }}>${value.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min((value / barMax) * 100, 100)}%`,
                      background: `linear-gradient(90deg,${plan.color}88,${plan.color})`,
                      borderRadius: 3, transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div style={{ ...card, padding: 16, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}>
              <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>⚠ Disclaimer</div>
              <div style={{ fontSize: 10, color: "#665510", lineHeight: 1.7 }}>
                Projections are estimates based on current network conditions and hashrate. Actual earnings may vary. Cryptocurrency mining involves risk. Past performance does not guarantee future results.
              </div>
            </div>

            <button
              onClick={() => onInvest && onInvest({ planId: selectedPlan, amount: investment })}
              style={{
                width: "100%", padding: "15px 0", borderRadius: 12,
                background: `linear-gradient(135deg,${plan.color}aa,${plan.color})`,
                color: plan.color === "#ffd700" ? "#000" : "#fff",
                fontWeight: 800, fontSize: 14, fontFamily: "'Syne',sans-serif",
                boxShadow: `0 4px 24px ${plan.color}44`,
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              Start Mining with {plan.name} Plan →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}