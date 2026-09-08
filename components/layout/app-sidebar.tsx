"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogIn, Shield, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import { CLUB_NAME, SITE_NAV_ITEMS } from "@/lib/constants";
import { getInitials } from "@/lib/format";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";

const ICONS = { "/": Home, "/classifica": Trophy } as const;

/** Desktop-only vertical navigation. Hidden below the `md` breakpoint. */
export function AppSidebar({
  userName,
  isAdmin = false,
}: {
  /** Display name of the logged-in socio, or null/undefined when anonymous. */
  userName?: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const isLoggedIn = Boolean(userName);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center gap-3 px-6">
        {isLoggedIn ? (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tennis text-sm font-bold text-tennis-foreground">
              {userName ? getInitials(userName) : "CT"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight tracking-tight">
                {userName}
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                {isAdmin ? "Amministratore" : "Socio"}
              </p>
            </div>
          </>
        ) : (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tennis text-sm font-bold text-tennis-foreground">
              CT
            </span>
            <span className="truncate text-lg font-semibold tracking-tight">
              {CLUB_NAME}
            </span>
          </>
        )}
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

      <div className="space-y-1.5 border-t border-sidebar-border p-3">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg bg-tennis/15 px-3 py-2 text-sm font-semibold text-tennis transition-colors hover:bg-tennis/25"
          >
            <Shield className="h-4 w-4" />
            Area admin
          </Link>
        )}
        {isLoggedIn ? (
          <LogoutButton />
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <LogIn className="h-4 w-4" />
            Accedi
          </Link>
        )}
        <div className="flex items-center justify-between border-t border-sidebar-border px-3 pt-3">
          <span className="text-xs text-sidebar-foreground/50">
            {isLoggedIn ? (isAdmin ? "Area di gestione" : "Socio") : CLUB_NAME}
          </span>
          <ThemeSwitcher className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
        </div>
      </div>
    </aside>
  );
}
