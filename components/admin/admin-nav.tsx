import Link from "next/link";
import { History, LayoutDashboard, Users } from "lucide-react";

import { CLUB_NAME } from "@/lib/constants";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/soci", label: "Giocatori", icon: Users },
  { href: "/admin/cronologia-match", label: "Cronologia match", icon: History },
] as const;

export function AdminNav({ email }: { email?: string }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <Link
            href="/admin"
            className="flex min-w-0 items-start gap-2 font-semibold sm:items-center"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tennis text-xs font-bold text-tennis-foreground">
              CT
            </span>
            <span className="min-w-0 text-sm leading-tight break-words">
              {CLUB_NAME} · Admin
            </span>
          </Link>
          <nav className="flex min-w-0 flex-wrap items-center gap-1">
            {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex max-w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:self-end">
          {email && (
            <span className="min-w-0 text-sm text-muted-foreground break-all sm:break-normal">
              {email}
            </span>
          )}
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            <span className="whitespace-nowrap">Torna al</span>{" "}
            <span className="whitespace-nowrap">sito</span>
          </Link>
          <ThemeSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
