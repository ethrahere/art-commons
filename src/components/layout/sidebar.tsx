"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";
const PANEL_HI = "#211d16";
const BG = "#0e0d0b";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/treasury", label: "Treasury" },
  { href: "/finances", label: "Opportunities" },
  { href: "/skills", label: "Skills & Offerings" },
  { href: "/projects", label: "Projects" },
  { href: "/community", label: "Community" },
  { href: "/directory", label: "Directory" },
  { href: "/profile", label: "Profile" },
];

interface SidebarProps {
  displayName: string;
  initials: string;
}

export default function Sidebar({ displayName, initials }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside style={{
      width: 256,
      flexShrink: 0,
      borderRight: "1px solid #221e18",
      background: PANEL,
      display: "flex",
      flexDirection: "column",
      padding: "26px 18px",
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 8px 4px" }}>
        <div style={{ width: 26, height: 26, flexShrink: 0, transform: "rotate(45deg)", border: `1.5px solid ${ACCENT}`, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 8, height: 8, background: ACCENT, borderRadius: 2 }} />
        </div>
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.28em", color: "#847b6d", textTransform: "uppercase", marginBottom: 3 }}>The</div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 23, letterSpacing: "0.01em" }}>Holding</div>
        </div>
      </div>

      {/* Section label */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.22em", color: "#5f594f", textTransform: "uppercase", margin: "34px 10px 12px" }}>Studio</div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 12px",
                borderRadius: 9,
                fontSize: 14,
                textDecoration: "none",
                color: "#cfc7b9",
                overflow: "hidden",
                background: active ? PANEL_HI : "transparent",
                boxShadow: active ? `inset 2px 0 0 ${ACCENT}` : "none",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: active ? ACCENT : "#3a342b" }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Founding member badge */}
      <div style={{ marginTop: "auto", padding: 14, border: "1px solid #241f18", borderRadius: 12, background: BG }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: "#6f6759", textTransform: "uppercase", marginBottom: 7 }}>Founding member</div>
        <div style={{ fontSize: 12.5, color: "#9a9286", lineHeight: 1.5 }}>One of the founding ten. Treasury decisions are made together, by consensus.</div>
      </div>

      {/* User row */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 16, paddingTop: 16, borderTop: "1px solid #221e18" }}>
        <div style={{ width: 34, height: 34, flexShrink: 0, borderRadius: "50%", background: "linear-gradient(135deg, #3a2f1c, #211d16)", border: "1px solid #3a3327", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', serif", fontSize: 15, color: ACCENT }}>
          {initials}
        </div>
        <div style={{ lineHeight: 1.3, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
          <div style={{ fontSize: 11, color: "#847b6d" }}>Visual artist</div>
        </div>
        <button
          onClick={handleLogout}
          title="Log out"
          style={{ color: "#6f6759", fontSize: 16, background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 1 }}
        >
          ⏻
        </button>
      </div>
    </aside>
  );
}
