import { createServerClient } from "@/lib/supabase/server";
import type { TreasuryTransaction } from "@/types";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  drop_sale:              { label: "DROP",           color: ACCENT,      bg: "rgba(216,162,74,0.1)" },
  artist_split:           { label: "SPLIT",          color: "#c9a3d0",   bg: "#211d16" },
  supporter_contribution: { label: "SUPPORTER",      color: "#93a877",   bg: "rgba(147,168,119,0.12)" },
  allocation:             { label: "ALLOCATION",     color: "#847b6d",   bg: "#211d16" },
  infrastructure:         { label: "INFRASTRUCTURE", color: "#847b6d",   bg: "#211d16" },
  refund:                 { label: "REFUND",         color: "#d09a6a",   bg: "#211d16" },
  other:                  { label: "OTHER",          color: "#847b6d",   bg: "#211d16" },
};

function formatINR(amount: number): string {
  return `₹${Math.abs(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

export default async function TreasuryPage() {
  const supabase = await createServerClient();

  const { data: txns } = await supabase
    .from("treasury_transactions")
    .select("*")
    .order("created_at", { ascending: false }) as { data: TreasuryTransaction[] | null; error: unknown };

  const { count: supporterCount } = await supabase
    .from("supporters")
    .select("*", { count: "exact", head: true });

  const rows = txns ?? [];
  const balance        = rows.reduce((s, t) => s + Number(t.amount), 0);
  const fromDrops      = rows.filter(t => t.type === "drop_sale").reduce((s, t) => s + Number(t.amount), 0);
  const fromSupporters = rows.filter(t => t.type === "supporter_contribution").reduce((s, t) => s + Number(t.amount), 0);
  const returned       = rows.filter(t => t.type === "artist_split").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  return (
    <div>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, margin: "0 0 4px", lineHeight: 1 }}>Treasury</h1>
      <p style={{ color: "#9a9286", margin: "0 0 24px", fontSize: 14.5 }}>The commons pool — funded by drops and supporters, governed by the ten.</p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
        {[
          { label: "Treasury balance",     value: formatINR(balance),    accent: true },
          { label: "Pooled from drops",    value: formatINR(fromDrops),  accent: false },
          { label: "From supporters",      value: formatINR(fromSupporters), accent: false },
          { label: "Returned to members",  value: formatINR(returned),   accent: false },
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
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6f6759" }}>
            {rows.length > 0 ? `${rows.length} entries · Open to all members` : "Open to all members"}
          </span>
        </div>

        {rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#6f6759", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
            The ledger is empty — no transactions recorded yet.
          </div>
        ) : (
          <div>
            {rows.map((row, i) => {
              const meta = TYPE_META[row.type] ?? TYPE_META.other;
              const isInflow = Number(row.amount) > 0;
              return (
                <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1fr 150px 130px", gap: 16, padding: "14px 0", borderTop: "1px solid #221e17", borderBottom: i === rows.length - 1 ? "1px solid #221e17" : "none", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{row.title}</div>
                    {row.description && (
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6f6759", marginTop: 3 }}>
                        {formatDate(row.created_at)}{row.description ? ` · ${row.description.toUpperCase()}` : ""}
                      </div>
                    )}
                    {!row.description && (
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6f6759", marginTop: 3 }}>
                        {formatDate(row.created_at)}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#847b6d" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 5, background: meta.bg, color: meta.color }}>{meta.label}</span>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, color: isInflow ? "#93a877" : "#b9a48f" }}>
                    {isInflow ? "+" : "−"}{formatINR(Number(row.amount))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Supporters count note */}
      {supporterCount !== null && supporterCount !== undefined && (
        <div style={{ marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5f594f", textAlign: "center" as const }}>
          {supporterCount} supporter{supporterCount !== 1 ? "s" : ""} have contributed to the commons
        </div>
      )}
    </div>
  );
}
