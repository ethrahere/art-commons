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
