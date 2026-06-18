import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Profile } from "@/types";

type ArtistCard = Pick<Profile, "id" | "username" | "display_name" | "bio" | "location" | "avatar_url" | "disciplines">;

export default async function DirectoryPage() {
  const supabase = await createServerClient();
  const { data: artists } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, location, avatar_url, disciplines")
    .order("created_at", { ascending: false }) as { data: ArtistCard[] | null; error: unknown };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Artist Directory</h1>
        <p className="text-[var(--color-text-secondary)]">
          {artists?.length ?? 0} artists in the commons
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {artists?.map((artist) => (
          <Link
            key={artist.id}
            href={`/directory/${artist.username}`}
            className="bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-accent)] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-canvas-muted)] flex items-center justify-center text-lg font-semibold flex-shrink-0">
                {artist.display_name?.[0] ?? "A"}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate group-hover:text-[var(--color-accent)] transition-colors">
                  {artist.display_name}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  @{artist.username}
                </p>
              </div>
            </div>

            {artist.bio && (
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
                {artist.bio}
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {artist.location && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                  <MapPin size={12} />
                  {artist.location}
                </span>
              )}
              {artist.disciplines?.slice(0, 2).map((d: string) => (
                <span
                  key={d}
                  className="text-xs bg-[var(--color-accent-subtle)] text-[var(--color-accent)] px-2 py-0.5 rounded-full"
                >
                  {d}
                </span>
              ))}
            </div>
          </Link>
        ))}

        {(!artists || artists.length === 0) && (
          <p className="text-[var(--color-text-secondary)] col-span-3 py-12 text-center">
            No artists yet — be the first to add your profile.
          </p>
        )}
      </div>
    </div>
  );
}
