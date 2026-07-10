import type { ReactNode } from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/admin-nav";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Extra defense-in-depth on top of proxy.ts: even if a request somehow
 * reached this layout without going through the middleware, we still
 * refuse to render admin content without a valid Supabase Auth session.
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
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login?redirect=/admin");
  }

  return (
    <>
      <AdminNav email={data.claims.email} />
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
