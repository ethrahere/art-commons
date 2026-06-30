const ACCENT = "#d8a24a";
const PANEL = "#15130f";

const OPPS = [
  { tag: "PAINTING", daysLeft: 23, urgent: false, title: "Joan Mitchell Foundation Fellowship", body: "An unrestricted award supporting painters and sculptors at a pivotal moment in their careers.", amount: "$60,000" },
  { tag: "ANY MEDIUM", daysLeft: 6, urgent: true, title: "NYFA City Artist Corps Grant", body: "Direct support for NYC-based artists actively engaging their communities through their work.", amount: "$5,000" },
  { tag: "PRINTMAKING", daysLeft: 41, urgent: false, title: "Creative Capital Award", body: "Project-based funding plus advisory support for adventurous, original new work.", amount: "$50,000" },
  { tag: "PAINTING", daysLeft: 14, urgent: false, title: "Pollock-Krasner Foundation Grant", body: "Need-based support for artists of demonstrable merit and financial need.", amount: "up to $30,000" },
  { tag: "RESIDENCY", daysLeft: 58, urgent: false, title: "MacDowell Residency", body: "Time, space, and a private studio for focused work — travel and meals covered.", amount: "Fully funded" },
  { tag: "ANY MEDIUM", daysLeft: 33, urgent: false, title: "Artadia Award", body: "Unrestricted, merit-based funding awarded to artists living in select cities.", amount: "$15,000" },
];

const PILLS = ["All", "Painting", "Printmaking", "Residencies", "Closing soon"];

export default function OpportunitiesPage() {
  return (
    <div>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, margin: "0 0 4px", lineHeight: 1 }}>Opportunities</h1>
      <p style={{ color: "#9a9286", margin: "0 0 22px", fontSize: 14.5 }}>Grants, fellowships, and residencies — matched to your practice.</p>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" as const }}>
        {PILLS.map((pill, i) => (
          <span key={pill} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "7px 14px", borderRadius: 999, background: i === 0 ? ACCENT : PANEL, border: i === 0 ? "none" : "1px solid #2c271f", color: i === 0 ? "#1a1408" : "#9a9286", cursor: "pointer" }}>
            {pill}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {OPPS.map((opp) => (
          <div key={opp.title} style={{ background: PANEL, border: `1px solid ${opp.urgent ? "#3a3120" : "#262119"}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, padding: "3px 8px", borderRadius: 5, background: "rgba(216,162,74,0.1)", color: ACCENT }}>{opp.tag}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: opp.urgent ? "#d09a6a" : "#847b6d" }}>{opp.daysLeft} days left</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>{opp.title}</h3>
            <p style={{ fontSize: 13, color: "#9a9286", lineHeight: 1.55, margin: "0 0 16px" }}>{opp.body}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }}>{opp.amount}</span>
              <button style={{ height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: ACCENT, color: "#1a1408", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Apply</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
