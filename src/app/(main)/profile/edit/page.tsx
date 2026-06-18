"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";

const DISCIPLINES = [
  "Painting", "Drawing", "Sculpture", "Photography", "Illustration",
  "Digital Art", "Printmaking", "Ceramics", "Textile", "Jewelry",
  "Film", "Performance", "Installation", "Animation", "Muralism",
  "Graphic Design", "Music", "Writing", "Other",
];

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single() as { data: Profile | null; error: unknown };

      if (profile) {
        setDisplayName(profile.display_name ?? "");
        setBio(profile.bio ?? "");
        setLocation(profile.location ?? "");
        setWebsite(profile.website ?? "");
        setSelectedDisciplines(profile.disciplines ?? []);
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase, router]);

  function toggleDiscipline(d: string) {
    setSelectedDisciplines((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase.from("profiles") as ReturnType<typeof supabase.from>)
      .update({
        display_name: displayName,
        bio,
        location,
        website,
        disciplines: selectedDisciplines,
      })
      .eq("id", user.id);

    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      router.push("/profile");
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl text-[var(--color-text-secondary)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-8">Edit profile</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Tell the community about your work…"
            className="w-full bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
            className="w-full bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Website</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yoursite.com"
            className="w-full bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Disciplines</label>
          <div className="flex flex-wrap gap-2">
            {DISCIPLINES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDiscipline(d)}
                className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  selectedDisciplines.includes(d)
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent)]"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-[var(--color-accent)] text-[var(--color-canvas)] px-5 py-2 rounded-md text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-[var(--color-border)] text-[var(--color-text-secondary)] px-5 py-2 rounded-md text-sm hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
