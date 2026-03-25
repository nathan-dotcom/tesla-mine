"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || "https://gxihfrjvgecfoktatlnc.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_C8s87X99DFrRxMP-xIEG-Q_A-R53eHH";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE HELPERS  (used by page.jsx and ProfileSettings)
// ─────────────────────────────────────────────────────────────────────────────
const PROFILE_STORAGE_KEY = "teslamine_profiles";

export function saveProfileLocal(userId, data) {
  try {
    const all = getAllProfiles();
    all[userId] = { ...data, userId, completedAt: Date.now() };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function loadProfile(userId) {
  try { return getAllProfiles()[userId] || null; }
  catch { return null; }
}

export function getAllProfiles() {
  try {
    const r = localStorage.getItem(PROFILE_STORAGE_KEY);
    return r ? JSON.parse(r) : {};
  } catch { return {}; }
}

export function isProfileComplete(userId) {
  const p = loadProfile(userId);
  if (!p) return false;
  return REQUIRED_FIELDS.every(f => p[f.key] && String(p[f.key]).trim().length > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE UPSERT
// ─────────────────────────────────────────────────────────────────────────────
async function pushProfileToSupabase(userId, email, referralCode, form) {
  try {
    const { error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id:       userId,
          email:         email || "",
          name:          `${form.firstName} ${form.lastName}`.trim(),
          first_name:    form.firstName    || "",
          last_name:     form.lastName     || "",
          street_number: form.streetNumber || "",
          street_name:   form.streetName   || "",
          city:          form.city         || "",
          country:       form.country      || "",
          post_code:     form.postCode     || "",
          region:        form.region       || "",
          phone:         form.phone        || "",
          referral_code: referralCode      || "",
          updated_at:    new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    if (error) { console.error("[Supabase] profile upsert:", error.message); return false; }
    return true;
  } catch (err) {
    console.error("[Supabase] profile exception:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELDS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
export const REQUIRED_FIELDS = [
  { key: "firstName",    label: "First Name",       placeholder: "John",            type: "text" },
  { key: "lastName",     label: "Last Name",        placeholder: "Doe",             type: "text" },
  { key: "streetNumber", label: "Street Number",    placeholder: "42",              type: "text" },
  { key: "streetName",   label: "Street Name",      placeholder: "Elm Street",      type: "text" },
  { key: "city",         label: "City / Town",      placeholder: "New York",        type: "text" },
  { key: "country",      label: "Country",          placeholder: "United States",   type: "text" },
  { key: "postCode",     label: "Post Code",        placeholder: "10001",           type: "text" },
  { key: "region",       label: "Country / Region", placeholder: "New York State",  type: "text" },
  { key: "phone",        label: "Phone Number",     placeholder: "+1 555 000 0000", type: "tel"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function TeslaLogo({ size = 32, color = "#e31937" }) {
  return (
    <img src="/favicon-512.png" alt="Tesla" style={{
      width: size, height: size, objectFit: "contain",
      filter: color === "#e31937" || color === "#cc0000" || color === "#aa0000"
        ? "none"
        : color === "#222" || color === "#333" ? "brightness(0.15)" : "none",
      display: "inline-block", flexShrink: 0,
    }} />
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileCompletionGate({ user, onComplete }) {
  const isMobile = useIsMobile();

  const [form, setForm] = useState(() => {
    const saved = loadProfile(user?.id);
    const base = {};
    REQUIRED_FIELDS.forEach(f => { base[f.key] = saved?.[f.key] || ""; });
    return base;
  });

  const [errors,    setErrors]    = useState({});
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(false);
  const [syncState, setSyncState] = useState("idle"); // idle | syncing | synced | error

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: "" }));
  };

  function validate() {
    const e = {};
    REQUIRED_FIELDS.forEach(f => {
      if (!form[f.key] || !String(form[f.key]).trim())
        e[f.key] = `${f.label} is required`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    // Step 1 — persist locally right away so gate passes
    saveProfileLocal(user?.id, { ...form, email: user?.email || "", name: user?.name || "" });

    // Step 2 — push to Supabase
    setSyncState("syncing");
    const ok = await pushProfileToSupabase(user?.id, user?.email, user?.referral, form);
    setSyncState(ok ? "synced" : "error");

    setDone(true);
    setTimeout(() => onComplete(form), 1400);
  }

  const filled   = REQUIRED_FIELDS.filter(f => form[f.key]?.trim()).length;
  const progress = (filled / REQUIRED_FIELDS.length) * 100;
  const cardBox  = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'JetBrains Mono',monospace", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; border:none; outline:none; }
        input::placeholder { color:#2a2a2a; }
        input:focus { outline:none; border-color:rgba(227,25,55,0.45)!important; background:rgba(227,25,55,0.04)!important; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1e1e2e; border-radius:4px; }
      `}</style>

      {/* BG grid */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: -280, left: "50%", transform: "translateX(-50%)", width: 600, height: 360, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(227,25,55,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto", padding: isMobile ? "0 16px 64px" : "0 28px 64px" }}>

        {/* HEADER */}
        <header style={{ padding: isMobile ? "20px 0 16px" : "28px 0 22px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 28, animation: "fadeIn 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <TeslaLogo size={isMobile ? 32 : 42} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#e31937", boxShadow: "0 0 8px #e31937", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 9, color: "#e31937", letterSpacing: 3, textTransform: "uppercase" }}>Profile Setup Required</span>
              </div>
              <h1 style={{ fontSize: isMobile ? 18 : 24, fontFamily: "'Syne',sans-serif", fontWeight: 800, letterSpacing: -0.5 }}>
                TESLA<span style={{ color: "#e31937" }}>MINE</span>
                <span style={{ color: "#2a2a2a", fontSize: isMobile ? 12 : 15, fontWeight: 400 }}> / Complete Profile</span>
              </h1>
            </div>
          </div>
        </header>

        {/* BANNER */}
        <div style={{ background: "rgba(227,25,55,0.07)", border: "1px solid rgba(227,25,55,0.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 14, alignItems: "flex-start", animation: "fadeIn 0.4s ease 0.05s both" }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🛡️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e31937", marginBottom: 4 }}>Profile Completion Required Before Mining</div>
            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>
              You must complete your full profile before you can start mining. All fields are mandatory and used for identity verification and withdrawal processing.
            </div>
          </div>
        </div>

        {/* PROGRESS */}
        <div style={{ ...cardBox, padding: "14px 20px", marginBottom: 24, animation: "fadeIn 0.4s ease 0.1s both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#555" }}>Profile Completion</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: filled === REQUIRED_FIELDS.length ? "#00c896" : "#e31937" }}>
              {filled} / {REQUIRED_FIELDS.length} fields
            </span>
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? "linear-gradient(90deg,#006644,#00c896)" : "linear-gradient(90deg,#aa0000,#e31937)", borderRadius: 3, transition: "width 0.3s ease" }} />
          </div>
        </div>

        {/* FORM */}
        <div style={{ ...cardBox, padding: isMobile ? "20px 18px" : "32px 32px", animation: "fadeIn 0.4s ease 0.15s both" }}>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>
            Personal Information — All Fields Required
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 14 : 18 }}>
            {REQUIRED_FIELDS.map(field => (
              <div key={field.key}>
                <label style={{ fontSize: 10, color: errors[field.key] ? "#ff4455" : "#555", letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 7, fontWeight: 600 }}>
                  {field.label} <span style={{ color: "#e31937" }}>*</span>
                </label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={set(field.key)}
                  placeholder={field.placeholder}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 11,
                    background: errors[field.key] ? "rgba(255,68,85,0.05)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${errors[field.key] ? "rgba(255,68,85,0.5)" : "rgba(255,255,255,0.08)"}`,
                    color: "#fff", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s",
                  }}
                />
                {errors[field.key] && (
                  <div style={{ fontSize: 10, color: "#ff4455", marginTop: 5 }}>⚠ {errors[field.key]}</div>
                )}
              </div>
            ))}
          </div>

          {/* Account strip + sync status */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 16px", marginTop: 22, marginBottom: 24, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14 }}>👤</span>
            <span style={{ fontSize: 11, color: "#444" }}>
              Completing profile for <span style={{ color: "#ccc" }}>{user?.email}</span>
            </span>
            {syncState === "syncing" && (
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, border: "2px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Syncing to server...
              </span>
            )}
            {syncState === "synced" && (
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#00c896" }}>✓ Synced to Supabase</span>
            )}
            {syncState === "error" && (
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#f59e0b" }}>⚠ Saved locally — will retry on next login</span>
            )}
          </div>

          {/* BUTTON */}
          {done ? (
            <div style={{ padding: "15px 0", borderRadius: 12, background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.3)", color: "#00c896", fontWeight: 700, fontSize: 14, textAlign: "center" }}>
              ✓ Profile Saved — Launching Dashboard...
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: "100%", padding: "15px 0", borderRadius: 12,
                background: saving ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#aa0000,#e31937)",
                color: saving ? "#333" : "#fff", fontWeight: 700, fontSize: 14,
                fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5,
                boxShadow: saving ? "none" : "0 4px 20px rgba(227,25,55,0.35)",
                cursor: saving ? "not-allowed" : "pointer", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {saving ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  Saving Profile...
                </>
              ) : "⚡ Save Profile & Start Mining →"}
            </button>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span style={{ fontSize: 11, color: "#2a2a2a" }}>🔒 Data is encrypted and used solely for identity verification and withdrawal processing</span>
        </div>
      </div>
    </div>
  );
}