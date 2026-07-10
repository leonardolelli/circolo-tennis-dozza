import { ThemeSwitcher } from "@/components/theme-switcher";
import { CLUB_NAME } from "@/lib/constants";

/** Sticky top bar shown only on mobile (the sidebar carries branding on desktop). */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tennis text-xs font-bold text-tennis-foreground">
          CT
        </span>
        <span className="text-sm font-semibold tracking-tight">
          {CLUB_NAME}
        </span>
      </div>
      <ThemeSwitcher />
    </header>
  );
}
