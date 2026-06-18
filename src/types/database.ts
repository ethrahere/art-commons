// Auto-generate this file with: npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
// This is a placeholder until you connect your Supabase project.

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
  created_at: string;
  updated_at: string;
};

type PostRow = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: "general" | "feedback" | "advice" | "resources" | "financial" | "showcase";
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
  category: "grant" | "supply" | "financial_aid" | "tool" | "workshop" | "other";
  submitted_by: string | null;
  is_approved: boolean;
  deadline: string | null;
  created_at: string;
  updated_at: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
