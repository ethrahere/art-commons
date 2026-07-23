import { createServerClient } from "@/lib/supabase/server";
import PreOrderClient from "./PreOrderClient";
import type { Project } from "@/types";

export default async function PreOrderPage() {
  const supabase = await createServerClient();

  const { data: projectRaw } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", "54-hands")
    .single();

  const project = projectRaw as Project | null;

  if (!project) {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0d0b", color: "#6f6759", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
        Project not found.
      </div>
    );
  }

  return <PreOrderClient projectId={project.id} projectTitle={project.title} />;
}
