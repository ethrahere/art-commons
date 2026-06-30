import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Profile } from "@/types";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";
const BG = "#0e0d0b";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const ACTIVITIES = [
  { initials: "DP", color: "#c9bfaf", bg: "#211d16", border: "#322b21", text: <><strong style={{ color: "#efe9dd", fontWeight: 600 }}>Devin Park</strong> left feedback on <em style={{ fontStyle: "italic", color: "#efe9dd" }}>Tidewrack No. 4</em></>, time: "2H AGO" },
  { initials: "₹", color: "#93a877", bg: "rgba(147,168,119,0.14)", border: "#3a4430", text: <>Your equal split from <em style={{ fontStyle: "italic", color: "#efe9dd" }}>54 Hands</em> arrived — <strong style={{ color: "#93a877", fontWeight: 600 }}>₹11,180</strong></>, time: "YESTERDAY" },
  { initials: "LO", color: "#c9bfaf", bg: "#211d16", border: "#322b21", text: <><strong style={{ color: "#efe9dd", fontWeight: 600 }}>Aarti Menon</strong> joined as a supporter of the commons</>, time: "2 DAYS AGO" },
  { initials: "◷", color: ACCENT, bg: "rgba(216,162,74,0.12)", border: "#3a3120", text: <>Your <strong style={{ color: "#efe9dd", fontWeight: 600 }}>Joan Mitchell</strong> application was viewed</>, time: "3 DAYS AGO" },
];

const CIRCLE = [
  { initials: "DP", name: "Devin Park", role: "SCULPTOR · BROOKLYN", following: true },
  { initials: "AB", name: "Amara Bello", role: "TEXTILE · LAGOS", following: false },
  { initials: "LO", name: "Lena Ortiz", role: "PHOTOGRAPHER · MEXICO CITY", following: false },
];

const OPPS = [
  { title: "Joan Mitchell Foundation Fellowship", tag: "PAINTING", sub: "Unrestricted award", amount: "$60,000", daysLeft: 23, urgent: false },
  { title: "NYFA City Artist Corps Grant", tag: "ANY MEDIUM", sub: "NYC residents", amount: "$5,000", daysLeft: 6, urgent: true },
  { title: "Creative Capital Award", tag: "PRINTMAKING", sub: "Project-based", amount: "$50,000", daysLeft: 41, urgent: false },
];

const WORKS = [
  { label: "oil on linen · 2025", title: "Tidewrack No. 4", status: "Listed · $3,200", statusColor: ACCENT },
  { label: "etching · series", title: "Salt Index", status: "Sold · $1,800", statusColor: "#93a877" },
  { label: "monotype · 2024", title: "Holdfast", status: "Archived", statusColor: "#847b6d" },
];

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single() as { data: Pick<Profile, "display_name"> | null; error: unknown };

  const firstName = (profile?.display_name ?? "there").split(" ")[0];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: "0.2em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 12 }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} — Summer term
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 42, fontWeight: 400, margin: 0, letterSpacing: "0.01em", lineHeight: 1 }}>
          {greeting()}, <em style={{ fontStyle: "italic" }}>{firstName}.</em>
        </h1>
      </div>

      {/* Top row: treasury card + bar chart */}
      <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 18, marginBottom: 18 }}>
        {/* Treasury card */}
        <div style={{ position: "relative", overflow: "hidden", background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column" }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, border: "1px solid #2a241b", borderRadius: "50%", opacity: 0.6 }} />
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, border: "1px solid #2a241b", borderRadius: "50%", opacity: 0.4 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#847b6d", textTransform: "uppercase" as const }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT }} />The shared treasury
          </div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 52, lineHeight: 1, margin: "22px 0 6px", letterSpacing: "-0.01em" }}>₹3,84,200</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#93a877" }}>
            ▲ +₹62,400 <span style={{ color: "#6f6759" }}>pooled this cycle</span>
          </div>
          <div style={{ marginTop: "auto", display: "flex", gap: 10, paddingTop: 26 }}>
            <div style={{ flex: 1, padding: "12px 13px", borderRadius: 11, background: BG, border: "1px solid #221e17" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 6 }}>Your share from drops</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, color: "#efe9dd" }}>₹18,400</div>
            </div>
            <div style={{ flex: 1, padding: "12px 13px", borderRadius: 11, background: BG, border: "1px solid #221e17" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 6 }}>Supporters</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, color: "#efe9dd" }}>22</div>
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 8 }}>Treasury inflow — last 12 months</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, lineHeight: 1 }}>₹4,12,000 <span style={{ fontSize: 15, color: "#6f6759", fontFamily: "'Hanken Grotesk', sans-serif" }}>pooled</span></div>
            </div>
            <div style={{ display: "flex", gap: 14, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#847b6d", paddingTop: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: ACCENT, display: "inline-block" }} />Drops</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#5f5848", display: "inline-block" }} />Supporters</span>
            </div>
          </div>
          <svg viewBox="0 0 560 180" style={{ width: "100%", height: "auto", marginTop: 12, overflow: "visible" }}>
            <line x1="0" y1="150" x2="560" y2="150" stroke="#2a251d" strokeWidth="1" />
            <line x1="0" y1="100" x2="560" y2="100" stroke="#1f1b15" strokeWidth="1" strokeDasharray="3 5" />
            <line x1="0" y1="50" x2="560" y2="50" stroke="#1f1b15" strokeWidth="1" strokeDasharray="3 5" />
            <g>
              <rect x="6" y="106" width="30" height="44" rx="3" fill="#5f5848" /><rect x="6" y="92" width="30" height="14" rx="3" fill={ACCENT} opacity="0.55" />
              <rect x="52" y="92" width="30" height="58" rx="3" fill="#5f5848" /><rect x="52" y="74" width="30" height="18" rx="3" fill={ACCENT} opacity="0.55" />
              <rect x="98" y="116" width="30" height="34" rx="3" fill="#5f5848" /><rect x="98" y="104" width="30" height="12" rx="3" fill={ACCENT} opacity="0.55" />
              <rect x="144" y="80" width="30" height="70" rx="3" fill="#5f5848" /><rect x="144" y="58" width="30" height="22" rx="3" fill={ACCENT} opacity="0.55" />
              <rect x="190" y="98" width="30" height="52" rx="3" fill="#5f5848" /><rect x="190" y="80" width="30" height="18" rx="3" fill={ACCENT} opacity="0.55" />
              <rect x="236" y="70" width="30" height="80" rx="3" fill="#5f5848" /><rect x="236" y="46" width="30" height="24" rx="3" fill={ACCENT} opacity="0.55" />
              <rect x="282" y="88" width="30" height="62" rx="3" fill="#5f5848" /><rect x="282" y="66" width="30" height="22" rx="3" fill={ACCENT} opacity="0.55" />
              <rect x="328" y="58" width="30" height="92" rx="3" fill="#5f5848" /><rect x="328" y="34" width="30" height="24" rx="3" fill={ACCENT} opacity="0.55" />
              <rect x="374" y="76" width="30" height="74" rx="3" fill="#5f5848" /><rect x="374" y="56" width="30" height="20" rx="3" fill={ACCENT} opacity="0.55" />
              <rect x="420" y="92" width="30" height="58" rx="3" fill="#5f5848" /><rect x="420" y="74" width="30" height="18" rx="3" fill={ACCENT} opacity="0.55" />
              <rect x="466" y="62" width="30" height="88" rx="3" fill="#5f5848" /><rect x="466" y="40" width="30" height="22" rx="3" fill={ACCENT} opacity="0.55" />
              <rect x="512" y="40" width="30" height="110" rx="3" fill={ACCENT} /><rect x="512" y="20" width="30" height="20" rx="3" fill={ACCENT} />
            </g>
            <g fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#5f594f" textAnchor="middle">
              {["J","A","S","O","N","D","J","F","M","A","M"].map((m, i) => (
                <text key={i} x={21 + i * 46} y="166">{m}</text>
              ))}
              <text x="527" y="166" fill={ACCENT}>J</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Bottom row: opportunities + works | activity + circle */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Open opportunities */}
          <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: 0 }}>Open opportunities</h2>
              <Link href="/finances" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACCENT, textDecoration: "none" }}>View all 12 →</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {OPPS.map((opp, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderTop: "1px solid #221e17" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{opp.title}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#847b6d" }}>
                      <span style={{ padding: "2px 7px", borderRadius: 5, background: "rgba(216,162,74,0.1)", color: ACCENT }}>{opp.tag}</span>
                      {opp.sub}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: "#efe9dd" }}>{opp.amount}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: opp.urgent ? "#d09a6a" : "#847b6d" }}>closes in {opp.daysLeft} days</div>
                  </div>
                  <button style={{ flexShrink: 0, height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #322b21", background: "transparent", color: "#d6cdbd", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Apply</button>
                </div>
              ))}
            </div>
          </div>

          {/* Your work */}
          <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: 0 }}>Your work</h2>
              <Link href="/profile" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACCENT, textDecoration: "none" }}>Manage →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {WORKS.map((work) => (
                <div key={work.title}>
                  <div style={{ aspectRatio: "4/5", borderRadius: 11, border: "1px solid #262119", background: "repeating-linear-gradient(135deg, #1c1813 0 9px, #17140f 9px 18px)", display: "flex", alignItems: "flex-end", padding: 10 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#6f6759", background: "rgba(14,13,11,0.7)", padding: "3px 6px", borderRadius: 4 }}>{work.label}</span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, margin: "9px 0 2px" }}>{work.title}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: work.statusColor }}>{work.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Activity */}
          <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: "0 0 16px" }}>Activity</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {ACTIVITIES.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderTop: "1px solid #221e17" }}>
                  <div style={{ width: 30, height: 30, flexShrink: 0, borderRadius: "50%", background: a.bg, border: `1px solid ${a.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', serif", fontSize: 13, color: a.color }}>{a.initials}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.45, color: "#c5bcae" }}>
                    {a.text}
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#6f6759", marginTop: 3 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In your circle */}
          <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: 0 }}>In your circle</h2>
              <Link href="/directory" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACCENT, textDecoration: "none" }}>Directory →</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {CIRCLE.map((person) => (
                <div key={person.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: "50%", background: "linear-gradient(135deg, #2c2417, #1a1610)", border: "1px solid #322b21", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', serif", fontSize: 15, color: "#c9bfaf" }}>{person.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{person.name}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#847b6d" }}>{person.role}</div>
                  </div>
                  {person.following ? (
                    <button style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 7, border: "1px solid #322b21", background: "transparent", color: "#b8b0a3", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Following</button>
                  ) : (
                    <button style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 7, border: "none", background: ACCENT, color: "#1a1408", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Follow</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
