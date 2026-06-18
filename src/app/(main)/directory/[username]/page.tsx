import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MapPin, Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types";

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerClient();

  const { data: artist } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single() as { data: Profile | null; error: unknown };

  if (!artist) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href="/directory"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to directory
      </Link>

      <div className="flex items-start gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-[var(--color-canvas-muted)] flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {artist.display_name?.[0] ?? "A"}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{artist.display_name}</h1>
          <p className="text-[var(--color-text-secondary)]">@{artist.username}</p>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {artist.location && (
              <span className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                <MapPin size={14} />
                {artist.location}
              </span>
            )}
            {artist.website && (
              <a
                href={artist.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-[var(--color-accent)] hover:underline"
              >
                <Globe size={14} />
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      {artist.bio && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
            About
          </h2>
          <p className="leading-relaxed">{artist.bio}</p>
        </div>
      )}

      {artist.disciplines?.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">
            Disciplines
          </h2>
          <div className="flex flex-wrap gap-2">
            {artist.disciplines.map((d: string) => (
              <span
                key={d}
                className="text-sm bg-[var(--color-accent-subtle)] text-[var(--color-accent)] px-3 py-1 rounded-full"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
