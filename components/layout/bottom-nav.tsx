"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import { SITE_NAV_ITEMS } from "@/lib/constants";

const ICONS = { "/": Home, "/classifica": Trophy } as const;

/** Mobile-only bottom tab bar. Hidden at the `md` breakpoint and above. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] text-sidebar-foreground md:hidden"
    >
      {SITE_NAV_ITEMS.map(({ href, label }) => {
        const isActive = pathname === href;
        const Icon = ICONS[href];
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium"
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-tennis" : "text-sidebar-foreground/60",
              )}
            />
            <span
              className={cn(
                isActive
                  ? "text-sidebar-foreground"
                  : "text-sidebar-foreground/60",
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
