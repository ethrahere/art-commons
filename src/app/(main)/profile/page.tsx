import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Profile, Artwork } from "@/types";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";

const STATUS_COLOR: Record<string, string> = {
  studio:   "#847b6d",
  listed:   ACCENT,
  sold:     "#93a877",
  archived: "#5f594f",
};

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default async function ProfilePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [r1, r2, r3] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("artworks").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(6),
    supabase.from("treasury_transactions").select("amount, type").eq("initiated_by", user.id),
  ]);

  const profile = r1.data as Profile | null;
  const artworks = r2.data as Artwork[] | null;
  const txnData = r3.data as { amount: number; type: string }[] | null;

  const ini = initials(profile?.display_name);
  const works = artworks ?? [];
  const txns = txnData ?? [];

  const earned = txns.filter(t => t.type === "artist_split").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const dropsJoined = new Set(txns.filter(t => t.type === "artist_split").map(t => t.type)).size;

  function formatINR(n: number) {
    return n > 0 ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "₹0";
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 72, height: 72, flexShrink: 0, borderRadius: "50%", background: "linear-gradient(135deg, #3a2f1c, #211d16)", border: "1px solid #3a3327", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', serif", fontSize: 30, color: ACCENT }}>
            {ini}
          </div>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 34, fontWeight: 400, margin: 0, lineHeight: 1 }}>{profile?.display_name ?? "Your name"}</h1>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#847b6d", marginTop: 8 }}>
              @{profile?.username}
              {profile?.location && ` · ${profile.location.toUpperCase()}`}
              {profile?.website && (
                <> · <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>{profile.website.replace(/^https?:\/\//, "")}</a></>
              )}
            </div>
          </div>
        </div>
        <Link href="/profile/edit" style={{ height: 36, padding: "0 16px", borderRadius: 9, border: "1px solid #2c271f", background: PANEL, color: "#c5bcae", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", textDecoration: "none" }}>
          Edit profile
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Earned via drops", value: formatINR(earned) },
          { label: "Drops joined",     value: String(dropsJoined) },
          { label: "Works",            value: String(works.length) },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: PANEL, border: "1px solid #262119", borderRadius: 14, padding: 18 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 9 }}>{label}</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* About */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 12 }}>About</div>
        {profile?.bio ? (
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#c5bcae", margin: 0 }}>{profile.bio}</p>
        ) : (
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#4a4540", margin: 0, fontStyle: "italic" }}>
            Tell the commons about your practice.{" "}
            <Link href="/profile/edit" style={{ color: ACCENT, textDecoration: "none" }}>Add a bio →</Link>
          </p>
        )}
      </div>

      {/* Disciplines */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 12 }}>Disciplines</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          {(profile?.disciplines?.length ?? 0) > 0
            ? profile?.disciplines?.map((d: string) => (
                <span key={d} style={{ fontSize: 13, padding: "6px 14px", borderRadius: 999, background: "rgba(216,162,74,0.12)", color: ACCENT }}>{d}</span>
              ))
            : <Link href="/profile/edit" style={{ fontSize: 13, padding: "6px 14px", borderRadius: 999, border: "1px dashed #3a342b", color: "#4a4540", textDecoration: "none" }}>+ Add disciplines</Link>
          }
        </div>
      </div>

      {/* Selected work */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#6f6759", textTransform: "uppercase" as const }}>Selected work</div>
          {works.length > 0 && (
            <button style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACCENT, background: "none", border: "none", cursor: "pointer" }}>+ Add work</button>
          )}
        </div>

        {works.length === 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[0, 1, 2].map((i) => (
              <button key={i} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" as const }}>
                <div style={{ aspectRatio: "4/5", borderRadius: 11, border: "1px dashed #262119", background: "#0e0d0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#3a342b" }}>+ add work</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {works.map((work) => (
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
  );
}
