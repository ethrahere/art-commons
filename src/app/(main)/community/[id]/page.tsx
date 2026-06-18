import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Post, Comment, Profile } from "@/types";

type PostWithAuthor = Post & { profiles: Pick<Profile, "display_name" | "username"> | null };
type CommentWithAuthor = Comment & { profiles: Pick<Profile, "display_name" | "username"> | null };

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: post } = await supabase
    .from("posts")
    .select(`*, profiles(display_name, username)`)
    .eq("id", id)
    .single() as { data: PostWithAuthor | null; error: unknown };

  if (!post) notFound();

  const { data: comments } = await supabase
    .from("comments")
    .select(`*, profiles(display_name, username)`)
    .eq("post_id", id)
    .order("created_at", { ascending: true }) as { data: CommentWithAuthor[] | null; error: unknown };

  return (
    <div className="max-w-2xl">
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to community
      </Link>

      <article className="bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <h1 className="text-xl font-bold mb-3">{post.title}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          {post.profiles?.display_name} ·{" "}
          {new Date(post.created_at).toLocaleDateString()}
        </p>
        <p className="leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </article>

      <section>
        <h2 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">
          {comments?.length ?? 0} replies
        </h2>

        <div className="space-y-4">
          {comments?.map((comment) => (
            <div
              key={comment.id}
              className="border-l-2 border-[var(--color-border)] pl-4"
            >
              <p className="text-sm font-medium mb-1">
                {comment.profiles?.display_name}
                <span className="text-[var(--color-text-secondary)] font-normal ml-2">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </p>
              <p className="text-sm leading-relaxed">{comment.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
