const ACCENT = "#d8a24a";
const PANEL = "#15130f";

const LEDGER = [
  { title: "54 Hands — deck sales, cycle 1", sub: "26 JUN 2026 · 418 DECKS", tag: "DROP", tagColor: ACCENT, tagBg: "rgba(216,162,74,0.1)", amount: "+₹2,46,000", amountColor: "#93a877" },
  { title: "Equal split → 11 participating artists", sub: "26 JUN 2026 · ₹11,180 EACH", tag: "SPLIT", tagColor: "#c9a3d0", tagBg: "#211d16", amount: "−₹1,23,000", amountColor: "#b9a48f" },
  { title: "Supporter contribution — Aarti Menon", sub: "19 JUN 2026 · EARLY-DROP ACCESS", tag: "SUPPORTER", tagColor: "#93a877", tagBg: "rgba(147,168,119,0.12)", amount: "+₹25,000", amountColor: "#93a877" },
  { title: "Materials fund → Ravi (clay & kiln firing)", sub: "11 JUN 2026 · APPROVED BY CONSENSUS", tag: "ALLOCATION", tagColor: "#847b6d", tagBg: "#211d16", amount: "−₹18,000", amountColor: "#b9a48f" },
  { title: "Group show booth — Bengaluru", sub: "02 JUN 2026 · SHARED EXHIBITION COST", tag: "ALLOCATION", tagColor: "#847b6d", tagBg: "#211d16", amount: "−₹40,000", amountColor: "#b9a48f" },
  { title: "54 Hands — first print run, 1,000 decks", sub: "14 MAY 2026 · INFRASTRUCTURE", tag: "INFRASTRUCTURE", tagColor: "#847b6d", tagBg: "#211d16", amount: "−₹86,000", amountColor: "#b9a48f" },
];

export default function TreasuryPage() {
  return (
    <div>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, margin: "0 0 4px", lineHeight: 1 }}>Treasury</h1>
      <p style={{ color: "#9a9286", margin: "0 0 24px", fontSize: 14.5 }}>The commons pool — funded by drops and supporters, governed by the ten.</p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
        {[
          { label: "Treasury balance", value: "₹3,84,200", accent: true },
          { label: "Pooled from drops", value: "₹2,46,000", accent: false },
          { label: "From supporters", value: "₹1,66,000", accent: false },
          { label: "Returned to members", value: "₹2,67,000", accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ background: PANEL, border: "1px solid #262119", borderRadius: 14, padding: 18 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 10 }}>{label}</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, lineHeight: 1, color: accent ? ACCENT : "#efe9dd" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* 50/50 explainer */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(216,162,74,0.07)", border: "1px solid #3a3120", borderRadius: 14, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 500, color: "#1a1408" }}>50%</div>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#2a241b", border: "1px solid #3a3327", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#d6cdbd", marginLeft: -10 }}>50%</div>
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#c5bcae" }}>
          <strong style={{ color: "#efe9dd" }}>Every drop splits in two.</strong> Half is shared equally among the participating artists; half flows into the commons treasury, which funds materials, exhibition costs, and the infrastructure itself.
        </div>
      </div>

      {/* Ledger */}
      <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: 0 }}>Treasury ledger</h2>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6f6759" }}>Open to all members</span>
        </div>
        <div>
          {LEDGER.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 150px 130px", gap: 16, padding: "14px 0", borderTop: "1px solid #221e17", borderBottom: i === LEDGER.length - 1 ? "1px solid #221e17" : "none", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{row.title}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6f6759", marginTop: 3 }}>{row.sub}</div>
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#847b6d" }}>
                <span style={{ padding: "2px 8px", borderRadius: 5, background: row.tagBg, color: row.tagColor }}>{row.tag}</span>
              </div>
              <div style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, color: row.amountColor }}>{row.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
