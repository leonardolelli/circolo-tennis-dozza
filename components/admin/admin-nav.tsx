"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Construction, Gift, History, LayoutDashboard, Trophy, Users } from "lucide-react";

import { CLUB_NAME } from "@/lib/constants";
import { getInitials } from "@/lib/format";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/soci", label: "Giocatori", icon: Users },
  { href: "/admin/punteggi", label: "Punteggi", icon: Trophy },
  { href: "/admin/cronologia-match", label: "Cronologia match", icon: History },
  { href: "/admin/premi", label: "Premi", icon: Gift },
  { href: "/admin/manutenzione", label: "Manutenzione", icon: Construction },
] as const;

export function AdminNav({ userName }: { userName?: string }) {
  const pathname = usePathname();
  // Admin header shows only the first name so a long "Nome Cognome" never
  // gets truncated with "…". The avatar still uses the full-name initials.
  const firstName = userName ? userName.trim().split(/\s+/)[0] : undefined;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tennis text-sm font-bold text-tennis-foreground">
              {userName ? getInitials(userName) : "CT"}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold tracking-tight">
                {firstName ?? CLUB_NAME}
              </span>
              {firstName && (
                <span className="block text-xs text-muted-foreground">
                  Amministratore
                </span>
              )}
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/"
              className="whitespace-nowrap text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Torna al sito
            </Link>
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/admin"
                ? pathname === "/admin"
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex max-w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-tennis")} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
