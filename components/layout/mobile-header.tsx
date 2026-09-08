import Link from "next/link";
import { LogIn, Shield } from "lucide-react";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import { CLUB_NAME } from "@/lib/constants";
import { getInitials } from "@/lib/format";

/**
 * Sticky top bar shown only on mobile (the sidebar carries branding on
 * desktop). When a socio is logged in it shows the member's own name instead
 * of the club brand, plus a quick logout and - for admins - a clear entry to
 * the /admin management area.
 */
export function MobileHeader({
  userName,
  isAdmin = false,
}: {
  /** Display name of the logged-in socio, or null/undefined when anonymous. */
  userName?: string | null;
  isAdmin?: boolean;
}) {
  const isLoggedIn = Boolean(userName);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-3 backdrop-blur-md sm:px-4 md:hidden">
      {isLoggedIn ? (
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tennis text-[11px] font-bold text-tennis-foreground">
            {userName ? getInitials(userName) : "CT"}
          </span>
          <span className="truncate text-sm font-semibold tracking-tight">
            {userName}
          </span>
        </div>
      ) : (
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tennis text-xs font-bold text-tennis-foreground">
            CT
          </span>
          <span className="truncate text-sm font-semibold tracking-tight">
            {CLUB_NAME}
          </span>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {isLoggedIn ? (
          <>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1 rounded-md bg-tennis/15 px-2.5 py-1.5 text-xs font-semibold text-tennis transition-colors hover:bg-tennis/25 sm:px-3 sm:text-sm"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            <LogoutButton />
          </>
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
