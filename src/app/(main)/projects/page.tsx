import { createServerClient } from "@/lib/supabase/server";
import ProjectsClient from "./ProjectsClient";
import type { Project, ProjectCardAssignment, ProjectParticipant, ProjectSubmission, Profile } from "@/types";

type AssignmentRow = ProjectCardAssignment & {
  profiles: Pick<Profile, "id" | "display_name"> | null;
};

type ParticipantRow = ProjectParticipant & {
  profiles: Pick<Profile, "id" | "display_name"> | null;
};

export default async function ProjectsPage() {
  const supabase = await createServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", "54-hands")
    .single() as { data: Project | null; error: unknown };

  const projectId = project?.id ?? "";

  const [ra, rb, rc] = await Promise.all([
    supabase.from("project_card_assignments").select("*, profiles!profile_id(id, display_name)").eq("project_id", projectId).order("assigned_at"),
    supabase.from("project_participants").select("*, profiles!profile_id(id, display_name)").eq("project_id", projectId).eq("status", "accepted"),
    supabase.from("project_submissions").select("profile_id, status").eq("project_id", projectId),
  ]);

  const assignments = ra.data as AssignmentRow[] | null;
  const participants = rb.data as ParticipantRow[] | null;
  const submissions = rc.data as Pick<ProjectSubmission, "profile_id" | "status">[] | null;

  const assignedProfileIds = new Set((assignments ?? []).map(a => a.profile_id));
  const submissionMap = Object.fromEntries((submissions ?? []).map(s => [s.profile_id, s.status]));

  const waitingParticipants = (participants ?? [])
    .filter(p => !assignedProfileIds.has(p.profile_id))
    .map(p => ({
      profileId: p.profile_id,
      name: p.profiles?.display_name ?? "Unknown",
      initials: (p.profiles?.display_name ?? "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
    }));

  const initialAssignments = (assignments ?? []).map(a => ({
    card: a.card_key,
    profileId: a.profile_id,
    artist: a.profiles?.display_name ?? "Unknown",
    initials: (a.profiles?.display_name ?? "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
    submissionStatus: (submissionMap[a.profile_id] ?? "not_submitted") as "pending" | "approved" | "rejected" | "revision_requested" | "not_submitted" | "submitted",
  }));

  return (
    <ProjectsClient
      project={project}
      initialAssignments={initialAssignments}
      waitingParticipants={waitingParticipants}
    />
  );
}
