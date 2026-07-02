import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Profile, Artwork, Opportunity, Notification } from "@/types";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";
const BG = "#0e0d0b";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "JUST NOW";
  if (hours < 24) return `${hours}H AGO`;
  if (days === 1) return "YESTERDAY";
  return `${days} DAYS AGO`;
}

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

type FollowRow = {
  profiles: Pick<Profile, "id" | "display_name" | "username" | "disciplines" | "location"> | null;
};

type TxnRow = { amount: number; type: string; created_at: string };

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [r1, r2, r3, r4, r5, r6, r7, r8] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase.from("artworks").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("opportunities").select("*").eq("is_active", true).order("deadline").limit(3),
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("follows").select("profiles!following_id(id, display_name, username, disciplines, location)").eq("follower_id", user.id).limit(3),
    supabase.from("treasury_transactions").select("amount, type, created_at"),
    supabase.from("treasury_transactions").select("amount, type").eq("initiated_by", user.id),
    supabase.from("supporters").select("*", { count: "exact", head: true }),
  ]);

  const profile = r1.data as Pick<Profile, "display_name"> | null;
  const artworks = r2.data as Artwork[] | null;
  const opps = r3.data as Opportunity[] | null;
  const notifications = r4.data as Notification[] | null;
  const follows = r5.data as FollowRow[] | null;
  const allTxns = r6.data as TxnRow[] | null;
  const myTxns = r7.data as { amount: number; type: string }[] | null;
  const supporterCount = r8.count;

  const firstName = (profile?.display_name ?? "there").split(" ")[0];
  const txns = allTxns ?? [];
  const balance = txns.reduce((s, t) => s + Number(t.amount), 0);
  const myShare = (myTxns ?? []).filter(t => t.type === "artist_split").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  // Build monthly bar data (last 12 months)
  const monthlyData: { drops: number; supporters: number }[] = Array.from({ length: 12 }, () => ({ drops: 0, supporters: 0 }));
  const now = new Date();
  txns.forEach((t) => {
    const d = new Date(t.created_at);
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (monthsAgo >= 0 && monthsAgo < 12) {
      const idx = 11 - monthsAgo;
      if (t.type === "drop_sale") monthlyData[idx].drops += Number(t.amount);
      else if (t.type === "supporter_contribution") monthlyData[idx].supporters += Number(t.amount);
    }
  });
  const maxBar = Math.max(...monthlyData.map(m => m.drops + m.supporters), 1);
  const CHART_H = 130;

  const STATUS_COLOR: Record<string, string> = { studio: "#847b6d", listed: ACCENT, sold: "#93a877", archived: "#5f594f" };

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
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 48, lineHeight: 1, margin: "22px 0 6px", letterSpacing: "-0.01em" }}>{formatINR(balance)}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#6f6759" }}>
            {txns.length === 0 ? "No transactions recorded yet" : `${txns.length} transaction${txns.length !== 1 ? "s" : ""}`}
          </div>
          <div style={{ marginTop: "auto", display: "flex", gap: 10, paddingTop: 26 }}>
            <div style={{ flex: 1, padding: "12px 13px", borderRadius: 11, background: BG, border: "1px solid #221e17" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 6 }}>Your share from drops</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, color: "#efe9dd" }}>{formatINR(myShare)}</div>
            </div>
            <div style={{ flex: 1, padding: "12px 13px", borderRadius: 11, background: BG, border: "1px solid #221e17" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 6 }}>Supporters</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, color: "#efe9dd" }}>{supporterCount ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 8 }}>Treasury inflow — last 12 months</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, lineHeight: 1 }}>
                {formatINR(txns.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0))}{" "}
                <span style={{ fontSize: 15, color: "#6f6759", fontFamily: "'Hanken Grotesk', sans-serif" }}>pooled</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#847b6d", paddingTop: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: ACCENT, display: "inline-block" }} />Drops</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#5f5848", display: "inline-block" }} />Supporters</span>
            </div>
          </div>
          {txns.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#3a342b", marginTop: 20 }}>
              No transactions to chart yet
            </div>
          ) : (
            <svg viewBox={`0 0 560 ${CHART_H + 30}`} style={{ width: "100%", height: "auto", marginTop: 14, overflow: "visible" }}>
              <line x1="0" y1={CHART_H} x2="560" y2={CHART_H} stroke="#2a251d" strokeWidth="1" />
              <line x1="0" y1={CHART_H * 0.5} x2="560" y2={CHART_H * 0.5} stroke="#1f1b15" strokeWidth="1" strokeDasharray="3 5" />
              {monthlyData.map((m, i) => {
                const x = 6 + i * 46;
                const totalH = Math.round(((m.drops + m.supporters) / maxBar) * CHART_H);
                const dropH = Math.round((m.drops / maxBar) * CHART_H);
                const suppH = totalH - dropH;
                const suppY = CHART_H - totalH;
                const dropY = CHART_H - dropH;
                return (
                  <g key={i}>
                    {suppH > 0 && <rect x={x} y={suppY} width="30" height={suppH} rx="3" fill="#5f5848" />}
                    {dropH > 0 && <rect x={x} y={dropY} width="30" height={dropH} rx="3" fill={ACCENT} opacity={i === 11 ? 1 : 0.55} />}
                  </g>
                );
              })}
              <g fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#5f594f" textAnchor="middle">
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date(now);
                  d.setMonth(d.getMonth() - (11 - i));
                  return d.toLocaleString("en-US", { month: "narrow" });
                }).map((label, i) => (
                  <text key={i} x={21 + i * 46} y={CHART_H + 16} fill={i === 11 ? ACCENT : "#5f594f"}>{label}</text>
                ))}
              </g>
            </svg>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Open opportunities */}
          <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: 0 }}>Open opportunities</h2>
              <Link href="/finances" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACCENT, textDecoration: "none" }}>View all →</Link>
            </div>
            {(!opps || opps.length === 0) ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#6f6759", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>No open opportunities yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {opps.map((opp) => {
                  const days = daysUntil(opp.deadline);
                  const urgent = days !== null && days <= 7;
                  return (
                    <div key={opp.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderTop: "1px solid #221e17" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{opp.title}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#847b6d" }}>
                          <span style={{ padding: "2px 7px", borderRadius: 5, background: "rgba(216,162,74,0.1)", color: ACCENT }}>{opp.medium.replace("_", " ").toUpperCase()}</span>
                          {opp.organization}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: "#efe9dd" }}>{opp.amount_text ?? "—"}</div>
                        {days !== null && (
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: urgent ? "#d09a6a" : "#847b6d" }}>closes in {days} days</div>
                        )}
                      </div>
                      {opp.url ? (
                        <a href={opp.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #322b21", background: "transparent", color: "#d6cdbd", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center" }}>Apply</a>
                      ) : (
                        <button style={{ flexShrink: 0, height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #322b21", background: "transparent", color: "#d6cdbd", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Apply</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Your work */}
          <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: 0 }}>Your work</h2>
              <Link href="/profile" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACCENT, textDecoration: "none" }}>Manage →</Link>
            </div>
            {(!artworks || artworks.length === 0) ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <div style={{ aspectRatio: "4/5", borderRadius: 11, border: "1px dashed #262119", background: "#0e0d0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#3a342b" }}>+ add work</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {artworks.map((work) => (
                  <div key={work.id}>
                    <div style={{ aspectRatio: "4/5", borderRadius: 11, border: "1px solid #262119", background: work.image_url ? `url(${work.image_url}) center/cover` : "repeating-linear-gradient(135deg, #1c1813 0 9px, #17140f 9px 18px)", display: "flex", alignItems: "flex-end", padding: 10 }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#6f6759", background: "rgba(14,13,11,0.7)", padding: "3px 6px", borderRadius: 4 }}>
                        {[work.medium, work.year].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, margin: "9px 0 2px" }}>{work.title}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: STATUS_COLOR[work.status] ?? "#847b6d", textTransform: "capitalize" as const }}>{work.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Activity */}
          <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: "0 0 16px" }}>Activity</h2>
            {(!notifications || notifications.length === 0) ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#6f6759", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>No activity yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ display: "flex", gap: 12, padding: "11px 0", borderTop: "1px solid #221e17" }}>
                    <div style={{ width: 30, height: 30, flexShrink: 0, borderRadius: "50%", background: "#211d16", border: "1px solid #322b21", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACCENT }}>
                      {n.type === "treasury_split" ? "₹" : n.type === "new_follower" ? "+" : "◷"}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.45, color: "#c5bcae" }}>
                      {n.title}
                      {n.body && <span style={{ color: "#9a9286" }}> — {n.body}</span>}
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#6f6759", marginTop: 3 }}>{relativeTime(n.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* In your circle */}
          <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: 0 }}>In your circle</h2>
              <Link href="/directory" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACCENT, textDecoration: "none" }}>Directory →</Link>
            </div>
            {(!follows || follows.length === 0) ? (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <div style={{ color: "#6f6759", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, marginBottom: 12 }}>Follow artists to build your circle.</div>
                <Link href="/directory" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACCENT, textDecoration: "none" }}>Browse directory →</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {follows.map((f, i) => {
                  const person = f.profiles;
                  if (!person) return null;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: "50%", background: "linear-gradient(135deg, #2c2417, #1a1610)", border: "1px solid #322b21", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', serif", fontSize: 15, color: "#c9bfaf" }}>{initials(person.display_name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{person.display_name}</div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#847b6d" }}>
                          {person.disciplines?.[0]?.toUpperCase()}{person.location ? ` · ${person.location.toUpperCase()}` : ""}
                        </div>
                      </div>
                      <Link href={`/directory/${person.username}`} style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 7, border: "1px solid #322b21", background: "transparent", color: "#b8b0a3", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center" }}>View</Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
