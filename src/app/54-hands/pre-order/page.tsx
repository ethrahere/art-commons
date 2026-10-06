import { createServerClient } from "@/lib/supabase/server";
import { readdirSync } from "fs";
import path from "path";
import PreOrderClient from "./PreOrderClient";
import { DECK_IMAGE_DIR, DECK_IMAGE_EXT, drawHand } from "./deck";
import type { Project } from "@/types";

// Slugs of cards whose artwork is in public/54-hands/deck/. Returns undefined
// where public/ isn't on the server's filesystem (some serverless hosts), in
// which case the hand is drawn from the whole deck.
function cardsWithArtwork(): Set<string> | undefined {
  try {
    const dir = path.join(process.cwd(), "public", DECK_IMAGE_DIR);
    const suffix = `.${DECK_IMAGE_EXT}`;
    return new Set(readdirSync(dir).filter(f => f.endsWith(suffix)).map(f => f.slice(0, -suffix.length)));
  } catch {
    return undefined;
  }
}

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

  const { data: registrations } = await supabase
    .from("public_card_registrations")
    .select("name, card_key")
    .eq("project_id", project.id);

  const artists: Record<string, string> = {};
  for (const r of registrations ?? []) artists[r.card_key] = r.name;

  return (
    <PreOrderClient
      projectId={project.id}
      projectTitle={project.title}
      artists={artists}
      fanKeys={drawHand(cardsWithArtwork())}
    />
  );
}
