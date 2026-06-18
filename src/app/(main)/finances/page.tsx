import { createServerClient } from "@/lib/supabase/server";
import { ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import type { ResourceCategory, Resource } from "@/types";

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  grant: "Grant",
  supply: "Supply",
  financial_aid: "Financial Aid",
  tool: "Tool",
  workshop: "Workshop",
  other: "Other",
};

const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  grant: "text-green-400 bg-green-950",
  supply: "text-blue-400 bg-blue-950",
  financial_aid: "text-yellow-400 bg-yellow-950",
  tool: "text-purple-400 bg-purple-950",
  workshop: "text-pink-400 bg-pink-950",
  other: "text-[var(--color-text-secondary)] bg-[var(--color-canvas-muted)]",
};

export default async function FinancesPage() {
  const supabase = await createServerClient();
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false }) as { data: Resource[] | null; error: unknown };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Financial Resources</h1>
          <p className="text-[var(--color-text-secondary)]">
            Grants, supplies, tools, and financial aid for artists.
          </p>
        </div>
        <Link
          href="/finances/submit"
          className="inline-flex items-center gap-1.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] px-4 py-2 rounded-md text-sm font-medium hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)] transition-colors"
        >
          <Plus size={16} /> Submit resource
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {resources?.map((resource) => (
          <div
            key={resource.id}
            className="bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-xl p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold">{resource.title}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${CATEGORY_COLORS[resource.category as ResourceCategory] ?? CATEGORY_COLORS.other}`}
              >
                {CATEGORY_LABELS[resource.category as ResourceCategory] ?? resource.category}
              </span>
            </div>

            {resource.description && (
              <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-3">
                {resource.description}
              </p>
            )}

            {resource.deadline && (
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                Deadline: {new Date(resource.deadline).toLocaleDateString()}
              </p>
            )}

            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline"
              >
                Learn more <ExternalLink size={12} />
              </a>
            )}
          </div>
        ))}

        {(!resources || resources.length === 0) && (
          <p className="text-[var(--color-text-secondary)] col-span-2 py-12 text-center">
            No resources yet — submit the first one.
          </p>
        )}
      </div>
    </div>
  );
}
