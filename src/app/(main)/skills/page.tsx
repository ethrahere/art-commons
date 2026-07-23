import { createServerClient } from "@/lib/supabase/server";
import type { Profile, SkillEntry } from "@/types";
import SkillsInventoryClient, { type SkillEntryWithAuthor } from "@/components/skills/SkillsInventoryClient";

type SkillEntryRow = Pick<SkillEntry, "id" | "kind" | "skill" | "note" | "profile_id"> & {
  profiles: Pick<Profile, "display_name" | "username"> | null;
};

export default async function SkillsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: skillRows } = await supabase
    .from("skill_entries")
    .select(`id, kind, skill, note, profile_id, profiles(display_name, username)`)
    .order("created_at", { ascending: true }) as { data: SkillEntryRow[] | null; error: unknown };

  const skillEntries: SkillEntryWithAuthor[] = (skillRows ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    skill: row.skill,
    note: row.note,
    profile_id: row.profile_id,
    display_name: row.profiles?.display_name ?? null,
    username: row.profiles?.username ?? "unknown",
  }));

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id, display_name, username, bio, disciplines")
    .eq("id", user!.id)
    .single() as {
      data: Pick<Profile, "id" | "display_name" | "username" | "bio" | "disciplines"> | null;
      error: unknown;
    };

  return (
    <div>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, margin: "0 0 4px", lineHeight: 1 }}>Skills &amp; Offerings</h1>
      <p style={{ color: "#9a9286", margin: "0 0 22px", fontSize: 14.5, maxWidth: 620 }}>
        Before artists can trade, map what the network holds. Who offers what, who needs what — the matches draw themselves once it&apos;s visible.
      </p>

      {currentProfile && (
        <SkillsInventoryClient
          initialEntries={skillEntries}
          currentArtist={{
            id: currentProfile.id,
            displayName: currentProfile.display_name ?? currentProfile.username,
            username: currentProfile.username,
            bio: currentProfile.bio,
            disciplines: currentProfile.disciplines ?? [],
          }}
        />
      )}
    </div>
  );
}
