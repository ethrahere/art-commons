import Link from "next/link";
import { Brush, Users, DollarSign, BookOpen, ArrowRight } from "lucide-react";

const features = [
  {
    icon: DollarSign,
    title: "Financial Resources",
    description:
      "Grants, emergency funds, supply subsidies, and financial tools built for artists.",
  },
  {
    icon: Users,
    title: "Artist Directory",
    description:
      "Find and connect with artists across every discipline. Build your network.",
  },
  {
    icon: BookOpen,
    title: "Community",
    description:
      "Share work, get feedback, ask for advice, and support fellow artists.",
  },
  {
    icon: Brush,
    title: "Supplies & Tools",
    description:
      "Discover resources, discounts, and tools recommended by the community.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <nav className="border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight">
          Art Commons
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-[var(--color-accent)] text-[var(--color-canvas)] px-4 py-2 rounded-md font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Join the commons
          </Link>
        </div>
      </nav>

      <main>
        <section className="px-6 py-24 text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
            The commons for{" "}
            <span className="text-[var(--color-accent)]">every artist</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] mb-10 max-w-xl mx-auto">
            Financial infrastructure, community support, and a directory of
            artists — all in one place. Built by artists, for artists.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-[var(--color-canvas)] px-6 py-3 rounded-md font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Join for free <ArrowRight size={16} />
            </Link>
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] px-6 py-3 rounded-md font-medium hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)] transition-colors"
            >
              Browse the directory
            </Link>
          </div>
        </section>

        <section className="px-6 py-16 max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-xl p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-subtle)] flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[var(--color-accent)]" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)] px-6 py-8 text-center text-sm text-[var(--color-text-secondary)]">
        Art Commons — built for the creative community
      </footer>
    </div>
  );
}
