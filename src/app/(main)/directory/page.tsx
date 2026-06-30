import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Profile } from "@/types";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";

type ArtistCard = Pick<Profile, "id" | "username" | "display_name" | "bio" | "location" | "disciplines">;

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default async function DirectoryPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: artists } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, location, disciplines")
    .order("created_at", { ascending: false }) as { data: ArtistCard[] | null; error: unknown };

  return (
    <div>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, margin: "0 0 4px", lineHeight: 1 }}>Artist Directory</h1>
      <p style={{ color: "#9a9286", margin: "0 0 22px", fontSize: 14.5 }}>
        {artists?.length ?? 0} artists held in common — find your people.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {artists?.map((artist) => {
          const isSelf = artist.id === user?.id;
          const ini = initials(artist.display_name);
          return (
            <Link
              key={artist.id}
              href={`/directory/${artist.username}`}
              style={{ background: PANEL, border: `1px solid ${isSelf ? ACCENT : "#262119"}`, borderRadius: 14, padding: 20, textDecoration: "none", color: "inherit", display: "block" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "50%", background: isSelf ? "linear-gradient(135deg,#3a2f1c,#211d16)" : "linear-gradient(135deg,#2c2417,#1a1610)", border: `1px solid ${isSelf ? "#3a3327" : "#322b21"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', serif", fontSize: 18, color: isSelf ? ACCENT : "#c9bfaf" }}>
                  {ini}
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                    {artist.display_name}
                    {isSelf && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: ACCENT }}> (you)</span>}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#847b6d" }}>@{artist.username}</div>
                </div>
              </div>

              {artist.bio && (
                <p style={{ fontSize: 13, color: "#9a9286", lineHeight: 1.5, margin: "0 0 14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                  {artist.bio}
                </p>
              )}

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                {artist.disciplines?.slice(0, 2).map((d: string) => (
                  <span key={d} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, padding: "3px 9px", borderRadius: 999, background: "rgba(216,162,74,0.1)", color: ACCENT }}>
                    {d.toUpperCase()}
                  </span>
                ))}
                {artist.location && (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#6f6759", padding: "3px 0" }}>
                    · {artist.location}
                  </span>
                )}
              </div>
            </Link>
          );
        })}

        {(!artists || artists.length === 0) && (
          <div style={{ gridColumn: "span 3", textAlign: "center", padding: "60px 0", color: "#6f6759", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
            No artists yet — be the first to add your profile.
          </div>
        )}
      </div>
    </div>
  );
}
