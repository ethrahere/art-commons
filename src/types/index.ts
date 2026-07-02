export type PostCategory =
  | "general"
  | "feedback"
  | "advice"
  | "resources"
  | "financial"
  | "showcase";

export type ResourceCategory =
  | "grant"
  | "supply"
  | "financial_aid"
  | "tool"
  | "workshop"
  | "other";

export type MembershipType = "none" | "lifetime";

export type ArtworkStatus = "studio" | "listed" | "sold" | "archived";

export type TransactionType =
  | "drop_sale"
  | "artist_split"
  | "supporter_contribution"
  | "allocation"
  | "infrastructure"
  | "refund"
  | "other";

export type OpportunityMedium =
  | "any_medium"
  | "painting"
  | "sculpture"
  | "photography"
  | "printmaking"
  | "textile"
  | "digital"
  | "residency"
  | "other";

export type ApplicationStatus = "intent" | "submitted" | "awarded" | "rejected";

export type ProjectStatus = "upcoming" | "active" | "completed" | "archived";

export type ParticipantStatus = "pending" | "accepted" | "rejected";

export type SubmissionStatus = "pending" | "approved" | "rejected" | "revision_requested";

export type NotificationType =
  | "new_follower"
  | "post_like"
  | "post_comment"
  | "treasury_split"
  | "card_assigned"
  | "submission_approved"
  | "submission_rejected"
  | "opportunity_deadline"
  | "supporter_joined";

// ─── Existing ────────────────────────────────────────────────────────────────

export interface Profile {
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
  membership_type: MembershipType;
  membership_paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: PostCategory;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Resource {
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
}

// ─── New (migration 003) ──────────────────────────────────────────────────────

export interface Artwork {
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
}

export interface TreasuryTransaction {
  id: string;
  type: TransactionType;
  title: string;
  description: string | null;
  amount: number;           // positive = inflow, negative = outflow (INR)
  project_id: string | null;
  initiated_by: string | null;
  created_at: string;
}

export interface Supporter {
  id: string;
  display_name: string;
  email: string | null;
  profile_id: string | null;
  amount: number;
  access_level: string;
  note: string | null;
  created_at: string;
}

export interface Opportunity {
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
}

export interface OpportunityApplication {
  id: string;
  opportunity_id: string;
  profile_id: string;
  status: ApplicationStatus;
  note: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
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
}

export interface ProjectParticipant {
  id: string;
  project_id: string;
  profile_id: string;
  status: ParticipantStatus;
  joined_at: string;
}

export interface ProjectCardAssignment {
  id: string;
  project_id: string;
  profile_id: string;
  card_key: string;   // e.g. "A♠", "7♥", "Q♦", "Joker Red"
  assigned_at: string;
}

export interface ProjectSubmission {
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
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}
