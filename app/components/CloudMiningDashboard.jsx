"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import WithdrawalPage from "./WithdrawalPage";
import { loadProfile } from "./ProfileCompletionGate";

import EarningsCalculator from "./EarningsCalculator";
import ProfileSettings from "./ProfileSettings";
import NotificationsCenter from "./NotificationsCenter";
import SupportPage from "./SupportPage";
import InvestmentPage from "./InvestmentPage";

const DAILY_RATE = 100;
const TARGET = 1000;
const TICK_MS = 80;
const STORAGE_KEY = "cloud_mining_v2";
const MIN_WITHDRAW = 10000;
const POOL_FEE = 0.012;
const POWER_COST_DAY = 2.88;
const NET_DAILY = DAILY_RATE * (1 - POOL_FEE) - POWER_COST_DAY;

const RIGS = [
  { id: "rig_a", name: "Node Alpha", hashrate: 142, temp: 67, power: 3.2, coin: "BTC", color: "#e31937" },
  { id: "rig_b", name: "Node Beta",  hashrate: 98,  temp: 71, power: 2.1, coin: "ETH", color: "#cc0000" },
  { id: "rig_c", name: "Node Gamma", hashrate: 215, temp: 62, power: 4.8, coin: "BTC", color: "#e31937" },
  { id: "rig_d", name: "Node Delta", hashrate: 77,  temp: 74, power: 1.9, coin: "SOL", color: "#cc0000" },
];

const FAKE_USERS = [
  { name: "James K.",  location: "New York, US",  avatar: "JK" },
  { name: "Sofia R.",  location: "London, UK",    avatar: "SR" },
  { name: "Chen W.",   location: "Singapore",     avatar: "CW" },
  { name: "Amara O.",  location: "Ontario, CA",     avatar: "AO" },
  { name: "Lucas M.",  location: "Sao Paulo, BR", avatar: "LM" },
  { name: "Yuki T.",   location: "Tokyo, JP",     avatar: "YT" },
  { name: "Priya S.",  location: "Mumbai, IN",    avatar: "PS" },
  { name: "Marco D.",  location: "Milan, IT",     avatar: "MD" },
  { name: "Aisha B.",  location: "Dubai, UAE",    avatar: "AB" },
  { name: "Tyler H.",  location: "Toronto, CA",   avatar: "TH" },
  { name: "Elena V.",  location: "Berlin, DE",    avatar: "EV" },
  { name: "Omar F.",   location: "Cairo, EG",     avatar: "OF" },
];
const COINS = ["BTC", "ETH", "SOL", "USDT"];

const fmt$ = (n) => `$${n.toFixed(4)}`;
const fmtBig = (n) => n >= 1000 ? `$${(n / 1000).toFixed(2)}k` : `$${n.toFixed(2)}`;
const pct = (n, t) => Math.min((n / t) * 100, 100);
const tsNow = () => Date.now();
const randBetween = (a, b) => (Math.random() * (b - a) + a).toFixed(2);

function loadState() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ── useIsMobile ───────────────────────────────────────────────────────────────
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

// ── useMiningEngine ───────────────────────────────────────────────────────────
function useMiningEngine() {
  const [mined, setMined] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [active, setActive] = useState(false);
  const [history, setHistory] = useState([]);
  const tickRef = useRef(null);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      const { mined: m, startedAt: s, active: a, history: h } = saved;
      const elapsed = a && s ? (tsNow() - s) / 1000 : 0;
      const recovered = Math.min(m + (a ? (elapsed * DAILY_RATE) / 86400 : 0), TARGET);
      setMined(recovered);
      setStartedAt(s);
      setActive(a && recovered < TARGET);
      setHistory(h || []);
    }
  }, []);

  useEffect(() => {
    if (startedAt !== null) saveState({ mined, startedAt, active, history });
  }, [mined, active]);

  useEffect(() => {
    if (!active) { clearInterval(tickRef.current); return; }
    tickRef.current = setInterval(() => {
      setMined((prev) => {
        const next = Math.min(prev + (DAILY_RATE / 86400) * (TICK_MS / 1000), TARGET);
        if (next >= TARGET) { setActive(false); clearInterval(tickRef.current); }
        if (Math.random() < 0.04) setHistory((h) => [...h.slice(-59), { t: tsNow(), v: next }]);
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(tickRef.current);
  }, [active]);

  const start = useCallback(() => {
    const s = tsNow();
    setStartedAt(s);
    setActive(true);
    setHistory([{ t: s, v: mined }]);
  }, [mined]);

  const pause = useCallback(() => setActive(false), []);
  const reset = useCallback(() => {
    clearInterval(tickRef.current);
    setMined(0); setStartedAt(null); setActive(false); setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const elapsed = startedAt ? (tsNow() - startedAt) / 1000 : 0;
  const hoursElapsed = elapsed / 3600;
  const progress = pct(mined, TARGET);
  const ratePerSec = DAILY_RATE / 86400;
  return { mined, active, progress, hoursElapsed, ratePerSec, history, start, pause, reset };
}

// ── useWithdrawNotifications ──────────────────────────────────────────────────
function useWithdrawNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let timeoutId;
    const fire = () => {
      const user = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
      const coin = COINS[Math.floor(Math.random() * COINS.length)];
      const amount = randBetween(52, 890);
      setNotifications((prev) => [...prev.slice(-4), { id: tsNow() + Math.random(), user, coin, amount }]);
      timeoutId = setTimeout(fire, 8000 + Math.random() * 14000);
    };
    timeoutId = setTimeout(fire, 3500);
    return () => clearTimeout(timeoutId);
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, dismiss };
}

// ── TeslaLogo ─────────────────────────────────────────────────────────────────
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

// ── WithdrawNotification ──────────────────────────────────────────────────────
function WithdrawNotification({ notif, onDismiss }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 60);
    const t2 = setTimeout(() => setVisible(false), 4600);
    const t3 = setTimeout(onDismiss, 5100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div onClick={onDismiss} style={{
      display: "flex", alignItems: "center", gap: 12,
      background: "rgba(8,10,18,0.96)",
      border: "1px solid rgba(227,25,55,0.25)",
      borderLeft: "3px solid #e31937",
      borderRadius: 12, padding: "12px 16px",
      backdropFilter: "blur(24px)",
      boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      width: 300, cursor: "pointer",
      transform: visible ? "translateX(0)" : "translateX(340px)",
      opacity: visible ? 1 : 0,
      transition: "transform 0.45s cubic-bezier(0.34,1.4,0.64,1), opacity 0.3s ease",
    }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#cc0000,#e31937)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "monospace", boxShadow: "0 0 12px rgba(227,25,55,0.4)" }}>
        {notif.user.avatar}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e8e8e8", marginBottom: 3 }}>
          <span style={{ color: "#fff" }}>{notif.user.name}</span>
          <span style={{ color: "#555" }}> withdrew </span>
          <span style={{ color: "#e31937", fontWeight: 700 }}>${notif.amount}</span>
        </div>
        <div style={{ fontSize: 10, color: "#444", display: "flex", gap: 5 }}>
          <span style={{ color: "#cc8800", fontWeight: 600 }}>{notif.coin}</span>
          <span>·</span>
          <span>{notif.user.location}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00c896", animation: "pulse 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 9, color: "#333" }}>now</span>
      </div>
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#e31937", height = 56 }) {
  if (data.length < 2) return (
    <svg width="100%" height={height}>
      <line x1="0" y1={height} x2="100%" y2={height} stroke={color} strokeWidth="1.5" strokeOpacity="0.2" />
    </svg>
  );
  const vals = data.map((d) => d.v);
  const min = Math.min(...vals), max = Math.max(...vals) || 1;
  const W = 300, H = height;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const area = `M0,${H} L${pts.split(" ").join(" L")} L${W},${H} Z`;
  const gid = `sg_${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── RingProgress ──────────────────────────────────────────────────────────────
function RingProgress({ pct: p, size = 160, stroke = 10, color = "#e31937" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (p / 100) * circ;
  return (
    <svg width={size} height={size} style={{ filter: `drop-shadow(0 0 14px ${color}55)` }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.3s ease" }} />
    </svg>
  );
}

// ── TempGauge ─────────────────────────────────────────────────────────────────
function TempGauge({ temp }) {
  const color = temp > 75 ? "#ff4455" : temp > 65 ? "#ffaa00" : "#00c896";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, animation: "pulse 1.5s ease-in-out infinite" }} />
      <span style={{ color, fontSize: 11 }}>{temp}°C</span>
    </div>
  );
}

// ── RigCard ───────────────────────────────────────────────────────────────────
function RigCard({ rig, active }) {
  const [localHash, setLocalHash] = useState(rig.hashrate);
  const [localTemp, setLocalTemp] = useState(rig.temp);
  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => {
      setLocalHash(rig.hashrate + (Math.random() - 0.5) * 4);
      setLocalTemp(rig.temp + Math.floor(Math.random() * 3));
    }, 1400);
    return () => clearInterval(iv);
  }, [active]);

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "13px 15px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -14, right: -14, width: 55, height: 55, borderRadius: "50%", background: rig.color, opacity: 0.06, filter: "blur(14px)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 9 }}>
        <div>
          <div style={{ fontSize: 9, color: "#666", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>{rig.coin}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ddd" }}>{rig.name}</div>
        </div>
        <div style={{ padding: "3px 8px", borderRadius: 20, fontSize: 10, background: active ? "rgba(227,25,55,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? "rgba(227,25,55,0.25)" : "rgba(255,255,255,0.07)"}`, color: active ? "#e31937" : "#444" }}>
          {active ? "● ON" : "○ OFF"}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 9 }}>
        <div>
          <div style={{ fontSize: 9, color: "#333", marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 }}>Hashrate</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: rig.color }}>{localHash.toFixed(1)} TH/s</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#333", marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 }}>Power</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#777" }}>{rig.power} kW</div>
        </div>
      </div>
      <TempGauge temp={localTemp} />
    </div>
  );
}

// ── SidebarContent ────────────────────────────────────────────────────────────
function SidebarContent({ active, progress, mined, ratePerSec, tick, completed }) {
  const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 };
  const netDailyEst = (ratePerSec * 86400 * (1 - POOL_FEE)) - POWER_COST_DAY;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "rgba(227,25,55,0.06)", border: "1px solid rgba(227,25,55,0.15)", borderRadius: 14, padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <TeslaLogo size={15} color="#e31937" />
          <span style={{ fontSize: 10, color: "#e31937", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>Tesla Energy Grid</span>
        </div>
        <p style={{ fontSize: 11, color: "#666", lineHeight: 1.6 }}>
          Powered by Tesla surplus energy. Session auto-saves to <span style={{ color: "#e31937" }}>Database</span>.
        </p>
      </div>

      <div style={card}>
        <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Mining Economics</div>
        {[
          { label: "Gross rate/day",  value: `$${(ratePerSec * 86400).toFixed(2)}`,              color: "#ccc" },
          { label: "Pool fee (1.2%)", value: `-$${(ratePerSec * 86400 * POOL_FEE).toFixed(2)}`,  color: "#ff6b6b" },
          { label: "Power cost/day",  value: `-$${POWER_COST_DAY.toFixed(2)}`,                   color: "#ff6b6b" },
          { label: "Net profit/day",  value: `$${netDailyEst.toFixed(2)}`,                       color: "#00c896", bold: true },
          { label: "Total hashrate",  value: "532 TH/s",                                         color: "#ccc" },
          { label: "Pool uptime",     value: active ? "99.3%" : "--",                            color: active ? "#00c896" : "#333" },
          { label: "Block reward",    value: "3.125 BTC",                                        color: "#ccc" },
        ].map(({ label, value, color, bold }, i) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <span style={{ fontSize: 11, color: "#444" }}>{label}</span>
            <span style={{ fontSize: 12, color, fontWeight: bold ? 700 : 500 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Payout Milestones</div>
        {[
          { threshold: 1000,  label: "Bronze Tier" },
          { threshold: 2500,  label: "Silver Tier" },
          { threshold: 5000,  label: "Gold Tier" },
          { threshold: 10000, label: "Withdrawal Unlocked" },
        ].map(({ threshold, label }) => {
          const reached = mined >= threshold;
          const isCurrent = mined < threshold && mined >= threshold * 0.6;
          return (
            <div key={threshold} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: reached ? "rgba(227,25,55,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${reached ? "rgba(227,25,55,0.4)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: reached ? "#e31937" : "#2a2a2a" }}>
                {reached ? "✓" : "○"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: reached ? "#bbb" : "#3a3a3a" }}>{label} — {fmtBig(threshold)}</span>
                  {isCurrent && <span style={{ fontSize: 9, color: "#e31937" }}>NEXT</span>}
                </div>
                <div style={{ marginTop: 3, height: 2, background: "rgba(255,255,255,0.04)", borderRadius: 1 }}>
                  <div style={{ height: "100%", borderRadius: 1, width: `${Math.min(pct(mined, threshold), 100)}%`, background: reached ? "#e31937" : "rgba(227,25,55,0.25)", transition: "width 0.3s ease" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: "rgba(227,25,55,0.06)", border: "1px solid rgba(227,25,55,0.15)", borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, color: "#e31937", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>🎁 Referral Programme</div>
        <p style={{ fontSize: 11, color: "#555", lineHeight: 1.6, marginBottom: 10 }}>
          Earn <span style={{ color: "#e31937", fontWeight: 700 }}>$5.00</span> for every friend you refer who signs up and starts mining.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#e31937", fontFamily: "'Syne',sans-serif" }}>{mined > 0 ? Math.floor(mined / 100) : 0}</div>
            <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>Referrals</div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#00c896", fontFamily: "'Syne',sans-serif" }}>${(Math.floor(mined / 100) * 5).toFixed(2)}</div>
            <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>Earned</div>
          </div>
        </div>
      </div>

      <div style={{ ...card, background: "rgba(255,255,255,0.015)" }}>
        <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>System Log</div>
        {[
          { color: "#e31937", text: `> mining.status: ${active ? "ACTIVE" : completed ? "COMPLETE" : "IDLE"}` },
          { color: "#cc8800", text: `> earnings.gross: $${mined.toFixed(4)}` },
          { color: "#888",    text: `> nodes.online: 4/4` },
          { color: "#444",    text: `> pool.fee: 1.2% | power: $${POWER_COST_DAY}/day` },
          { color: "#444",    text: `> pool.latency: ${22 + (tick % 8)}ms` },
          { color: "#2a2a2a", text: `> storage: localStorage OK` },
        ].map(({ color, text }, i) => (
          <div key={i} style={{ color, marginBottom: 5, fontSize: 10 }}>{text}</div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function CloudMiningDashboard({ user, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  // ✅ ALL hooks declared first — no early returns before this block
  const [page, setPage] = useState("dashboard");
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [referralCount,   setReferralCount]   = useState(0);
  const [showReferral,    setShowReferral]    = useState(false);
  const [referralCopied,  setReferralCopied]  = useState(false);
  const [investInit, setInvestInit] = useState(null); // { planId, amount } from calculator
  const { mined, active, progress, hoursElapsed, ratePerSec, history, start, pause, reset } = useMiningEngine();
  const isMobile = useIsMobile();
  const [tick, setTick] = useState(0);
  const [btcPrice, setBtcPrice] = useState(67240);
  const [networkDiff, setNetworkDiff] = useState(88.1);
  const { notifications, dismiss } = useWithdrawNotifications();

  // ✅ ALL useEffects declared before any early return
  useEffect(() => {
    const iv = setInterval(() => {
      setTick((t) => t + 1);
      setBtcPrice((p) => Math.round(p + (Math.random() - 0.5) * 80));
      setNetworkDiff((d) => +(d + (Math.random() - 0.5) * 0.04).toFixed(2));
    }, 1200);
    return () => clearInterval(iv);
  }, []);

  // Load referral data
  useEffect(() => {
    try {
      const key = "teslamine_referrals_" + (user?.id || "guest");
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        setReferralCount(data.count || 0);
        setReferralEarnings((data.count || 0) * 5);
      }
    } catch {}
  }, []);

  // ✅ Early return ONLY after all hooks and effects
  if (page === "withdraw") {
    return <WithdrawalPage onBack={() => setPage("dashboard")} />;
  }

  if (page === "calculator") {
    return <EarningsCalculator onBack={() => setPage("dashboard")} onInvest={({ planId, amount }) => { setInvestInit({ planId, amount }); setPage("invest"); }} />;
  }
  if (page === "profile") {
    return <ProfileSettings onBack={() => setPage("dashboard")} user={user} onLogout={onLogout} />;
  }
  if (page === "notifications") {
    return <NotificationsCenter onBack={() => setPage("dashboard")} />;
  }
  if (page === "support") {
    return <SupportPage onBack={() => setPage("dashboard")} user={user} />;
  }
  if (page === "invest") {
    return <InvestmentPage onBack={() => { setInvestInit(null); setPage("dashboard"); }} initialPlan={investInit?.planId} initialAmount={investInit?.amount} />;
  }

  const completed = mined >= TARGET;
  const ringSize = isMobile ? 128 : 158;
  const netMined = Math.max(mined - (POWER_COST_DAY / 86400) * hoursElapsed * 3600, 0);
  const estimatedCompletion = active ? `~${((TARGET - mined) / DAILY_RATE).toFixed(1)} days` : "Paused";
  const totalHashrate = RIGS.reduce((s, r) => s + r.hashrate, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'JetBrains Mono', monospace", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; border:none; outline:none; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1e1e2e; border-radius:4px; }
      `}</style>

      {/* BG */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(227,25,55,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.018) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: -280, left: "50%", transform: "translateX(-50%)", width: 600, height: 360, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(227,25,55,0.05) 0%,transparent 70%)", pointerEvents: "none" }} />

      {/* TICKER */}
      <div style={{ background: "rgba(227,25,55,0.07)", borderBottom: "1px solid rgba(227,25,55,0.12)", padding: "6px 0", overflow: "hidden", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", animation: "ticker 28s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
          {[0, 1, 2].map((r) => (
            <span key={r} style={{ display: "flex", gap: 36, paddingRight: 36 }}>
              {[
                { label: "BTC/USD",      value: `$${btcPrice.toLocaleString()}` },
                { label: "ETH/USD",      value: "$3,482" },
                { label: "Net Diff",     value: `${networkDiff}T` },
                { label: "Block",        value: `#${(840000 + Math.floor(mined * 100)).toLocaleString()}` },
                { label: "Pool HR",      value: `${totalHashrate} TH/s` },
                { label: "Reward",       value: "3.125 BTC" },
                { label: "Tesla Grid",   value: "ONLINE", green: true },
              ].map(({ label, value, green }) => (
                <span key={label + r} style={{ fontSize: 11 }}>
                  <span style={{ color: "#2a2a2a", marginRight: 5 }}>{label}</span>
                  <span style={{ color: green ? "#00c896" : "#888", fontWeight: 600 }}>{value}</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 14px 40px" : "0 24px 40px" }}>

        {/* HEADER */}
        <header style={{ padding: isMobile ? "14px 0 12px" : "20px 0 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", marginBottom: isMobile ? 14 : 22, animation: "fadeIn 0.5s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14 }}>
              <TeslaLogo size={isMobile ? 34 : 44} color="#e31937" />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#e31937", boxShadow: "0 0 8px #e31937", animation: "pulse 2s ease-in-out infinite" }} />
                  <span style={{ fontSize: 9, color: "#e31937", letterSpacing: 3, textTransform: "uppercase" }}>Tesla Energy Mining</span>
                </div>
                <h1 style={{ fontSize: isMobile ? 18 : 23, fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>
                  TESLA<span style={{ color: "#e31937" }}>MINE</span>
                  <span style={{ color: "#2a2a2a", fontSize: isMobile ? 12 : 15, fontWeight: 400 }}> / Dashboard</span>
                </h1>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
              {!isMobile && (
                <div style={{ display: "flex", gap: 18 }}>
                  {[{ label: "BTC", value: `$${btcPrice.toLocaleString()}` }, { label: "Difficulty", value: `${networkDiff}T` }].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "#333", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, color: "#bbb", fontWeight: 500 }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Nav buttons */}
              {!isMobile && (
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { icon: "📊", label: "Calculator", page: "calculator" },
                    { icon: "💹", label: "Invest",     page: "invest" },
                    { icon: "🎧", label: "Support",    page: "support" },
                  ].map(({ icon, label, page: p }) => (
                    <button key={p} onClick={() => setPage(p)} style={{ padding: "7px 12px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#555", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#ccc"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Notification bell */}
              <button onClick={() => setPage("notifications")} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, position: "relative", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(227,25,55,0.3)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
              >
                🔔
                <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#e31937", border: "2px solid #06090f", animation: "pulse 2s ease-in-out infinite" }} />
              </button>

              <button
                onClick={() => setPage("withdraw")}
                style={{
                  padding: isMobile ? "8px 12px" : "10px 18px",
                  borderRadius: 10, fontSize: isMobile ? 11 : 12, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  background: mined >= MIN_WITHDRAW ? "linear-gradient(135deg,#b30000,#e31937)" : "rgba(255,255,255,0.04)",
                  border: mined >= MIN_WITHDRAW ? "none" : "1px solid rgba(255,255,255,0.07)",
                  color: mined >= MIN_WITHDRAW ? "#fff" : "#333",
                  boxShadow: mined >= MIN_WITHDRAW ? "0 4px 18px rgba(227,25,55,0.35)" : "none",
                  transition: "all 0.2s", whiteSpace: "nowrap",
                }}
              >
                {isMobile ? "💸" : "💸 Withdraw"}
              </button>

              {/* User Avatar + Menu */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowUserMenu(m => !m)}
                  style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#aa0000,#e31937)", border: "2px solid rgba(227,25,55,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'JetBrains Mono',monospace", flexShrink: 0, boxShadow: "0 0 12px rgba(227,25,55,0.3)" }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </button>
                {showUserMenu && (
                  <div style={{ position: "absolute", top: 44, right: 0, width: 220, background: "rgba(10,14,24,0.98)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 8, backdropFilter: "blur(20px)", zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                    <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{user?.name || "Miner"}</div>
                      <div style={{ fontSize: 10, color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
                    </div>
                    {[
                      { icon: "👤", label: "Profile & Settings", action: () => { setPage("profile"); setShowUserMenu(false); } },
                      { icon: "🔔", label: "Notifications",      action: () => { setPage("notifications"); setShowUserMenu(false); } },
                      { icon: "💸", label: "Withdraw",           action: () => { setPage("withdraw"); setShowUserMenu(false); } },
                      { icon: "💹", label: "Invest / Upgrade",   action: () => { setPage("invest"); setShowUserMenu(false); } },
                      { icon: "📊", label: "Earnings Calc",      action: () => { setPage("calculator"); setShowUserMenu(false); } },
                      { icon: "🎧", label: "Support",            action: () => { setPage("support"); setShowUserMenu(false); } },
                    ].map(({ icon, label, action }) => (
                      <button key={label} onClick={action} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, background: "none", border: "none", color: action ? "#ccc" : "#444", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", textAlign: "left", display: "flex", alignItems: "center", gap: 8, cursor: action ? "pointer" : "default" }}
                        onMouseEnter={e => action && (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                      >
                        <span>{icon}</span>{label}
                      </button>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 6, paddingTop: 6 }}>
                      <button onClick={() => { if (onLogout) { try { localStorage.removeItem("teslamine_auth"); } catch {} onLogout(); } }} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, background: "rgba(255,68,85,0.08)", border: "none", color: "#ff6b6b", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", textAlign: "left", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <span>🚪</span> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* MAIN GRID */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 292px", gap: isMobile ? 14 : 20, animation: "fadeIn 0.6s ease 0.1s both" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16 }}>

            {/* HERO CARD */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: isMobile ? "16px 14px" : 24, backdropFilter: "blur(20px)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 20, right: 20, height: 1, background: "linear-gradient(90deg,transparent,#e31937,transparent)" }} />

              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: isMobile ? 14 : 24 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <RingProgress pct={progress} size={ringSize} stroke={9} color={active || completed ? "#e31937" : "#1a0a0a"} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <TeslaLogo size={22} color={active ? "#e31937" : "#2a0a0a"} />
                    <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: active ? "#e31937" : "#3a1a1a", lineHeight: 1, marginTop: 4 }}>{progress.toFixed(1)}%</div>
                    <div style={{ fontSize: 10, color: "#3a1a1a", marginTop: 2 }}>{fmtBig(mined)}</div>
                  </div>
                </div>

                <div style={{ flex: 1, width: "100%" }}>
                  <div style={{ marginBottom: 12, textAlign: isMobile ? "center" : "left" }}>
                    <div style={{ fontSize: 9, color: "#333", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Gross Earnings</div>
                    <div style={{ fontSize: isMobile ? 30 : 38, fontWeight: 700, color: "#fff", lineHeight: 1, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>
                      ${mined.toFixed(4)}
                    </div>
                    <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>
                      Net after fees: <span style={{ color: "#00c896" }}>${netMined.toFixed(4)}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#aa0000,#e31937)", borderRadius: 3, transition: "width 0.3s ease", boxShadow: "0 0 12px rgba(227,25,55,0.5)" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: "#333" }}>{fmtBig(mined)} mined</span>
                      <span style={{ fontSize: 10, color: "#333" }}>{fmtBig(TARGET - mined)} left of {fmtBig(TARGET)}</span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Net Rate/Day",    value: `$${NET_DAILY.toFixed(2)}`,               color: "#00c896" },
                      { label: "Est. Completion", value: estimatedCompletion,                       color: "#888" },
                      { label: "Total Hashrate",  value: `${totalHashrate} TH/s`,                  color: "#e31937" },
                      { label: "Uptime",          value: active ? "99.3%" : "Offline",             color: active ? "#00c896" : "#444" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 11px" }}>
                        <div style={{ fontSize: 9, color: "#2a2a2a", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, color }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                {!active && !completed && (
                  <button onClick={start} style={{ flex: 1, padding: "13px 0", borderRadius: 11, background: "linear-gradient(135deg,#aa0000,#e31937)", color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, boxShadow: "0 4px 20px rgba(227,25,55,0.35)" }}>
                    ▶ START MINING
                  </button>
                )}
                {active && (
                  <button onClick={pause} style={{ flex: 1, padding: "13px 0", borderRadius: 11, background: "rgba(255,200,0,0.07)", border: "1px solid rgba(255,200,0,0.2)", color: "#ffc800", fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
                    ⏸ PAUSE
                  </button>
                )}
                {completed && (
                  <div style={{ flex: 1, padding: "13px 0", borderRadius: 11, background: "rgba(227,25,55,0.1)", border: "1px solid rgba(227,25,55,0.25)", color: "#e31937", fontWeight: 700, fontSize: 13, textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
                    ✓ CYCLE COMPLETE — {fmtBig(TARGET)}
                  </div>
                )}
                <button onClick={reset} style={{ padding: "13px 18px", borderRadius: 11, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#444", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>↺</button>
              </div>
            </div>

            {/* SPARKLINE */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>Earnings Curve</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Real-time accumulation</div>
                </div>
                <div style={{ fontSize: 11, color: "#e31937" }}>+${ratePerSec.toFixed(6)}/s</div>
              </div>
              <Sparkline data={history} color="#e31937" height={isMobile ? 44 : 54} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: "#1e1e1e" }}>Session start</span>
                <span style={{ fontSize: 10, color: "#1e1e1e" }}>Now</span>
              </div>
            </div>

            {/* RIG GRID */}
            <div>
              <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Mining Nodes — {RIGS.length} Active</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {RIGS.map((rig) => <RigCard key={rig.id} rig={rig} active={active} />)}
              </div>
            </div>

            {isMobile && <SidebarContent active={active} progress={progress} mined={mined} ratePerSec={ratePerSec} tick={tick} completed={completed} />}
          </div>

          {!isMobile && <SidebarContent active={active} progress={progress} mined={mined} ratePerSec={ratePerSec} tick={tick} completed={completed} />}
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: 24, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.03)", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TeslaLogo size={13} color="#222" />
            <span style={{ fontSize: 10, color: "#1e1e1e" }}>Tesla Energy Mining Platform · Sponsored by Elon Musk</span>
          </div>
          <span style={{ fontSize: 10, color: "#1e1e1e" }}>Crypto Mining · Digital System · Decentralised Coin</span>
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: "rgba(6,9,15,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", display: "flex", justifyContent: "space-around", padding: "10px 0 14px" }}>
          {[
            { icon: "⛏",  label: "Mine",       p: "dashboard" },
            { icon: "💹", label: "Invest",     p: "invest" },
            { icon: "💸", label: "Withdraw",   p: "withdraw" },
            { icon: "👤", label: "Profile",    p: "profile" },
          ].map(({ icon, label, p }) => (
            <button key={p} onClick={() => setPage(p)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", color: page === p ? "#e31937" : "#444", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* NOTIFICATIONS */}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", pointerEvents: "none" }}>
        {notifications.map((n) => (
          <div key={n.id} style={{ pointerEvents: "all" }}>
            <WithdrawNotification notif={n} onDismiss={() => dismiss(n.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}