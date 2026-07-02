import { createServerClient } from "@/lib/supabase/server";
import type { Opportunity } from "@/types";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";

const MEDIUM_LABEL: Record<string, string> = {
  any_medium:   "Any medium",
  painting:     "Painting",
  sculpture:    "Sculpture",
  photography:  "Photography",
  printmaking:  "Printmaking",
  textile:      "Textile",
  digital:      "Digital",
  residency:    "Residency",
  other:        "Other",
};

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

export default async function OpportunitiesPage() {
  const supabase = await createServerClient();

  const { data: opps } = await supabase
    .from("opportunities")
    .select("*")
    .eq("is_active", true)
    .order("deadline", { ascending: true }) as { data: Opportunity[] | null; error: unknown };

  return (
    <div>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, margin: "0 0 4px", lineHeight: 1 }}>Opportunities</h1>
      <p style={{ color: "#9a9286", margin: "0 0 22px", fontSize: 14.5 }}>Grants, fellowships, and residencies — matched to your practice.</p>

      {(!opps || opps.length === 0) ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#6f6759", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
          No open opportunities yet — check back soon.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {opps.map((opp) => {
            const days = daysUntil(opp.deadline);
            const urgent = days !== null && days <= 7;
            return (
              <div key={opp.id} style={{ background: PANEL, border: `1px solid ${urgent ? "#3a3120" : "#262119"}`, borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, padding: "3px 8px", borderRadius: 5, background: "rgba(216,162,74,0.1)", color: ACCENT }}>
                    {MEDIUM_LABEL[opp.medium] ?? opp.medium}
                  </span>
                  {days !== null && (
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: urgent ? "#d09a6a" : "#847b6d" }}>
                      {days > 0 ? `${days} days left` : "Closing today"}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>{opp.title}</h3>
                {opp.body && (
                  <p style={{ fontSize: 13, color: "#9a9286", lineHeight: 1.55, margin: "0 0 16px" }}>{opp.body}</p>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }}>{opp.amount_text ?? "—"}</span>
                  {opp.url ? (
                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: ACCENT, color: "#1a1408", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center" }}
                    >
                      Apply
                    </a>
                  ) : (
                    <button style={{ height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: ACCENT, color: "#1a1408", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Apply</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
