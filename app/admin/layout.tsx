import type { ReactNode } from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getCurrentAdmin, getSessionUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Extra defense-in-depth on top of proxy.ts: even if a request somehow
 * reached this layout without going through the middleware, we still refuse
 * to render admin content unless the session belongs to an admin socio
 * (`soci.is_admin`). Members are sent back to the public site.
 *
 * The session check reads cookies (a dynamic, per-request API), so it's
 * isolated in its own async component wrapped in `<Suspense>` - required by
 * Next's Cache Components model (see next.config.ts).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-muted/30">
      <Suspense fallback={<AdminNavSkeleton />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </div>
  );
}

async function AdminGate({ children }: { children: ReactNode }) {
  const status = await getCurrentAdmin();

  if (!status.ok) {
    const user = await getSessionUser();
    // Logged in but not an admin (e.g. a member): back to the public site.
    redirect(user ? "/" : "/login?redirect=/admin");
  }

  const userName = `${status.socio.nome} ${status.socio.cognome}`.trim();

  return (
    <>
      <AdminNav userName={userName} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </>
  );
}

function AdminNavSkeleton() {
  return (
    <div className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}
