"use client";

import { useState, useEffect, useRef } from "react";

const TESTIMONIALS = [
  { initials: "MR", name: "Michael R.", location: "Texas, USA", stars: 5, text: "I was skeptical at first, but TeslaMine actually delivers. Started with the free plan and already withdrawn twice to my Coinbase wallet!", tag: "Already withdrawn twice" },
  { initials: "SK", name: "Sarah K.", location: "London, UK", stars: 5, text: "Super easy to use. I just activate my daily mining session and earnings stack up automatically. Withdrew $2500 last week with zero issues.", tag: "Withdrew $2500 last week" },
  { initials: "AO", name: "Amara O.", location: "Ontario, CA", stars: 5, text: "Best cloud mining platform I've used. The Tesla energy grid means lower fees and better uptime than any competitor. Highly recommend.", tag: "Better than competitors" },
  { initials: "CW", name: "Chen W.", location: "Singapore", stars: 5, text: "Professional dashboard, real-time earnings, and fast withdrawals. TeslaMine feels like a proper fintech product. Very impressed.", tag: "Fast withdrawals" },
  { initials: "LM", name: "Lucas M.", location: "Sao Paulo, BR", stars: 5, text: "Joined 3 months ago. Already at Gold Tier. The mining nodes are incredibly stable and the support team is responsive. 10/10.", tag: "Gold Tier member" },
  { initials: "YT", name: "Yuki T.", location: "Tokyo, JP", stars: 5, text: "I appreciate the transparency — real pool fees, real power costs shown on the dashboard. No hidden charges. Trust is everything.", tag: "Transparent fees" },
];

const PARTNERS = [
  { name: "CoinMarketCap", symbol: "◎" },
  { name: "Binance", symbol: "⬡" },
  { name: "Crypto.com", symbol: "⬡" },
  { name: "Ledger", symbol: "▪" },
  { name: "Blockchain", symbol: "⬡" },
  { name: "CertiK", symbol: "◈" },
];

const STATS = [
  { value: "25K+", label: "Active Miners" },
  { value: "$4.2M+", label: "Total Paid Out" },
  { value: "99.3%", label: "Pool Uptime" },
  { value: "532 TH/s", label: "Hashrate" },
];

const FEATURES = [
  { icon: "⚡", title: "Tesla Energy Powered", desc: "Mining runs on Tesla's surplus renewable energy grid — lower costs, higher uptime, greener footprint." },
  { icon: "🔒", title: "Secure & Transparent", desc: "Real pool fees, real power costs displayed on your dashboard. No hidden charges, ever." },
  { icon: "💸", title: "Fast Withdrawals", desc: "Withdraw to BTC, ETH, SOL or USDT once you hit the $1000 minimum. Processed within 1–3 hours." },
  { icon: "📊", title: "Live Dashboard", desc: "Real-time earnings curve, node hashrate monitoring, temperature gauges and milestone tracking." },
  { icon: "🌍", title: "Global Community", desc: "Join 25,000+ miners from over 80 countries all earning daily from the same trusted platform." },
  { icon: "🛡️", title: "CertiK Audited", desc: "Our smart contracts and payout systems are fully audited by CertiK for maximum security." },
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

function TeslaLogo({ size = 32, color = "#e31937" }) {
  return (
    <img
      src="/favicon-512.png"
      alt="Tesla"
      style={{
        width: size, height: size, objectFit: "contain",
        filter: color === "#e31937" || color === "#cc0000" || color === "#aa0000"
          ? "none"
          : color === "#222" || color === "#333" || color === "#2a0a0a" || color === "#2a2a2a"
          ? "brightness(0.15)" : "none",
        display: "inline-block", flexShrink: 0,
      }}
    />
  );
}

function Stars({ count = 5 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ color: "#e31937", fontSize: 13 }}>★</span>
      ))}
    </div>
  );
}

function LiveCounter() {
  const [miners, setMiners] = useState(25847);
  const [btc, setBtc] = useState(67240);
  useEffect(() => {
    const iv = setInterval(() => {
      setMiners(m => m + Math.floor(Math.random() * 3));
      setBtc(p => Math.round(p + (Math.random() - 0.5) * 60));
    }, 2000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center",
      background: "rgba(227,25,55,0.08)", border: "1px solid rgba(227,25,55,0.2)",
      borderRadius: 50, padding: "7px 16px", marginBottom: 20,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#e31937", boxShadow: "0 0 8px #e31937", animation: "pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: "#e31937", fontWeight: 600, whiteSpace: "nowrap" }}>
        {miners.toLocaleString()} miners active
      </span>
      <span style={{ color: "#333", fontSize: 11 }}>·</span>
      <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>BTC <span style={{ color: "#00c896", fontWeight: 600 }}>${btc.toLocaleString()}</span></span>
    </div>
  );
}

function TestimonialCard({ t, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 18, padding: "20px 18px", backdropFilter: "blur(12px)",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(227,25,55,0.4),transparent)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#aa0000,#e31937)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {t.initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{t.name}</div>
            <div style={{ fontSize: 11, color: "#555" }}>{t.location}</div>
          </div>
        </div>
        <Stars count={t.stars} />
      </div>
      <p style={{ fontSize: 12, color: "#888", lineHeight: 1.7, marginBottom: 12 }}>"{t.text}"</p>
      <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, background: "rgba(227,25,55,0.1)", border: "1px solid rgba(227,25,55,0.2)", fontSize: 11, color: "#e31937", fontWeight: 600 }}>
        ✓ {t.tag}
      </div>
    </div>
  );
}

export default function HomePage({ onStart }) {
  const isMobile = useIsMobile();
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef();

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.1 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'JetBrains Mono', monospace", color: "#fff", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; border:none; outline:none; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1e1e2e; border-radius:4px; }
        a { text-decoration:none; color:inherit; }
        .fade-in { animation: fadeUp 0.7s ease forwards; }
      `}</style>

      {/* BG */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: -300, left: "50%", transform: "translateX(-50%)", width: 700, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(227,25,55,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(6,9,15,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: isMobile ? "12px 16px" : "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TeslaLogo size={28} color="#e31937" />
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? 15 : 18 }}>
            TESLA<span style={{ color: "#e31937" }}>MINE</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 20 }}>
          {!isMobile && (
            <>
              <a href="#features" style={{ fontSize: 12, color: "#555" }}>Features</a>
              <a href="#testimonials" style={{ fontSize: 12, color: "#555" }}>Reviews</a>
              <a href="#partners" style={{ fontSize: 12, color: "#555" }}>Partners</a>
            </>
          )}
          <button onClick={onStart} style={{ padding: isMobile ? "8px 16px" : "9px 22px", borderRadius: 8, background: "linear-gradient(135deg,#aa0000,#e31937)", color: "#fff", fontWeight: 700, fontSize: isMobile ? 12 : 13, fontFamily: "'JetBrains Mono', monospace", boxShadow: "0 4px 16px rgba(227,25,55,0.3)", whiteSpace: "nowrap" }}>
            {isMobile ? "Mine Now" : "Start Mining"}
          </button>
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* HERO */}
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "48px 20px 40px" : "80px 40px 60px", textAlign: "center" }}>

          <LiveCounter />

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 50, padding: "5px 14px", marginBottom: 20 }}>
            <TeslaLogo size={14} color="#e31937" />
            <span style={{ fontSize: isMobile ? 9 : 11, color: "#888", letterSpacing: 1.5, textTransform: "uppercase" }}>Powered by Tesla Energy Grid</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: isMobile ? "24px" : "clamp(52px,6vw,80px)", lineHeight: isMobile ? 1.3 : 1.05, letterSpacing: isMobile ? 0 : -2, marginBottom: 14, maxWidth: isMobile ? "100%" : 820, animation: "fadeUp 0.6s ease 0.1s both" }}>
            Free Bitcoin Mining —{" "}
            <span style={{ color: "#e31937" }}>Start Earning BTC Today</span>
          </h1>

          {/* Subtext */}
          <p style={{ fontSize: isMobile ? 13 : 17, color: "#666", lineHeight: 1.7, maxWidth: isMobile ? "100%" : 560, marginBottom: 28, animation: "fadeUp 0.6s ease 0.2s both" }}>
            No hardware, no setup — just free BTC mining in the cloud. Join 25,000+ miners earning daily.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, width: isMobile ? "100%" : "auto", marginBottom: 28, animation: "fadeUp 0.6s ease 0.3s both" }}>
            <button onClick={onStart} style={{
              padding: "14px 28px", borderRadius: 12, fontWeight: 700, fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              background: "linear-gradient(135deg,#aa0000,#e31937)",
              color: "#fff", letterSpacing: 0.5,
              boxShadow: "0 6px 24px rgba(227,25,55,0.4)",
              width: isMobile ? "100%" : "auto", whiteSpace: "nowrap",
            }}>
              ⚡ Start Free Bitcoin Mining
            </button>
            <button style={{
              padding: "14px 24px", borderRadius: 12, fontWeight: 600, fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#888", width: isMobile ? "100%" : "auto",
            }}>
              Learn More ↓
            </button>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 40, animation: "fadeUp 0.6s ease 0.4s both" }}>
            {["No Credit Card", "No Hardware", "Instant Setup", "Free to Start"].map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#444" }}>
                <span style={{ color: "#00c896" }}>✓</span> {b}
              </div>
            ))}
          </div>

          {/* Dashboard preview card */}
          <div style={{ width: "100%", maxWidth: isMobile ? "100%" : 640, animation: "float 5s ease-in-out infinite" }}>
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: isMobile ? "16px" : "20px 24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#e31937,transparent)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <TeslaLogo size={18} color="#e31937" />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>TESLA<span style={{ color: "#e31937" }}>MINE</span> Dashboard</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 20, background: "rgba(227,25,55,0.1)", border: "1px solid rgba(227,25,55,0.25)" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#e31937", animation: "pulse 1.5s ease-in-out infinite" }} />
                  <span style={{ fontSize: 9, color: "#e31937", fontWeight: 600 }}>MINING ACTIVE</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Earnings", value: "$47.28", color: "#fff" },
                  { label: "Net/Day", value: "$96.88", color: "#00c896" },
                  { label: "Hashrate", value: "532 TH/s", color: "#e31937" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 8, color: "#444", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700, color }}>{value}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: "#444" }}>Mining Progress</span>
                  <span style={{ fontSize: 9, color: "#e31937" }}>47.3%</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: "47.3%", background: "linear-gradient(90deg,#aa0000,#e31937)", borderRadius: 2 }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section ref={statsRef} style={{ padding: isMobile ? "32px 16px" : "60px 40px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {STATS.map(({ value, label }, i) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, padding: "20px 16px", textAlign: "center",
                position: "relative", overflow: "hidden",
                opacity: statsVisible ? 1 : 0,
                transform: statsVisible ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.5s ease ${i * 100}ms, transform 0.5s ease ${i * 100}ms`,
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#e31937,transparent)", opacity: 0.5 }} />
                <div style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, color: "#e31937", fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" style={{ padding: isMobile ? "40px 16px" : "70px 40px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 10, color: "#e31937", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Why TeslaMine</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: isMobile ? 24 : 40, letterSpacing: -0.5, lineHeight: 1.15 }}>
              Built Different.<br /><span style={{ color: "#e31937" }}>Built Better.</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px 18px" }}>
                <div style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{title}</div>
                <p style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" style={{ padding: isMobile ? "40px 16px" : "70px 40px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 10, color: "#e31937", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Reviews</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: isMobile ? 24 : 40, letterSpacing: -0.5, lineHeight: 1.15, marginBottom: 10 }}>
              What Our Miners Say
            </h2>
            <p style={{ fontSize: 13, color: "#555", maxWidth: 400, margin: "0 auto 14px" }}>
              Join thousands of satisfied users earning Bitcoin with TeslaMine
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Stars count={5} />
              <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif" }}>4.9</span>
              <span style={{ fontSize: 11, color: "#555" }}>from 2,400+ reviews</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} t={t} delay={i * 80} />
            ))}
          </div>
        </section>

        {/* PARTNERS */}
        <section id="partners" style={{ padding: isMobile ? "40px 16px" : "70px 40px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, textTransform: "uppercase" }}>Trusted by Industry Leaders</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {PARTNERS.map(({ name, symbol }) => (
              <div key={name} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 16, marginBottom: 5, color: "#444" }}>{symbol}</div>
                <div style={{ fontSize: 10, color: "#555", fontWeight: 600 }}>{name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: isMobile ? "40px 16px" : "70px 40px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 10, color: "#e31937", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Simple Process</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: isMobile ? 24 : 40, letterSpacing: -0.5 }}>
              Mine in <span style={{ color: "#e31937" }}>3 Steps</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {[
              { step: "01", title: "Create Account", desc: "Sign up for free in seconds. No credit card required, no hardware to buy." },
              { step: "02", title: "Activate Mining", desc: "Hit Start Mining on your dashboard. Your nodes begin hashing immediately." },
              { step: "03", title: "Withdraw Earnings", desc: "Once you hit $1000, withdraw to BTC, ETH, SOL or USDT within hours." },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "24px 20px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#e31937,transparent)", opacity: 0.6 }} />
                <div style={{ fontSize: 40, fontWeight: 900, color: "rgba(227,25,55,0.12)", fontFamily: "'Syne',sans-serif", lineHeight: 1, marginBottom: 10 }}>{step}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{title}</div>
                <p style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={{ padding: isMobile ? "40px 16px 60px" : "80px 40px 100px", textAlign: "center" }}>
          <div style={{ maxWidth: 560, margin: "0 auto", background: "rgba(227,25,55,0.06)", border: "1px solid rgba(227,25,55,0.15)", borderRadius: 20, padding: isMobile ? "36px 20px" : "56px 48px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#e31937,transparent)" }} />
            <TeslaLogo size={44} color="#e31937" />
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: isMobile ? 24 : 36, letterSpacing: -0.5, marginTop: 16, marginBottom: 12 }}>
              Ready to Start Mining?
            </h2>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 28, lineHeight: 1.7 }}>
              Join 25,000+ miners already earning free Bitcoin daily. No hardware needed. Start in under 60 seconds.
            </p>
            <button onClick={onStart} style={{
              padding: isMobile ? "14px 28px" : "16px 48px",
              borderRadius: 12, fontWeight: 700, fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              background: "linear-gradient(135deg,#aa0000,#e31937)",
              color: "#fff", letterSpacing: 0.5,
              boxShadow: "0 6px 24px rgba(227,25,55,0.4)",
              width: isMobile ? "100%" : "auto", whiteSpace: "nowrap",
            }}>
              ⚡ Start Free Bitcoin Mining
            </button>
            <div style={{ marginTop: 16, fontSize: 11, color: "#444" }}>
              Free forever · No setup fees · Withdraw anytime after $50
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: isMobile ? "24px 16px" : "28px 40px", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TeslaLogo size={20} color="#333" />
            <span style={{ fontSize: 11, color: "#2a2a2a", fontWeight: 600 }}>TESLA<span style={{ color: "#4a0a0a" }}>MINE</span></span>
          </div>
          <span style={{ fontSize: 10, color: "#222", textAlign: "center" }}>Crypto Mining · Digital System · © 2026 TeslaMine</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy", "Terms", "Support"].map(l => (
              <span key={l} style={{ fontSize: 11, color: "#2a2a2a", cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
