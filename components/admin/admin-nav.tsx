import Link from "next/link";
import { LayoutDashboard, Users } from "lucide-react";

import { CLUB_NAME } from "@/lib/constants";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/soci", label: "Soci", icon: Users },
] as const;

export function AdminNav({ email }: { email?: string }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 whitespace-nowrap font-semibold"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tennis text-xs font-bold text-tennis-foreground">
              CT
            </span>
            {CLUB_NAME} · Admin
          </Link>
          <nav className="flex items-center gap-1">
            {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {email && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {email}
            </span>
          )}
          <Link
            href="/"
            className="hidden text-sm text-muted-foreground underline-offset-4 hover:underline sm:inline"
          >
            Torna al sito
          </Link>
          <ThemeSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
