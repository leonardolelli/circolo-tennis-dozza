"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import { CLUB_NAME, SITE_NAV_ITEMS } from "@/lib/constants";
import { ThemeSwitcher } from "@/components/theme-switcher";

const ICONS = { "/": Home, "/classifica": Trophy } as const;

/** Desktop-only vertical navigation. Hidden below the `md` breakpoint. */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center gap-3 px-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tennis text-sm font-bold text-tennis-foreground">
          CT
        </span>
        <span className="truncate text-lg font-semibold tracking-tight">
          {CLUB_NAME}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {SITE_NAV_ITEMS.map(({ href, label }) => {
          const isActive = pathname === href;
          const Icon = ICONS[href];
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-tennis")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-sidebar-border px-6 py-4">
        <span className="text-xs text-sidebar-foreground/50">
          {CLUB_NAME}
        </span>
        <ThemeSwitcher className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
      </div>
    </aside>
  );
}
