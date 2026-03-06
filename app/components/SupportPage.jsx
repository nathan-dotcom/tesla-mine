"use client";
import { useState, useEffect, useRef } from "react";

const TICKET_HISTORY = [
  { id: "TK-001", subject: "Withdrawal not processed", status: "Resolved", date: Date.now() - 1000 * 3600 * 48, priority: "High" },
  { id: "TK-002", subject: "KYC document upload issue", status: "Open",     date: Date.now() - 1000 * 3600 * 5,  priority: "Medium" },
];

const BOT_RESPONSES = {
  default: "Thanks for reaching out! Our support team is reviewing your message. Typical response time is under 2 hours. Is there anything specific I can help with right now?",
  withdrawal: "For withdrawal issues: ensure your wallet address is correct, charity proof has been submitted, and your balance meets the $1,000 minimum. If the issue persists, please open a support ticket.",
  mining: "Mining earnings update every few seconds. If your balance isn't updating, try refreshing the page. For persistent issues, our tech team can investigate your account directly.",
  referral: "Referral bonuses are credited daily. You can track them in the Referral page. If a bonus is missing, please note the date and affected referral in a support ticket.",
  kyc: "KYC verification typically takes 1–3 business days. Ensure your documents are clear and fully visible. Blurry or cropped images will be rejected.",
};

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

export default function SupportPage({ onBack }) {
  const [tab, setTab] = useState("chat");
  const [chatMessages, setChatMessages] = useState([
    { role: "bot", text: "👋 Hello! I'm TeslaBot, your support assistant. How can I help you today?", time: Date.now() - 5000 }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", category: "withdrawal", priority: "medium", message: "" });
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, typing]);

  function sendMessage() {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", text: chatInput.trim(), time: Date.now() };
    setChatMessages(m => [...m, userMsg]);
    const input = chatInput.toLowerCase();
    setChatInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = input.includes("withdraw") ? BOT_RESPONSES.withdrawal
        : input.includes("mine") || input.includes("mining") ? BOT_RESPONSES.mining
        : input.includes("refer") ? BOT_RESPONSES.referral
        : input.includes("kyc") || input.includes("verify") ? BOT_RESPONSES.kyc
        : BOT_RESPONSES.default;
      setChatMessages(m => [...m, { role: "bot", text: reply, time: Date.now() }]);
      setTyping(false);
    }, 1200 + Math.random() * 800);
  }

  function submitTicket() {
    if (!ticketForm.subject || !ticketForm.message) return;
    setTicketSubmitted(true);
  }

  const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };
  const statusColor = { Open: "#f59e0b", Resolved: "#00c896", Pending: "#6366f1" };

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'JetBrains Mono', monospace", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dotBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        *{box-sizing:border-box;margin:0;padding:0}
        button{cursor:pointer;border:none;outline:none}
        input,select,textarea{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-family:'JetBrains Mono',monospace;padding:11px 14px;font-size:13px;width:100%;outline:none;resize:none}
        input:focus,select:focus,textarea:focus{border-color:rgba(227,25,55,0.5)}
        select option{background:#0a0d18}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e1e2e;border-radius:4px}
      `}</style>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(227,25,55,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(227,25,55,0.015) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 28px 48px" }}>
        <header style={{ padding: isMobile ? "18px 0 14px" : "24px 0 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#666", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>← Back</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TeslaLogo size={28} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 1 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00c896", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 9, color: "#00c896", letterSpacing: 3, textTransform: "uppercase" }}>Support · Online</span>
              </div>
              <h1 style={{ fontSize: isMobile ? 18 : 22, fontFamily: "'Syne',sans-serif", fontWeight: 800, letterSpacing: -0.5 }}>SUPPORT <span style={{ color: "#2a2a2a", fontSize: 14, fontWeight: 400 }}>/ Help Desk</span></h1>
            </div>
          </div>
        </header>

        {/* TABS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["chat", "ticket", "history"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 20px", borderRadius: 10, fontSize: 12, fontFamily: "'JetBrains Mono',monospace", background: tab === t ? "rgba(227,25,55,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${tab === t ? "rgba(227,25,55,0.3)" : "rgba(255,255,255,0.06)"}`, color: tab === t ? "#e31937" : "#444", textTransform: "capitalize" }}>
              {t === "chat" ? "💬 Live Chat" : t === "ticket" ? "📝 New Ticket" : `🗂 History (${TICKET_HISTORY.length})`}
            </button>
          ))}
        </div>

        {/* ── LIVE CHAT ── */}
        {tab === "chat" && (
          <div style={{ ...card, display: "flex", flexDirection: "column", height: 540, animation: "fadeIn 0.3s ease" }}>
            {/* Chat header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,200,150,0.12)", border: "2px solid rgba(0,200,150,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>TeslaBot</div>
                <div style={{ fontSize: 10, color: "#00c896" }}>● Online · typically replies instantly</div>
              </div>
            </div>

            {/* Quick prompts */}
            <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 6, overflowX: "auto" }}>
              {["Withdrawal issue", "Mining not updating", "Referral bonus missing", "KYC help"].map(prompt => (
                <button key={prompt} onClick={() => { setChatInput(prompt); }} style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 20, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#555" }}>{prompt}</button>
              ))}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn 0.3s ease" }}>
                  <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? "linear-gradient(135deg,#aa0000,#e31937)" : "rgba(255,255,255,0.06)", border: msg.role === "bot" ? "1px solid rgba(255,255,255,0.08)" : "none", fontSize: 13, color: "#fff", lineHeight: 1.6 }}>
                    {msg.text}
                    <div style={{ fontSize: 9, color: msg.role === "user" ? "rgba(255,255,255,0.5)" : "#333", marginTop: 4, textAlign: msg.role === "user" ? "right" : "left" }}>
                      {new Date(msg.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              {typing && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", animation: `dotBounce 1.2s ease ${d * 0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Type your message..." style={{ flex: 1 }} />
              <button onClick={sendMessage} style={{ flexShrink: 0, padding: "11px 18px", borderRadius: 10, background: "linear-gradient(135deg,#aa0000,#e31937)", color: "#fff", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>Send</button>
            </div>
          </div>
        )}

        {/* ── NEW TICKET ── */}
        {tab === "ticket" && (
          <div style={{ ...card, padding: isMobile ? 20 : 28, animation: "fadeIn 0.3s ease" }}>
            {ticketSubmitted ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: "#00c896", marginBottom: 8 }}>Ticket Submitted!</h3>
                <p style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>Your ticket has been received. We'll respond within 2–4 hours via your registered email.</p>
                <button onClick={() => { setTicketSubmitted(false); setTicketForm({ subject: "", category: "withdrawal", priority: "medium", message: "" }); setTab("history"); }} style={{ marginTop: 20, padding: "12px 24px", borderRadius: 12, background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.3)", color: "#00c896", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>View Ticket History</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 22 }}>Open a Support Ticket</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Subject</label>
                    <input value={ticketForm.subject} onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief description of your issue" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Category</label>
                      <select value={ticketForm.category} onChange={e => setTicketForm(f => ({ ...f, category: e.target.value }))}>
                        <option value="withdrawal">Withdrawal</option>
                        <option value="mining">Mining</option>
                        <option value="referral">Referral</option>
                        <option value="kyc">KYC / Verification</option>
                        <option value="account">Account</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Priority</label>
                      <select value={ticketForm.priority} onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Message</label>
                    <textarea value={ticketForm.message} onChange={e => setTicketForm(f => ({ ...f, message: e.target.value }))} rows={5} placeholder="Describe your issue in detail. Include any relevant transaction IDs or dates." />
                  </div>
                  <button onClick={submitTicket} style={{ padding: "14px 0", borderRadius: 12, background: "linear-gradient(135deg,#aa0000,#e31937)", color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "'JetBrains Mono',monospace", boxShadow: "0 4px 20px rgba(227,25,55,0.3)" }}>
                    Submit Ticket →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TICKET HISTORY ── */}
        {tab === "history" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {TICKET_HISTORY.length === 0 ? (
              <div style={{ ...card, padding: 52, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>🗂</div>
                <div style={{ fontSize: 14, color: "#444" }}>No support tickets yet.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {TICKET_HISTORY.map(ticket => (
                  <div key={ticket.id} style={{ ...card, padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{ticket.subject}</div>
                        <div style={{ fontSize: 11, color: "#444" }}>{ticket.id} · {new Date(ticket.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${statusColor[ticket.status]}15`, border: `1px solid ${statusColor[ticket.status]}30`, color: statusColor[ticket.status] }}>{ticket.status}</span>
                        <span style={{ fontSize: 10, color: "#444" }}>Priority: {ticket.priority}</span>
                      </div>
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