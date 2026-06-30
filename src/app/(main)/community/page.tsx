import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Post, Profile } from "@/types";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";

type PostSummary = Pick<Post, "id" | "title" | "category" | "created_at"> & {
  profiles: Pick<Profile, "display_name" | "username"> | null;
};

const TAG_STYLES: Record<string, { color: string; bg: string }> = {
  feedback:  { color: ACCENT, bg: "rgba(216,162,74,0.1)" },
  advice:    { color: ACCENT, bg: "rgba(216,162,74,0.1)" },
  showcase:  { color: ACCENT, bg: "rgba(216,162,74,0.1)" },
  resources: { color: "#93a877", bg: "rgba(147,168,119,0.12)" },
  financial: { color: "#93a877", bg: "#211d16" },
  general:   { color: "#847b6d", bg: "#211d16" },
};

const PILLS = ["All", "Feedback", "Advice", "Financial", "Showcase"];

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "TODAY";
  if (days === 1) return "YESTERDAY";
  return `${days} DAYS AGO`;
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default async function CommunityPage() {
  const supabase = await createServerClient();
  const { data: posts } = await supabase
    .from("posts")
    .select(`id, title, category, created_at, profiles(display_name, username)`)
    .order("created_at", { ascending: false }) as { data: PostSummary[] | null; error: unknown };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, margin: "0 0 4px", lineHeight: 1 }}>Community</h1>
          <p style={{ color: "#9a9286", margin: 0, fontSize: 14.5 }}>Share, ask, support, and connect.</p>
        </div>
        <Link href="/community/new" style={{ height: 38, padding: "0 16px", borderRadius: 10, border: "none", background: ACCENT, color: "#1a1408", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", textDecoration: "none" }}>
          + New post
        </Link>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" as const }}>
        {PILLS.map((pill, i) => (
          <span key={pill} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "7px 14px", borderRadius: 999, background: i === 0 ? ACCENT : PANEL, border: i === 0 ? "none" : "1px solid #2c271f", color: i === 0 ? "#1a1408" : "#9a9286", cursor: "pointer" }}>
            {pill}
          </span>
        ))}
      </div>

      {/* Posts list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {posts?.map((post) => {
          const tagStyle = TAG_STYLES[post.category] ?? TAG_STYLES.general;
          const ini = initials(post.profiles?.display_name);
          const name = post.profiles?.display_name?.toUpperCase() ?? "UNKNOWN";
          return (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              style={{ display: "flex", alignItems: "center", gap: 16, background: PANEL, border: "1px solid #262119", borderRadius: 14, padding: "16px 20px", textDecoration: "none", color: "inherit" }}
            >
              <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: "50%", background: "linear-gradient(135deg,#2c2417,#1a1610)", border: "1px solid #322b21", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', serif", fontSize: 15, color: "#c9bfaf" }}>{ini}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{post.title}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6f6759", marginTop: 4 }}>
                  {name} · {relativeTime(post.created_at)}
                </div>
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, padding: "3px 9px", borderRadius: 999, background: tagStyle.bg, color: tagStyle.color, flexShrink: 0, textTransform: "uppercase" as const }}>{post.category}</span>
            </Link>
          );
        })}

        {(!posts || posts.length === 0) && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6f6759", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
            No posts yet — start the conversation.
          </div>
        )}
      </div>
    </div>
  );
}
