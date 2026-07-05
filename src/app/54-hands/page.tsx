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

  return (
    <FiftyFourHandsClient
      project={project as Project}
      nextProject={nextProjectRaw as Project | null}
      initialRegistrations={(registrationsRaw ?? []) as PublicRegistration[]}
      formUrl={project?.google_form_url ?? FORM_URL}
    />
  );
}
