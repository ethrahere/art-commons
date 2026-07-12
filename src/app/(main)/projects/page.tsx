import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import type { Project } from "@/types";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";

// Public-facing claim page for each project — distinct from the /projects/[slug] member dashboard view
const PUBLIC_PROJECT_PATHS: Record<string, string> = {
  "54-hands": "/54-hands",
  "54-hands-v2": "/54-hands/volume-2",
};

export default async function ProjectsListPage() {
  const supabase = await createServerClient();

  const { data: projectsRaw } = await supabase
    .from("projects")
    .select("*")
    .in("status", ["active", "upcoming"])
    .order("created_at", { ascending: true });

  const projects = (projectsRaw ?? []) as Project[];

  const projectIds = projects.map(p => p.id);
  const { data: assignmentsRaw } = projectIds.length
    ? await supabase.from("project_card_assignments").select("project_id").in("project_id", projectIds)
    : { data: [] };

  const assignedCounts = new Map<string, number>();
  for (const row of (assignmentsRaw ?? []) as { project_id: string }[]) {
    assignedCounts.set(row.project_id, (assignedCounts.get(row.project_id) ?? 0) + 1);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 42, fontWeight: 400, margin: "0 0 6px", lineHeight: 1 }}>Projects</h1>
          <p style={{ color: "#9a9286", margin: 0, fontSize: 14.5 }}>
            Active and upcoming Holding initiatives.
          </p>
        </div>
        <Link href="/projects/past" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#847b6d", textDecoration: "none", flexShrink: 0 }}>
          Past projects →
        </Link>
      </div>

      {projects.length === 0 ? (
        <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: "72px 40px", textAlign: "center" as const, color: "#6f6759", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
          No active or upcoming projects.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
          {projects.map((project) => {
            const assignedCount = assignedCounts.get(project.id) ?? 0;
            const totalSlots = project.total_slots ?? 54;
            const publicPath = PUBLIC_PROJECT_PATHS[project.slug];
            return (
              <div
                key={project.id}
                style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: "24px 26px" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 10 }}>
                  <Link href={`/projects/${project.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, margin: "0 0 4px" }}>{project.title}</h2>
                    <p style={{ color: "#9a9286", margin: 0, fontSize: 13.5, maxWidth: 560 }}>{project.description}</p>
                  </Link>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: "5px 12px", borderRadius: 999, background: project.status === "active" ? "rgba(147,168,119,0.1)" : "rgba(216,162,74,0.09)", border: `1px solid ${project.status === "active" ? "#3a4430" : ACCENT + "40"}`, color: project.status === "active" ? "#93a877" : ACCENT, flexShrink: 0, whiteSpace: "nowrap" as const }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", gap: 20, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6f6759" }}>
                    <span><span style={{ color: "#3a342b" }}>Cards: </span><span style={{ color: "#c9bfaf" }}>{assignedCount} / {totalSlots} assigned</span></span>
                    <span><span style={{ color: "#3a342b" }}>Format: </span><span style={{ color: "#c9bfaf" }}>{totalSlots}-card deck</span></span>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                    <Link href={`/projects/${project.slug}`} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#847b6d", textDecoration: "none" }}>
                      Dashboard view →
                    </Link>
                    {publicPath && (
                      <Link href={publicPath} target="_blank" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACCENT, textDecoration: "none" }}>
                        View public page →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
