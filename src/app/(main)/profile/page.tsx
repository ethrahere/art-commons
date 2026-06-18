import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Pencil, MapPin, Globe } from "lucide-react";
import type { Profile } from "@/types";

export default async function ProfilePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single() as { data: Profile | null; error: unknown };

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-[var(--color-canvas-muted)] flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {profile?.display_name?.[0] ?? "A"}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile?.display_name}</h1>
            <p className="text-[var(--color-text-secondary)]">@{profile?.username}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {profile?.location && (
                <span className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                  <MapPin size={14} />
                  {profile.location}
                </span>
              )}
              {profile?.website && (
                <a
                  href={profile.website}
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
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-1.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] px-3 py-1.5 rounded-md text-sm hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)] transition-colors"
        >
          <Pencil size={14} /> Edit profile
        </Link>
      </div>

      {profile?.bio && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
            About
          </h2>
          <p className="leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {(profile?.disciplines?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">
            Disciplines
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile?.disciplines?.map((d: string) => (
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
