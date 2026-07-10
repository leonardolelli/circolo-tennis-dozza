import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";

/**
 * Member-facing shell: a vertical sidebar on desktop (`md:` and up) and a
 * bottom tab bar on mobile, wrapping Home / Classifica / Cronologia. The
 * admin section and the login page intentionally render outside this shell
 * (see app/admin/layout.tsx and app/login/page.tsx).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <AppSidebar />
      <div className="flex min-h-svh flex-col md:pl-64">
        <MobileHeader />
        <main className="flex-1 animate-fade-in pb-24 md:pb-10">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
