import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import type { PostCategory, Post, Profile } from "@/types";

type PostSummary = Pick<Post, "id" | "title" | "category" | "created_at"> & {
  profiles: Pick<Profile, "display_name" | "username"> | null;
};

const CATEGORY_LABELS: Record<PostCategory, string> = {
  general: "General",
  feedback: "Feedback",
  advice: "Advice",
  resources: "Resources",
  financial: "Financial",
  showcase: "Showcase",
};

export default async function CommunityPage() {
  const supabase = await createServerClient();
  const { data: posts } = await supabase
    .from("posts")
    .select(`id, title, category, created_at, profiles(display_name, username)`)
    .order("created_at", { ascending: false }) as { data: PostSummary[] | null; error: unknown };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Community</h1>
          <p className="text-[var(--color-text-secondary)]">
            Share, ask, support, and connect.
          </p>
        </div>
        <Link
          href="/community/new"
          className="inline-flex items-center gap-1.5 bg-[var(--color-accent)] text-[var(--color-canvas)] px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <Plus size={16} /> New post
        </Link>
      </div>

      <div className="space-y-2">
        {posts?.map((post) => (
          <Link
            key={post.id}
            href={`/community/${post.id}`}
            className="flex items-center gap-4 bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-xl px-5 py-4 hover:border-[var(--color-accent)] transition-colors group"
          >
            <MessageSquare
              size={18}
              className="text-[var(--color-text-secondary)] flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium group-hover:text-[var(--color-accent)] transition-colors truncate">
                {post.title}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {post.profiles?.display_name} ·{" "}
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className="text-xs bg-[var(--color-canvas-muted)] text-[var(--color-text-secondary)] px-2 py-1 rounded-full flex-shrink-0">
              {CATEGORY_LABELS[post.category as PostCategory] ?? post.category}
            </span>
          </Link>
        ))}

        {(!posts || posts.length === 0) && (
          <p className="text-[var(--color-text-secondary)] py-12 text-center">
            No posts yet — start the conversation.
          </p>
        )}
      </div>
    </div>
  );
}
