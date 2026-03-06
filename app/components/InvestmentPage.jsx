"use client";
import { useState, useEffect } from "react";

const PLANS = [
  { id: "starter",    name: "Starter",    min: 100,   max: 999,    daily: 1.2, duration: "Unlimited", color: "#888",    icon: "🌱", features: ["1.2% daily return", "Basic hashrate", "BTC mining only", "Standard support"] },
  { id: "growth",     name: "Growth",     min: 1000,  max: 4999,   daily: 1.8, duration: "Unlimited", color: "#6366f1", icon: "🚀", features: ["1.8% daily return", "2× hashrate boost", "BTC + ETH mining", "Priority support", "Referral bonus: 8%"] },
  { id: "pro",        name: "Pro",        min: 5000,  max: 19999,  daily: 2.5, duration: "Unlimited", color: "#e31937", icon: "⚡", popular: true, features: ["2.5% daily return", "5× hashrate boost", "All coins", "24/7 VIP support", "Referral bonus: 12%", "Auto-reinvest"] },
  { id: "enterprise", name: "Enterprise", min: 20000, max: 999999, daily: 3.2, duration: "Unlimited", color: "#ffd700", icon: "👑", features: ["3.2% daily return", "10× hashrate boost", "All coins + new launches", "Dedicated manager", "Referral bonus: 15%", "Priority payouts"] },
];

const CRYPTO = [
  { id: "btc",  name: "Bitcoin",    symbol: "BTC",  color: "#f7931a", icon: "₿",  addr: "1G3mwdjDKdh9q5r55Ryr3iTVKW3gZ9gxAw" },
  { id: "eth",  name: "Ethereum",   symbol: "ETH",  color: "#627eea", icon: "Ξ",  addr: "0x55cfe95453a9fad990290aae7af8c0cf791e2a35" },
  { id: "usdt", name: "USDT TRC20", symbol: "USDT", color: "#26a17b", icon: "₮",  addr: "TGuQrmGpKFBkUFticKpsmG4trCM25nRHZC" },
  { id: "sol",  name: "Solana",     symbol: "SOL",  color: "#9945ff", icon: "◎",  addr: "45mE67qg2vMs3Gw7rKXmStjTqvnW5D8GCEgpx7xhoB76" },
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

export default function InvestmentPage({ onBack, initialPlan, initialAmount }) {
  // Validate initialPlan against known IDs — fall back to "pro" if unrecognised
  const validIds = ["starter", "growth", "pro", "enterprise"];
  const safePlan = validIds.includes(initialPlan) ? initialPlan : "pro";

  const [selectedPlan, setSelectedPlan] = useState(safePlan);
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : "");
  // If coming from calculator, skip plan selection and go straight to deposit
  const [step, setStep] = useState(initialPlan && initialAmount ? 2 : 1);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const plan = PLANS.find(p => p.id === selectedPlan);
  const crypto = CRYPTO.find(c => c.id === selectedCrypto);
  const projectedDaily = parseFloat(amount) ? (parseFloat(amount) * plan.daily / 100).toFixed(2) : "0.00";
  const projectedMonthly = parseFloat(amount) ? (parseFloat(amount) * plan.daily / 100 * 30).toFixed(2) : "0.00";
  const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'JetBrains Mono', monospace", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,200,150,0.1)}50%{box-shadow:0 0 40px rgba(0,200,150,0.25)}}
        *{box-sizing:border-box;margin:0;padding:0}
        button{cursor:pointer;border:none;outline:none}
        input[type=number]{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-family:'JetBrains Mono',monospace;padding:11px 14px 11px 28px;font-size:15px;width:100%;outline:none}
        input:focus{border-color:rgba(227,25,55,0.5)}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e1e2e;border-radius:4px}
      `}</style>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 28px 48px" }}>
        <header style={{ padding: isMobile ? "18px 0 14px" : "24px 0 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
          {step === 2 ? (
            <button onClick={() => setStep(1)} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#666", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>← Back</button>
          ) : (
            <button onClick={onBack} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#666", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>← Back</button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <TeslaLogo size={28} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 1 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00c896", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 9, color: "#00c896", letterSpacing: 3, textTransform: "uppercase" }}>Investment</span>
              </div>
              <h1 style={{ fontSize: isMobile ? 18 : 22, fontFamily: "'Syne',sans-serif", fontWeight: 800, letterSpacing: -0.5 }}>DEPOSIT <span style={{ color: "#2a2a2a", fontSize: 14, fontWeight: 400 }}>/ Plans</span></h1>
            </div>
          </div>
          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: step >= s ? "rgba(0,200,150,0.15)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${step >= s ? "#00c896" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: step >= s ? "#00c896" : "#333" }}>{step > s ? "✓" : s}</div>
                {s < 2 && <div style={{ width: 20, height: 2, background: step > s ? "#00c896" : "rgba(255,255,255,0.08)", borderRadius: 1 }} />}
              </div>
            ))}
          </div>
        </header>

        {/* STEP 1 — PLAN SELECTION */}
        {step === 1 && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Choose Your Mining Plan</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
              {PLANS.map(p => (
                <div key={p.id} onClick={() => setSelectedPlan(p.id)} style={{ position: "relative", background: selectedPlan === p.id ? `${p.color}0f` : "rgba(255,255,255,0.02)", border: `1.5px solid ${selectedPlan === p.id ? p.color + "55" : "rgba(255,255,255,0.06)"}`, borderRadius: 18, padding: "22px 16px", cursor: "pointer", transition: "all 0.25s", boxShadow: selectedPlan === p.id ? `0 0 30px ${p.color}18` : "none" }}>
                  {p.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", padding: "3px 12px", borderRadius: 20, background: "linear-gradient(90deg,#aa0000,#e31937)", fontSize: 9, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", letterSpacing: 1 }}>MOST POPULAR</div>}
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>{p.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: p.color, fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: selectedPlan === p.id ? "#fff" : "#555", fontFamily: "'Syne',sans-serif" }}>{p.daily}%</div>
                    <div style={{ fontSize: 10, color: "#444", marginBottom: 8 }}>daily return</div>
                    <div style={{ fontSize: 11, color: "#555" }}>${p.min.toLocaleString()}+</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {p.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <span style={{ color: p.color, fontSize: 10, flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: 10, color: selectedPlan === p.id ? "#888" : "#444", lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  {selectedPlan === p.id && <div style={{ marginTop: 12, fontSize: 10, color: p.color, textAlign: "center", fontWeight: 700 }}>● Selected</div>}
                </div>
              ))}
            </div>

            {/* Amount + preview */}
            <div style={{ ...card, padding: isMobile ? 20 : 28 }}>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 }}>Investment Amount</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555", fontWeight: 700, fontSize: 15 }}>$</span>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Min. $${plan.min.toLocaleString()}`} min={plan.min} />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[plan.min, plan.min * 2, plan.min * 5, plan.min * 10].map(amt => (
                      <button key={amt} onClick={() => setAmount(String(amt))} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", background: amount === String(amt) ? `${plan.color}18` : "rgba(255,255,255,0.03)", border: `1px solid ${amount === String(amt) ? plan.color + "44" : "rgba(255,255,255,0.06)"}`, color: amount === String(amt) ? plan.color : "#444" }}>
                        ${amt >= 1000 ? `${amt/1000}k` : amt}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ background: "rgba(0,200,150,0.04)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ fontSize: 10, color: "#444", marginBottom: 12 }}>Projected Earnings</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#555" }}>Daily</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#00c896" }}>${projectedDaily}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#555" }}>Monthly</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#00c896", fontFamily: "'Syne',sans-serif" }}>${projectedMonthly}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#555" }}>Plan</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: plan.color }}>{plan.name} · {plan.daily}%/day</span>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => { if (parseFloat(amount) >= plan.min) setStep(2); }} disabled={!amount || parseFloat(amount) < plan.min} style={{ marginTop: 22, width: "100%", padding: "15px 0", borderRadius: 12, background: !amount || parseFloat(amount) < plan.min ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#aa0000,#e31937)", color: !amount || parseFloat(amount) < plan.min ? "#333" : "#fff", fontWeight: 800, fontSize: 15, fontFamily: "'Syne',sans-serif", boxShadow: !amount ? "none" : "0 4px 24px rgba(227,25,55,0.3)", cursor: !amount || parseFloat(amount) < plan.min ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                Continue to Payment →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — PAYMENT */}
        {step === 2 && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: 20 }}>
              <div>
                <div style={{ ...card, padding: isMobile ? 20 : 26, marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 }}>Select Payment Method</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {CRYPTO.map(c => (
                      <button key={c.id} onClick={() => setSelectedCrypto(c.id)} style={{ padding: "14px 12px", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, background: selectedCrypto === c.id ? `${c.color}12` : "rgba(255,255,255,0.03)", border: `1px solid ${selectedCrypto === c.id ? c.color + "44" : "rgba(255,255,255,0.06)"}`, transition: "all 0.2s", cursor: "pointer" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${c.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: c.color, fontWeight: 700, flexShrink: 0 }}>{c.icon}</div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: selectedCrypto === c.id ? "#fff" : "#666" }}>{c.symbol}</div>
                          <div style={{ fontSize: 9, color: "#333" }}>{c.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ ...card, padding: isMobile ? 20 : 26 }}>
                  <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Send Payment To</div>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px", marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: "#555", marginBottom: 8 }}>{crypto.name} Address</div>
                    <div style={{ fontSize: isMobile ? 10 : 12, color: "#ccc", wordBreak: "break-all", lineHeight: 1.6, fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>{crypto.addr}</div>
                    <button onClick={() => { navigator.clipboard.writeText(crypto.addr).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false), 2500); }} style={{ padding: "8px 16px", borderRadius: 8, background: copied ? "rgba(0,200,150,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${copied ? "rgba(0,200,150,0.3)" : "rgba(255,255,255,0.1)"}`, color: copied ? "#00c896" : "#666", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                      {copied ? "✓ Copied" : "📋 Copy Address"}
                    </button>
                  </div>
                  <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 4 }}>⚠ Important</div>
                    <div style={{ fontSize: 11, color: "#6b5010", lineHeight: 1.6 }}>Send exactly <strong style={{ color: "#f59e0b" }}>${parseFloat(amount).toLocaleString()} worth</strong> of {crypto.symbol}. After sending, email support with your transaction hash to activate your plan.</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#444", lineHeight: 1.7 }}>After your payment is confirmed on the blockchain, your {plan.name} plan will be activated and mining will begin automatically within 1 hour.</div>
                </div>
              </div>

              {/* Order summary */}
              <div style={{ ...card, padding: "22px", height: "fit-content", position: "sticky", top: 20 }}>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 }}>Order Summary</div>
                <div style={{ textAlign: "center", padding: "16px 0", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{plan.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: plan.color, fontFamily: "'Syne',sans-serif" }}>{plan.name} Plan</div>
                  <div style={{ fontSize: 12, color: "#555" }}>{plan.daily}% daily return</div>
                </div>
                {[
                  { label: "Investment",    value: `$${parseFloat(amount).toLocaleString()}`,   color: "#fff" },
                  { label: "Daily Earning", value: `$${projectedDaily}`,                         color: "#00c896" },
                  { label: "Monthly Est.",  value: `$${projectedMonthly}`,                       color: "#00c896", bold: true },
                  { label: "Duration",      value: plan.duration,                                color: "#aaa" },
                  { label: "Payment",       value: crypto.symbol,                               color: crypto.color },
                ].map(({ label, value, color, bold }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 11, color: "#444" }}>{label}</span>
                    <span style={{ fontSize: 12, color, fontWeight: bold ? 700 : 500 }}>{value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.18)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#00c896", fontWeight: 700, marginBottom: 3 }}>✓ Secure & Encrypted</div>
                  <div style={{ fontSize: 10, color: "#444" }}>Your investment is backed by our pool guarantee. Earnings are credited in real time.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}