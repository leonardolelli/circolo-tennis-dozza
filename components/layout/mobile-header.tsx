import Link from "next/link";
import { LogIn } from "lucide-react";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import { CLUB_NAME } from "@/lib/constants";

/** Sticky top bar shown only on mobile (the sidebar carries branding on desktop). */
export function MobileHeader({
  userName,
}: {
  /** Display name of the logged-in socio, or null/undefined when anonymous. */
  userName?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tennis text-xs font-bold text-tennis-foreground">
          CT
        </span>
        <span className="truncate text-sm font-semibold tracking-tight">
          {CLUB_NAME}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {userName ? (
          <LogoutButton />
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogIn className="h-4 w-4" />
            Accedi
          </Link>
        )}
        <ThemeSwitcher />
      </div>
    </header>
  );
}
