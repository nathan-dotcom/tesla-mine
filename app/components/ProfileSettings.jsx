"use client";
import { useState, useEffect } from "react";
import { loadProfile, getAllProfiles, REQUIRED_FIELDS } from "./ProfileCompletionGate";

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

function Toggle({ on, onToggle, color = "#00c896" }) {
  return (
    <div onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 12, background: on ? color : "rgba(255,255,255,0.08)", border: `1px solid ${on ? color : "rgba(255,255,255,0.1)"}`, position: "relative", cursor: "pointer", transition: "all 0.3s", flexShrink: 0, boxShadow: on ? `0 0 12px ${color}44` : "none" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: on ? 22 : 2, transition: "left 0.3s", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }} />
    </div>
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

export default function ProfileSettings({ onBack, user, onLogout }) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("profile");
  const [twoFa, setTwoFa] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [withdrawAlerts, setWithdrawAlerts] = useState(true);
  const [miningAlerts, setMiningAlerts] = useState(false);
  const [saved, setSaved] = useState(false);
  const [kycStatus, setKycStatus] = useState("unverified"); // unverified | pending | verified
  const [showPwChange, setShowPwChange] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, backdropFilter: "blur(12px)" };

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handlePwSave() {
    if (!oldPw || !newPw) return;
    setPwSaved(true);
    setOldPw(""); setNewPw("");
    setTimeout(() => { setPwSaved(false); setShowPwChange(false); }, 2000);
  }

  const tabs = ["profile", "security", "notifications"];

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'JetBrains Mono', monospace", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; border:none; outline:none; }
        input { outline:none; }
        input::placeholder { color:#2a2a2a; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1e1e2e; border-radius:4px; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 28px 48px" }}>

        {/* HEADER */}
        <header style={{ padding: isMobile ? "18px 0 14px" : "24px 0 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, animation: "fadeIn 0.4s ease" }}>
          <button onClick={onBack} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#666", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>
            ← Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TeslaLogo size={28} color="#e31937" />
            <div>
              <div style={{ fontSize: 9, color: "#6366f1", letterSpacing: 3, textTransform: "uppercase", marginBottom: 1 }}>Account Management</div>
              <h1 style={{ fontSize: isMobile ? 18 : 22, fontFamily: "'Syne',sans-serif", fontWeight: 800, letterSpacing: -0.5 }}>
                PROFILE & <span style={{ color: "#e31937" }}>SETTINGS</span>
              </h1>
            </div>
          </div>
        </header>

        {/* Avatar + name */}
        <div style={{ ...card, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 18, animation: "fadeIn 0.4s ease 0.05s both" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#aa0000,#e31937)", border: "3px solid rgba(227,25,55,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", boxShadow: "0 0 20px rgba(227,25,55,0.3)", flexShrink: 0 }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "M"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif", marginBottom: 3 }}>{user?.name || "Miner"}</div>
            <div style={{ fontSize: 12, color: "#555" }}>{user?.email || "user@example.com"}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.25)", color: "#00c896" }}>✓ Active Miner</span>
              <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: kycStatus === "verified" ? "rgba(0,200,150,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${kycStatus === "verified" ? "rgba(0,200,150,0.25)" : "rgba(245,158,11,0.25)"}`, color: kycStatus === "verified" ? "#00c896" : "#f59e0b" }}>
                {kycStatus === "verified" ? "✓ KYC Verified" : kycStatus === "pending" ? "⏳ KYC Pending" : "⚠ KYC Unverified"}
              </span>
              {twoFa && <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#6366f1" }}>🔐 2FA ON</span>}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "9px 16px", borderRadius: 10, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s", background: activeTab === t ? "rgba(227,25,55,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${activeTab === t ? "rgba(227,25,55,0.3)" : "rgba(255,255,255,0.06)"}`, color: activeTab === t ? "#e31937" : "#444", textTransform: "capitalize" }}>
              {{ profile: "👤 Profile", security: "🔐 Security", notifications: "🔔 Notifications" }[t]}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, animation: "fadeIn 0.4s ease" }}>
            <div style={{ ...card, padding: 24 }}>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 }}>Personal Info</div>
              {(() => {
                const profile = loadProfile(user?.id);
                const fields = [
                  { label: "First Name",       value: profile?.firstName    || user?.name?.split(" ")[0] || "" },
                  { label: "Last Name",        value: profile?.lastName     || user?.name?.split(" ")[1] || "" },
                  { label: "Email Address",    value: profile?.email        || user?.email || "" },
                  { label: "Phone Number",     value: profile?.phone        || "" },
                  { label: "Street Number",    value: profile?.streetNumber || "" },
                  { label: "Street Name",      value: profile?.streetName   || "" },
                  { label: "City / Town",      value: profile?.city         || "" },
                  { label: "Country",          value: profile?.country      || "" },
                  { label: "Post Code",        value: profile?.postCode     || "" },
                  { label: "Country / Region", value: profile?.region       || "" },
                ];
                return fields.map(({ label, value }) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 10, color: "#444", letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>
                    <input defaultValue={value} readOnly style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#888", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", cursor: "default" }} />
                  </div>
                ));
              })()}
              <div style={{ background: "rgba(227,25,55,0.06)", border: "1px solid rgba(227,25,55,0.15)", borderRadius: 10, padding: "11px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#e31937", marginBottom: 4 }}>REFERRAL CODE</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#e31937", letterSpacing: 4, fontFamily: "'Syne',sans-serif" }}>{user?.referral || "N/A"}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>Share this code — earn $5 per successful referral</div>
              </div>
              <button onClick={handleSave} style={{ width: "100%", padding: "12px 0", borderRadius: 11, background: saved ? "rgba(0,200,150,0.15)" : "linear-gradient(135deg,#aa0000,#e31937)", border: saved ? "1px solid rgba(0,200,150,0.3)" : "none", color: saved ? "#00c896" : "#fff", fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s" }}>
                {saved ? "✓ Saved!" : "Update Profile"}
              </button>
            </div>

            {/* KYC */}
            <div style={{ ...card, padding: 24 }}>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 }}>KYC Verification</div>
              <div style={{ textAlign: "center", padding: "20px 0 24px" }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>
                  {kycStatus === "verified" ? "✅" : kycStatus === "pending" ? "⏳" : "🪪"}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8, fontFamily: "'Syne',sans-serif" }}>
                  {kycStatus === "verified" ? "Identity Verified" : kycStatus === "pending" ? "Verification Pending" : "Verify Your Identity"}
                </div>
                <div style={{ fontSize: 11, color: "#555", lineHeight: 1.7, maxWidth: 260, margin: "0 auto 20px" }}>
                  {kycStatus === "verified"
                    ? "Your identity has been verified. You have full access to all platform features."
                    : kycStatus === "pending"
                    ? "Your documents are being reviewed. This takes 24–48 hours."
                    : "Complete KYC to unlock higher withdrawal limits and VIP features."}
                </div>
                {kycStatus === "unverified" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {["Government ID / Passport", "Selfie with ID", "Proof of Address"].map((doc, i) => (
                      <div key={doc} style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>📎</span>
                        <span style={{ fontSize: 11, color: "#555", flex: 1, textAlign: "left" }}>{doc}</span>
                        <span style={{ fontSize: 10, color: "#333" }}>Upload</span>
                      </div>
                    ))}
                    <button onClick={() => setKycStatus("pending")} style={{ marginTop: 8, padding: "11px 0", borderRadius: 11, background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", fontWeight: 700, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
                      Submit for Review
                    </button>
                  </div>
                )}
                {kycStatus === "pending" && (
                  <button onClick={() => setKycStatus("verified")} style={{ padding: "11px 24px", borderRadius: 11, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontWeight: 700, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
                    Check Status
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.4s ease" }}>

            {/* 2FA */}
            <div style={{ ...card, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Two-Factor Authentication</div>
                  <div style={{ fontSize: 11, color: "#555" }}>Add an extra layer of security to your account with TOTP-based 2FA.</div>
                </div>
                <Toggle on={twoFa} onToggle={() => setTwoFa(f => !f)} />
              </div>
              {twoFa && (
                <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, padding: "14px 16px", animation: "slideIn 0.3s ease" }}>
                  <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, marginBottom: 8 }}>🔐 2FA is Active</div>
                  <div style={{ fontSize: 10, color: "#555", lineHeight: 1.7 }}>Your account is protected. Use your authenticator app (Google Authenticator or Authy) to generate codes during login.</div>
                </div>
              )}
            </div>

            {/* Password change */}
            <div style={{ ...card, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showPwChange ? 18 : 0 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Change Password</div>
                  <div style={{ fontSize: 11, color: "#555" }}>Update your account password regularly for better security.</div>
                </div>
                <button onClick={() => setShowPwChange(p => !p)} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(227,25,55,0.08)", border: "1px solid rgba(227,25,55,0.2)", color: "#e31937", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
                  {showPwChange ? "Cancel" : "Change"}
                </button>
              </div>
              {showPwChange && (
                <div style={{ animation: "slideIn 0.3s ease" }}>
                  {[
                    { label: "Current Password", val: oldPw, set: setOldPw },
                    { label: "New Password",     val: newPw, set: setNewPw },
                  ].map(({ label, val, set }) => (
                    <div key={label} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 10, color: "#444", letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>
                      <input type="password" value={val} onChange={e => set(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#ccc", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }} />
                    </div>
                  ))}
                  <button onClick={handlePwSave} style={{ width: "100%", padding: "12px 0", borderRadius: 11, background: pwSaved ? "rgba(0,200,150,0.15)" : "linear-gradient(135deg,#aa0000,#e31937)", border: pwSaved ? "1px solid rgba(0,200,150,0.3)" : "none", color: pwSaved ? "#00c896" : "#fff", fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>
                    {pwSaved ? "✓ Password Updated!" : "Update Password"}
                  </button>
                </div>
              )}
            </div>

            {/* Security summary */}
            <div style={{ ...card, padding: 20 }}>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Security Score</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#888" }}>Account Security</span>
                  <span style={{ fontSize: 13, color: twoFa ? "#00c896" : "#f59e0b", fontWeight: 700 }}>{twoFa ? "Strong" : "Moderate"}</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: twoFa ? "85%" : "55%", background: twoFa ? "linear-gradient(90deg,#006644,#00c896)" : "linear-gradient(90deg,#884400,#f59e0b)", borderRadius: 3, transition: "width 0.5s ease" }} />
                </div>
              </div>
              {[
                { label: "Email verified",      done: true },
                { label: "2FA enabled",          done: twoFa },
                { label: "KYC completed",        done: kycStatus === "verified" },
                { label: "Strong password set",  done: true },
              ].map(({ label, done }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: done ? "rgba(0,200,150,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${done ? "rgba(0,200,150,0.3)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: done ? "#00c896" : "#333", flexShrink: 0 }}>
                    {done ? "✓" : "○"}
                  </div>
                  <span style={{ fontSize: 12, color: done ? "#888" : "#444" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div style={{ ...card, padding: 24, animation: "fadeIn 0.4s ease" }}>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Notification Preferences</div>
            {[
              { label: "Email Notifications",  sub: "Receive important account updates via email", val: emailNotifs, set: setEmailNotifs, color: "#6366f1" },
              { label: "Withdrawal Alerts",    sub: "Get notified when withdrawals are processed or updated", val: withdrawAlerts, set: setWithdrawAlerts, color: "#00c896" },
              { label: "Mining Milestones",    sub: "Alerts when your mining reaches key thresholds", val: miningAlerts, set: setMiningAlerts, color: "#e31937" },
            ].map(({ label, sub, val, set, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 11, color: "#444" }}>{sub}</div>
                </div>
                <Toggle on={val} onToggle={() => set(v => !v)} color={color} />
              </div>
            ))}
          </div>
        )}

        {/* DANGER ZONE */}
        <div style={{ ...card, padding: 20, marginTop: 20, background: "rgba(255,68,85,0.03)", border: "1px solid rgba(255,68,85,0.1)", animation: "fadeIn 0.5s ease 0.2s both" }}>
          <div style={{ fontSize: 10, color: "#ff4455", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>⚠ Danger Zone</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={onLogout} style={{ padding: "10px 18px", borderRadius: 10, background: "rgba(255,68,85,0.08)", border: "1px solid rgba(255,68,85,0.2)", color: "#ff4455", fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
              🚪 Sign Out
            </button>
            <button style={{ padding: "10px 18px", borderRadius: 10, background: "rgba(255,68,85,0.04)", border: "1px solid rgba(255,68,85,0.1)", color: "#662222", fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
              🗑 Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}