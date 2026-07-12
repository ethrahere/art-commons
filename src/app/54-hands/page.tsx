import { createServerClient } from "@/lib/supabase/server";
import FiftyFourHandsClient, { type PublicRegistration } from "./FiftyFourHandsClient";
import type { Project } from "@/types";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSde4HjfCPsBOu-LutdHTfFgHfO4tsPd0BjuKUzT3bOC0yRi1A/viewform?usp=header";

export default async function FiftyFourHandsPage() {
  const supabase = await createServerClient();

  // Fetch the project first so we have its id for the registrations query
  const { data: projectRaw } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", "54-hands")
    .single();

  const project = projectRaw as Project | null;

  const [{ data: nextProjectRaw }, { data: registrationsRaw }] = await Promise.all([
    supabase.from("projects").select("*").eq("slug", "54-hands-v2").single(),
    project?.id
      ? supabase
          .from("public_card_registrations")
          .select("name, card_key")
          .eq("project_id", project.id)
      : Promise.resolve({ data: [] }),
  ]);

  const nextProject = nextProjectRaw as Project | null;

  return (
    <FiftyFourHandsClient
      project={project as Project}
      nextProject={nextProject}
      nextProjectUrl="/54-hands/volume-2"
      initialRegistrations={(registrationsRaw ?? []) as PublicRegistration[]}
      formUrl={project?.google_form_url ?? FORM_URL}
      artworkDeadline="20th July"
      badgeLabel="The Holding · Project 001"
      deckTitle="54 Hands"
      heroDescription="A playing card deck featuring original artwork from 54 artists — one card per artist, one template by The Holding. Every participating artist receives an equal share of sales revenue."
      gatheringLabel="54 Hands: The First Gathering"
    />
  );
}
