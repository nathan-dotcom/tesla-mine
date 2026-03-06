"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const AUTH_KEY = "teslamine_auth";
const USERS_KEY = "teslamine_users";

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
  catch { return []; }
}
function saveUsers(users) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch {}
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); }
  catch { return null; }
}
function saveSession(user) {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); } catch {}
}
function clearSession() {
  try { localStorage.removeItem(AUTH_KEY); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
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

const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const validatePassword = (p) => p.length >= 8;
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateRef = () => "TM" + Math.random().toString(36).substr(2, 6).toUpperCase();

// ─────────────────────────────────────────────────────────────────────────────
// TESLA LOGO
// ─────────────────────────────────────────────────────────────────────────────
function TeslaLogo({ size = 32, color = "#e31937" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 342 342" xmlns="http://www.w3.org/2000/svg">
      <circle cx="171" cy="171" r="171" fill={color} fillOpacity="0.12" />
      <path d="M171 68l-13.5 30c8-1.8 18-2.7 13.5-2.7 0 0-4.5.9 13.5 2.7 9 0 19-.9 27-2.7L198 68c-11.7-2.7-15.3-2.7-27 0zM108 83C90 89 67.5 101 54 117c18 1.8 34-1.8 50-10L108 83zM234 83l3.6 24c16 8 32 12 50 10C274 101 251 89 234 83zM171 104c-23 0-54 5.4-72 14.4C108 212 140 256 171 274c31-18 63-62 72-155.6-18-9-49-14.4-72-14.4z" fill={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT FIELD
// ─────────────────────────────────────────────────────────────────────────────
function InputField({ label, type = "text", value, onChange, placeholder, error, icon, rightEl }) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPass ? "text" : "password") : type;

  return (
    <div style={{ marginBottom: 18 }}>
      {label && <label style={{ display: "block", fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: focused ? "#e31937" : "#444", transition: "color 0.2s", pointerEvents: "none" }}>{icon}</span>
        )}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: `13px ${isPassword || rightEl ? "44px" : "16px"} 13px ${icon ? "42px" : "16px"}`,
            background: focused ? "rgba(227,25,55,0.05)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${error ? "#ff4455" : focused ? "rgba(227,25,55,0.4)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 12,
            color: "#fff",
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            outline: "none",
            transition: "all 0.2s",
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#444", padding: 0 }}>
            {showPass ? "🙈" : "👁"}
          </button>
        )}
        {rightEl && !isPassword && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>{rightEl}</div>
        )}
      </div>
      {error && <div style={{ fontSize: 11, color: "#ff4455", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>⚠ {error}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function PrimaryBtn({ children, onClick, loading, disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%", padding: "14px 0", borderRadius: 12,
        background: disabled ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#aa0000,#e31937)",
        color: disabled ? "#333" : "#fff",
        fontWeight: 700, fontSize: 14,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: 0.5,
        boxShadow: disabled ? "none" : "0 4px 20px rgba(227,25,55,0.35)",
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none", outline: "none",
        transition: "all 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        ...style,
      }}
    >
      {loading ? (
        <>
          <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
          Processing...
        </>
      ) : children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD STRENGTH
// ─────────────────────────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special character", pass: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ["#ff4455", "#ff6b35", "#ffaa00", "#00c896"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score - 1] : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: colors[score - 1] || "#444" }}>{score > 0 ? labels[score - 1] : ""}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {checks.map(({ label, pass }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: pass ? "#00c896" : "#444" }}>
            <span>{pass ? "✓" : "○"}</span>{label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP INPUT
// ─────────────────────────────────────────────────────────────────────────────
function OTPInput({ value, onChange, length = 6 }) {
  const inputs = useRef([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleKey = (i, e) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[i] = val;
    onChange(newDigits.join(""));
    if (val && i < length - 1) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length));
    inputs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleKey(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: 48, height: 56, textAlign: "center",
            fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
            background: d ? "rgba(227,25,55,0.1)" : "rgba(255,255,255,0.03)",
            border: `2px solid ${d ? "rgba(227,25,55,0.5)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 12, color: "#fff", outline: "none",
            transition: "all 0.2s",
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function AuthLayout({ children, title, subtitle, isMobile }) {
  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'JetBrains Mono', monospace", color: "#fff", display: "flex", flexDirection: isMobile ? "column" : "row", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; border:none; outline:none; }
        input::placeholder { color:#2a2a2a; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1e1e2e; border-radius:4px; }
      `}</style>

      {/* BG effects */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: -300, left: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(227,25,55,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(227,25,55,0.04) 0%,transparent 70%)", pointerEvents: "none" }} />

      {/* LEFT PANEL — desktop only */}
      {!isMobile && (
        <div style={{ width: "45%", background: "rgba(227,25,55,0.04)", borderRight: "1px solid rgba(227,25,55,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 48px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 1, background: "linear-gradient(180deg,transparent,rgba(227,25,55,0.3),transparent)" }} />

          <div style={{ animation: "float 5s ease-in-out infinite", marginBottom: 40 }}>
            <TeslaLogo size={80} color="#e31937" />
          </div>

          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 36, letterSpacing: -1.5, textAlign: "center", marginBottom: 16, lineHeight: 1.1 }}>
            TESLA<span style={{ color: "#e31937" }}>MINE</span>
          </h1>
          <p style={{ fontSize: 14, color: "#555", textAlign: "center", lineHeight: 1.8, maxWidth: 300, marginBottom: 48 }}>
            Powered by Tesla's surplus energy grid. Mine Bitcoin without hardware. Withdraw anytime.
          </p>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 320 }}>
            {[
              { label: "Active Miners", value: "25,000+" },
              { label: "Total Paid Out", value: "$4.2M+" },
              { label: "Pool Uptime",   value: "99.3%" },
              { label: "Hashrate",      value: "532 TH/s" },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#e31937", fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", gap: 16, marginTop: 40, flexWrap: "wrap", justifyContent: "center" }}>
            {["CertiK Audited", "SSL Secured", "24/7 Support"].map(b => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#444" }}>
                <span style={{ color: "#00c896" }}>✓</span>{b}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RIGHT PANEL — form */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "40px 20px" : "40px 48px", overflowY: "auto" }}>

        {/* Mobile logo */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <TeslaLogo size={32} color="#e31937" />
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>TESLA<span style={{ color: "#e31937" }}>MINE</span></span>
          </div>
        )}

        <div style={{ width: "100%", maxWidth: 400, animation: "fadeIn 0.5s ease" }}>
          {title && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: isMobile ? 26 : 30, letterSpacing: -0.5, marginBottom: 8 }}>{title}</h2>
              {subtitle && <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN: REGISTER
// ─────────────────────────────────────────────────────────────────────────────
function RegisterScreen({ onLogin, onVerifyEmail }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", referral: "", agree: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  function validate() {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Enter your full name";
    if (!validateEmail(form.email)) e.email = "Enter a valid email address";
    if (!validatePassword(form.password)) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    if (!form.agree) e.agree = "You must accept the terms";
    // Check duplicate email
    const users = getUsers();
    if (users.find(u => u.email === form.email)) e.email = "An account with this email already exists";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const otp = generateOTP();
      const user = {
        id: Date.now(),
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        referral: form.referral || generateRef(),
        verified: false,
        createdAt: Date.now(),
        otp,
      };
      const users = getUsers();
      users.push(user);
      saveUsers(users);
      setLoading(false);
      onVerifyEmail({ email: form.email, otp, mode: "verify" });
    }, 1400);
  }

  return (
    <AuthLayout isMobile={isMobile} title="Create Account" subtitle="Join 25,000+ miners earning free Bitcoin daily.">
      <InputField label="Full Name" value={form.name} onChange={set("name")} placeholder="Nathy Codes" icon="👤" error={errors.name} />
      <InputField label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" icon="✉" error={errors.email} />
      <InputField label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 characters" icon="🔒" error={errors.password} />
      <PasswordStrength password={form.password} />
      <InputField label="Confirm Password" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" icon="🔒" error={errors.confirm} />
      <InputField label="Referral Code (optional)" value={form.referral} onChange={set("referral")} placeholder="e.g. TM4X9KR" icon="🎁" />

      {/* Terms */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={form.agree} onChange={set("agree")} style={{ marginTop: 2, accentColor: "#e31937", width: 15, height: 15 }} />
          <span style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>
            I agree to the <span style={{ color: "#e31937", cursor: "pointer" }}>Terms of Service</span> and <span style={{ color: "#e31937", cursor: "pointer" }}>Privacy Policy</span>
          </span>
        </label>
        {errors.agree && <div style={{ fontSize: 11, color: "#ff4455", marginTop: 5 }}>⚠ {errors.agree}</div>}
      </div>

      <PrimaryBtn onClick={handleSubmit} loading={loading}>Create My Account →</PrimaryBtn>

      <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#555" }}>
        Already have an account?{" "}
        <span onClick={onLogin} style={{ color: "#e31937", cursor: "pointer", fontWeight: 600 }}>Sign In</span>
      </div>
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN: LOGIN
// ─────────────────────────────────────────────────────────────────────────────
function LoginScreen({ onRegister, onForgot, onSuccess }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  function validate() {
    const e = {};
    if (!validateEmail(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Enter your password";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setGlobalError("");
    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.email === form.email && u.password === form.password);
      if (!user) {
        setGlobalError("Incorrect email or password. Please try again.");
        setLoading(false);
        return;
      }
      if (!user.verified) {
        setGlobalError("Please verify your email first. Check your inbox.");
        setLoading(false);
        return;
      }
      saveSession({ id: user.id, name: user.name, email: user.email, referral: user.referral });
      setLoading(false);
      onSuccess(user);
    }, 1200);
  }

  return (
    <AuthLayout isMobile={isMobile} title="Welcome Back" subtitle="Sign in to your TeslaMine account to continue mining.">

      {globalError && (
        <div style={{ background: "rgba(255,68,85,0.1)", border: "1px solid rgba(255,68,85,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#ff6b6b", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span>⚠</span> {globalError}
        </div>
      )}

      <InputField label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" icon="✉" error={errors.email} />
      <InputField label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Your password" icon="🔒" error={errors.password} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#555" }}>
          <input type="checkbox" checked={form.remember} onChange={set("remember")} style={{ accentColor: "#e31937" }} />
          Remember me
        </label>
        <span onClick={onForgot} style={{ fontSize: 12, color: "#e31937", cursor: "pointer", fontWeight: 600 }}>Forgot Password?</span>
      </div>

      <PrimaryBtn onClick={handleSubmit} loading={loading}>Sign In →</PrimaryBtn>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        <span style={{ fontSize: 11, color: "#333" }}>OR</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Demo login */}
      <button
        onClick={() => {
          // Create a demo user if needed and log in
          const users = getUsers();
          let demo = users.find(u => u.email === "demo@teslamine.com");
          if (!demo) {
            demo = { id: 99999, name: "Demo User", email: "demo@teslamine.com", password: "Demo1234!", referral: "TMDEMO1", verified: true, createdAt: Date.now() };
            users.push(demo);
            saveUsers(users);
          }
          saveSession({ id: demo.id, name: demo.name, email: demo.email, referral: demo.referral });
          onSuccess(demo);
        }}
        style={{ width: "100%", padding: "13px 0", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#888", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, marginBottom: 20 }}
      >
        🚀 Try Demo Account
      </button>

      <div style={{ textAlign: "center", fontSize: 13, color: "#555" }}>
        Don't have an account?{" "}
        <span onClick={onRegister} style={{ color: "#e31937", cursor: "pointer", fontWeight: 600 }}>Create one free</span>
      </div>
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN: VERIFY EMAIL (OTP)
// ─────────────────────────────────────────────────────────────────────────────
function VerifyEmailScreen({ email, otp: expectedOtp, onSuccess, onBack, mode = "verify" }) {
  const isMobile = useIsMobile();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleVerify() {
    if (otp.length < 6) { setError("Enter the 6-digit code"); return; }
    if (otp !== expectedOtp) { setError("Incorrect code. Please try again."); return; }
    setLoading(true);
    setTimeout(() => {
      const users = getUsers();
      const idx = users.findIndex(u => u.email === email);
      if (idx !== -1) { users[idx].verified = true; saveUsers(users); }
      setLoading(false);
      onSuccess();
    }, 1000);
  }

  function handleResend() {
    setResent(true);
    setCountdown(60);
    setError("");
    setOtp("");
    setTimeout(() => setResent(false), 3000);
  }

  const title = mode === "reset" ? "Check Your Email" : "Verify Your Email";
  const subtitle = `We sent a 6-digit code to ${email}. Enter it below to ${mode === "reset" ? "reset your password" : "activate your account"}.`;

  return (
    <AuthLayout isMobile={isMobile} title={title} subtitle={subtitle}>

      {/* Email preview */}
      <div style={{ background: "rgba(227,25,55,0.06)", border: "1px solid rgba(227,25,55,0.15)", borderRadius: 12, padding: "14px 18px", marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>📧</span>
        <div>
          <div style={{ fontSize: 12, color: "#888" }}>Code sent to</div>
          <div style={{ fontSize: 14, color: "#e31937", fontWeight: 600 }}>{email}</div>
        </div>
      </div>

      {/* Demo hint */}
      <div style={{ background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 11, color: "#00c896" }}>
        💡 Demo mode: your code is <strong style={{ letterSpacing: 2 }}>{expectedOtp}</strong>
      </div>

      <OTPInput value={otp} onChange={setOtp} length={6} />

      {error && (
        <div style={{ background: "rgba(255,68,85,0.08)", border: "1px solid rgba(255,68,85,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#ff6b6b" }}>
          ⚠ {error}
        </div>
      )}

      <PrimaryBtn onClick={handleVerify} loading={loading} disabled={otp.length < 6}>
        {mode === "reset" ? "Verify & Reset Password" : "Verify Email →"}
      </PrimaryBtn>

      <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#555" }}>
        {countdown > 0 ? (
          <span>Resend code in <span style={{ color: "#e31937" }}>{countdown}s</span></span>
        ) : (
          <span onClick={handleResend} style={{ color: "#e31937", cursor: "pointer", fontWeight: 600 }}>
            {resent ? "✓ Code resent!" : "Resend Code"}
          </span>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <span onClick={onBack} style={{ fontSize: 12, color: "#444", cursor: "pointer" }}>← Go back</span>
      </div>
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN: FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
function ForgotPasswordScreen({ onBack, onOTP }) {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    if (!validateEmail(email)) { setError("Enter a valid email address"); return; }
    setLoading(true);
    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.email === email);
      if (!user) {
        setError("No account found with this email address.");
        setLoading(false);
        return;
      }
      const otp = generateOTP();
      user.resetOtp = otp;
      saveUsers(users);
      setLoading(false);
      onOTP({ email, otp });
    }, 1200);
  }

  return (
    <AuthLayout isMobile={isMobile} title="Forgot Password?" subtitle="No worries! Enter your email and we'll send you a reset code.">

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🔑</div>
      </div>

      <InputField
        label="Email Address"
        type="email"
        value={email}
        onChange={e => { setEmail(e.target.value); setError(""); }}
        placeholder="you@example.com"
        icon="✉"
        error={error}
      />

      <PrimaryBtn onClick={handleSubmit} loading={loading} disabled={!email}>
        Send Reset Code →
      </PrimaryBtn>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <span onClick={onBack} style={{ fontSize: 13, color: "#555", cursor: "pointer" }}>
          ← Back to Sign In
        </span>
      </div>
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN: RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
function ResetPasswordScreen({ email, onSuccess, onBack }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  function handleSubmit() {
    const e = {};
    if (!validatePassword(form.password)) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      const users = getUsers();
      const idx = users.findIndex(u => u.email === email);
      if (idx !== -1) { users[idx].password = form.password; delete users[idx].resetOtp; saveUsers(users); }
      setLoading(false);
      setDone(true);
      setTimeout(onSuccess, 2000);
    }, 1200);
  }

  if (done) {
    return (
      <AuthLayout isMobile={isMobile} title="Password Reset!" subtitle="Your password has been updated successfully.">
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <div style={{ fontSize: 14, color: "#555" }}>Redirecting you to login...</div>
          <div style={{ marginTop: 20, width: 40, height: 4, background: "#e31937", borderRadius: 2, animation: "growBar 2s linear forwards", margin: "20px auto 0" }} />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout isMobile={isMobile} title="Set New Password" subtitle={`Create a strong password for ${email}`}>
      <InputField label="New Password" type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 characters" icon="🔒" error={errors.password} />
      <PasswordStrength password={form.password} />
      <InputField label="Confirm New Password" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat new password" icon="🔒" error={errors.confirm} />

      <PrimaryBtn onClick={handleSubmit} loading={loading} disabled={!form.password || !form.confirm}>
        Reset Password →
      </PrimaryBtn>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <span onClick={onBack} style={{ fontSize: 12, color: "#444", cursor: "pointer" }}>← Back</span>
      </div>
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN: SUCCESS (post-register)
// ─────────────────────────────────────────────────────────────────────────────
function SuccessScreen({ user, onContinue }) {
  const isMobile = useIsMobile();
  useEffect(() => {
    saveSession({ id: user.id, name: user.name, email: user.email, referral: user.referral });
  }, []);

  return (
    <AuthLayout isMobile={isMobile} title="" subtitle="">
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 64, marginBottom: 20, animation: "float 3s ease-in-out infinite" }}>🎉</div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 28, marginBottom: 10 }}>
          Welcome, <span style={{ color: "#e31937" }}>{user.name.split(" ")[0]}!</span>
        </h2>
        <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginBottom: 28 }}>
          Your account is verified and ready. Your referral code is:
        </p>
        <div style={{ background: "rgba(227,25,55,0.08)", border: "1px solid rgba(227,25,55,0.2)", borderRadius: 12, padding: "16px 24px", marginBottom: 28, display: "inline-block" }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>YOUR REFERRAL CODE</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#e31937", letterSpacing: 4 }}>{user.referral}</div>
        </div>
        <div style={{ marginBottom: 28 }}>
          {[
            "🔴 4 mining nodes assigned to your account",
            "⚡ Tesla energy grid connected",
            "💸 $1000 minimum withdrawal unlocked on first earning",
          ].map(item => (
            <div key={item} style={{ fontSize: 13, color: "#666", marginBottom: 8, textAlign: "left" }}>✓ {item}</div>
          ))}
        </div>
        <PrimaryBtn onClick={onContinue}>⚡ Start Mining Now →</PrimaryBtn>
      </div>
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN AUTH COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AuthPage({ onAuthenticated }) {
  const [screen, setScreen] = useState("login");
  const [context, setContext] = useState({});

  // Check existing session on mount
  useEffect(() => {
    const session = getSession();
    if (session) onAuthenticated(session);
  }, []);

  const go = (s, ctx = {}) => { setContext(ctx); setScreen(s); };

  if (screen === "register") {
    return (
      <RegisterScreen
        onLogin={() => go("login")}
        onVerifyEmail={(ctx) => go("verify-email", ctx)}
      />
    );
  }

  if (screen === "verify-email") {
    return (
      <VerifyEmailScreen
        email={context.email}
        otp={context.otp}
        mode={context.mode || "verify"}
        onSuccess={() => {
          if (context.mode === "reset") {
            go("reset-password", { email: context.email });
          } else {
            const users = getUsers();
            const user = users.find(u => u.email === context.email);
            go("success", user);
          }
        }}
        onBack={() => go(context.mode === "reset" ? "forgot" : "register")}
      />
    );
  }

  if (screen === "forgot") {
    return (
      <ForgotPasswordScreen
        onBack={() => go("login")}
        onOTP={(ctx) => go("verify-email", { ...ctx, mode: "reset" })}
      />
    );
  }

  if (screen === "reset-password") {
    return (
      <ResetPasswordScreen
        email={context.email}
        onSuccess={() => go("login")}
        onBack={() => go("forgot")}
      />
    );
  }

  if (screen === "success") {
    return (
      <SuccessScreen
        user={context}
        onContinue={() => onAuthenticated(context)}
      />
    );
  }

  // Default: login
  return (
    <LoginScreen
      onRegister={() => go("register")}
      onForgot={() => go("forgot")}
      onSuccess={(user) => onAuthenticated(user)}
    />
  );
}

// Export logout helper for use in dashboard
export { clearSession, getSession };