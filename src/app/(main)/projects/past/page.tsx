import Link from "next/link";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";

export default function PastProjectsPage() {
  return (
    <div>
      {/* Breadcrumb + header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/projects" style={{ color: "#6f6759", textDecoration: "none" }}>Projects</Link>
          <span style={{ color: "#3a342b" }}>→</span>
          <span>Archive</span>
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 42, fontWeight: 400, margin: "0 0 6px", lineHeight: 1 }}>Past projects</h1>
        <p style={{ color: "#9a9286", margin: 0, fontSize: 14.5 }}>
          Completed Holding initiatives — outcomes, participants, and revenue records.
        </p>
      </div>

      {/* Empty state */}
      <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: "72px 40px", textAlign: "center" as const }}>
        {/* Decorative card stack */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28, position: "relative" as const, height: 56 }}>
          {[
            { rotate: "-8deg", x: -28, bg: "#1a1610", border: "#2c2820" },
            { rotate: "-3deg", x: -10, bg: "#1c1913", border: "#2e2b20" },
            { rotate:  "2deg", x:   8, bg: "#1e1b14", border: "#322d21" },
            { rotate:  "7deg", x:  26, bg: "#201d15", border: "#3a3522" },
          ].map((c, i) => (
            <div
              key={i}
              style={{ position: "absolute" as const, width: 36, height: 50, borderRadius: 5, background: c.bg, border: `1px solid ${c.border}`, transform: `rotate(${c.rotate}) translateX(${c.x}px)`, top: 0 }}
            />
          ))}
        </div>

        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 400, margin: "0 0 10px", color: "#c9bfaf" }}>
          No completed projects yet
        </div>
        <p style={{ color: "#6f6759", margin: "0 0 28px", fontSize: 14, maxWidth: 380, marginLeft: "auto", marginRight: "auto", lineHeight: 1.65 }}>
          54 Hands is the Holding's first initiative — still in progress. Completed projects will be archived here with their final outcomes and revenue records.
        </p>
        <Link
          href="/projects"
          style={{ display: "inline-flex", alignItems: "center", height: 38, padding: "0 18px", borderRadius: 10, background: ACCENT, color: "#1a1408", fontWeight: 600, fontSize: 13.5, textDecoration: "none", fontFamily: "'Hanken Grotesk', sans-serif" }}
        >
          View active projects →
        </Link>
      </div>

      {/* What gets archived notice */}
      <div style={{ marginTop: 14, padding: "14px 20px", borderRadius: 12, border: "1px solid #221e17", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#4a4538", flexShrink: 0, marginTop: 1 }}>◈</span>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5f594f", margin: 0, lineHeight: 1.65 }}>
          Archived projects include: participating artists, card assignments, final revenue figures, treasury contribution, and individual payouts. All records are open to Holding members.
        </p>
      </div>
    </div>
  );
}
