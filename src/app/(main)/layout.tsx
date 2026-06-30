import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import type { Profile } from "@/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single() as { data: Pick<Profile, "display_name"> | null; error: unknown };

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Artist";
  const initials = getInitials(displayName);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0e0d0b", color: "#efe9dd", fontFamily: "'Hanken Grotesk', system-ui, sans-serif", WebkitFontSmoothing: "antialiased" } as React.CSSProperties}>
      <Sidebar displayName={displayName} initials={initials} />
      <main style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "26px 40px 56px" }}>
          <Topbar />
          {children}
        </div>
      </main>
    </div>
  );
}
