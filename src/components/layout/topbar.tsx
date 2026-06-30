"use client";

import { usePathname } from "next/navigation";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";

const BREADCRUMBS: Record<string, string> = {
  "/dashboard": "Overview",
  "/treasury": "Treasury",
  "/finances": "Opportunities",
  "/community": "Community",
  "/directory": "Directory",
  "/profile": "Profile",
};

function getBreadcrumb(pathname: string) {
  for (const [prefix, label] of Object.entries(BREADCRUMBS)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return label;
  }
  return "";
}

export default function Topbar() {
  const pathname = usePathname();
  const label = getBreadcrumb(pathname);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, marginBottom: 30 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: "0.18em", color: "#6f6759", textTransform: "uppercase" }}>
        The Holding{label ? ` / ${label}` : ""}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 15px", borderRadius: 10, border: "1px solid #2c271f", background: PANEL, color: "#b8b0a3", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13.5, cursor: "pointer" }}>
          ⌕ Search
        </button>
        <button style={{ height: 40, padding: "0 18px", borderRadius: 10, border: "none", background: ACCENT, color: "#1a1408", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          + Log new work
        </button>
      </div>
    </div>
  );
}
