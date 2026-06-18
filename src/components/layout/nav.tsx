"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, MessageSquare, DollarSign, UserCircle } from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/directory", label: "Directory", icon: Users },
  { href: "/community", label: "Community", icon: MessageSquare },
  { href: "/finances", label: "Finances", icon: DollarSign },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[var(--color-border)] px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 bg-[var(--color-canvas)] z-10">
      <Link href="/dashboard" className="text-base font-semibold tracking-tight">
        Art Commons
      </Link>

      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
              pathname.startsWith(href)
                ? "text-[var(--color-text-primary)] bg-[var(--color-canvas-subtle)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
