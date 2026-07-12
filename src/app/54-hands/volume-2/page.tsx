import { createServerClient } from "@/lib/supabase/server";
import FiftyFourHandsClient, { type PublicRegistration } from "../FiftyFourHandsClient";
import type { Project } from "@/types";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSde4HjfCPsBOu-LutdHTfFgHfO4tsPd0BjuKUzT3bOC0yRi1A/viewform?usp=header";

export default async function FiftyFourHandsVolumeTwoPage() {
  const supabase = await createServerClient();

  const { data: projectRaw } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", "54-hands-v2")
    .single();

  const project = projectRaw as Project | null;

  const { data: registrationsRaw } = project?.id
    ? await supabase
        .from("public_card_registrations")
        .select("name, card_key")
        .eq("project_id", project.id)
    : { data: [] };

  return (
    <FiftyFourHandsClient
      project={project as Project}
      nextProject={null}
      nextProjectUrl="/54-hands/volume-2"
      initialRegistrations={(registrationsRaw ?? []) as PublicRegistration[]}
      formUrl={project?.google_form_url ?? FORM_URL}
      artworkDeadline="TBC"
      badgeLabel="The Holding · Project 002"
      deckTitle="54 Hands — Volume 2"
      heroDescription="The second volume of 54 Hands — 54 new cards, 54 new artists, one new template by The Holding. Every participating artist receives an equal share of sales revenue."
      gatheringLabel="54 Hands: Volume 2"
    />
  );
}
