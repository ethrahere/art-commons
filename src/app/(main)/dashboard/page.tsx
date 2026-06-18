import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types";

export default async function DashboardPage() {
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
    <div>
      <h1 className="text-2xl font-bold mb-2">
        Welcome back, {profile?.display_name ?? "artist"}
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8">
        Here&apos;s what&apos;s happening in the commons.
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-xl p-5">
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Community posts</p>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-xl p-5">
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Artists in directory</p>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-xl p-5">
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Active resources</p>
          <p className="text-2xl font-bold">—</p>
        </div>
      </div>
    </div>
  );
}
