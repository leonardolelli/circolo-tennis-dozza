import type { ReactNode } from "react";
import { Suspense } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MaintenanceNotice } from "@/components/layout/maintenance-banner";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSiteSettings } from "@/lib/data/site-settings";
import { getCurrentSocio } from "@/lib/auth";
import { IS_VERCEL_DEPLOYMENT } from "@/lib/env";

/**
 * Member-facing shell: a vertical sidebar on desktop (`md:` and up) and a
 * bottom tab bar on mobile, wrapping Home / Classifica / Cronologia. The
 * admin section and the login page intentionally render outside this shell
 * (see app/admin/layout.tsx and app/login/page.tsx).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}

async function AppShellContent({ children }: { children: ReactNode }) {
  const [settings, currentSocio] = await Promise.all([
    getSiteSettings(),
    getCurrentSocio(),
  ]);

  if (settings.maintenanceMode && IS_VERCEL_DEPLOYMENT) {
    return (
      <div className="min-h-svh bg-background">
        <MaintenanceNotice fullscreen />
      </div>
    );
  }

  const userName = currentSocio
    ? `${currentSocio.nome} ${currentSocio.cognome}`.trim()
    : null;
  const isAdmin = currentSocio?.is_admin ?? false;

  return (
    <div className="min-h-svh bg-background">
      <AppSidebar userName={userName} isAdmin={isAdmin} />
      <div className="flex min-h-svh flex-col md:pl-64">
        <MobileHeader userName={userName} isAdmin={isAdmin} />
        <main className="flex-1 animate-fade-in pb-24 md:pb-10">
          {children}
        </main>
        <SiteFooter />
      </div>
      <BottomNav />
    </div>
  );
}
