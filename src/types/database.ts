// Auto-generate this file with: npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
// This is a hand-maintained placeholder. Run the command above after running migrations to replace it.

import type {
  ArtworkStatus, TransactionType, OpportunityMedium, ApplicationStatus,
  ProjectStatus, ParticipantStatus, SubmissionStatus, NotificationType,
  PostCategory, ResourceCategory,
} from "./index";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  disciplines: string[];
  social_links: Record<string, string>;
  is_verified: boolean;
  membership_type: string;
  membership_paid_at: string | null;
  created_at: string;
  updated_at: string;
};

type PostRow = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: PostCategory;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  category: ResourceCategory;
  submitted_by: string | null;
  is_approved: boolean;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

type ArtworkRow = {
  id: string;
  profile_id: string;
  title: string;
  medium: string | null;
  year: number | null;
  dimensions: string | null;
  description: string | null;
  image_url: string | null;
  status: ArtworkStatus;
  listed_price: number | null;
  sold_price: number | null;
  created_at: string;
  updated_at: string;
};

type TreasuryTransactionRow = {
  id: string;
  type: TransactionType;
  title: string;
  description: string | null;
  amount: number;
  project_id: string | null;
  initiated_by: string | null;
  created_at: string;
};

type SupporterRow = {
  id: string;
  display_name: string;
  email: string | null;
  profile_id: string | null;
  amount: number;
  access_level: string;
  note: string | null;
  created_at: string;
};

type OpportunityRow = {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  organization: string | null;
  location: string | null;
  medium: OpportunityMedium;
  amount_text: string | null;
  deadline: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type OpportunityApplicationRow = {
  id: string;
  opportunity_id: string;
  profile_id: string;
  status: ApplicationStatus;
  note: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  total_slots: number;
  google_form_url: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectParticipantRow = {
  id: string;
  project_id: string;
  profile_id: string;
  status: ParticipantStatus;
  joined_at: string;
};

type ProjectCardAssignmentRow = {
  id: string;
  project_id: string;
  profile_id: string;
  card_key: string;
  assigned_at: string;
};

type ProjectSubmissionRow = {
  id: string;
  project_id: string;
  profile_id: string;
  card_assignment_id: string | null;
  file_url: string | null;
  notes: string | null;
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; username: string };
        Update: Partial<ProfileRow>;
      };
      posts: {
        Row: PostRow;
        Insert: Omit<PostRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<PostRow, "id">>;
      };
      comments: {
        Row: CommentRow;
        Insert: Omit<CommentRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<CommentRow, "id">>;
      };
      resources: {
        Row: ResourceRow;
        Insert: Omit<ResourceRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<ResourceRow, "id">>;
      };
      artworks: {
        Row: ArtworkRow;
        Insert: Omit<ArtworkRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<ArtworkRow, "id">>;
      };
      treasury_transactions: {
        Row: TreasuryTransactionRow;
        Insert: Omit<TreasuryTransactionRow, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: never;
      };
      supporters: {
        Row: SupporterRow;
        Insert: Omit<SupporterRow, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<SupporterRow, "id">>;
      };
      opportunities: {
        Row: OpportunityRow;
        Insert: Omit<OpportunityRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<OpportunityRow, "id">>;
      };
      opportunity_applications: {
        Row: OpportunityApplicationRow;
        Insert: Omit<OpportunityApplicationRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<OpportunityApplicationRow, "id">>;
      };
      projects: {
        Row: ProjectRow;
        Insert: Omit<ProjectRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<ProjectRow, "id">>;
      };
      project_participants: {
        Row: ProjectParticipantRow;
        Insert: Omit<ProjectParticipantRow, "id" | "joined_at"> & { id?: string; joined_at?: string };
        Update: Partial<Omit<ProjectParticipantRow, "id">>;
      };
      project_card_assignments: {
        Row: ProjectCardAssignmentRow;
        Insert: Omit<ProjectCardAssignmentRow, "id" | "assigned_at"> & { id?: string; assigned_at?: string };
        Update: never;
      };
      project_submissions: {
        Row: ProjectSubmissionRow;
        Insert: Omit<ProjectSubmissionRow, "id" | "submitted_at"> & { id?: string; submitted_at?: string };
        Update: Partial<Omit<ProjectSubmissionRow, "id" | "project_id" | "profile_id">>;
      };
      notifications: {
        Row: NotificationRow;
        Insert: Omit<NotificationRow, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Pick<NotificationRow, "is_read">;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      artwork_status: ArtworkStatus;
      transaction_type: TransactionType;
      opportunity_medium: OpportunityMedium;
      application_status: ApplicationStatus;
      project_status: ProjectStatus;
      participant_status: ParticipantStatus;
      submission_status: SubmissionStatus;
      notification_type: NotificationType;
    };
  };
};
