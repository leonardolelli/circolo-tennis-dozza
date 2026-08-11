import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { AddMemberDialog } from "@/components/admin/add-member-dialog";
import { MembersCsvTools } from "@/components/admin/members-csv-tools";
import { MembersBrowser } from "@/components/admin/members-browser";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/i18n";
import { sanitizeSearchQuery } from "@/lib/validation";
import type { SocioAdmin } from "@/lib/types";

export const metadata = {
  title: copy.admin.players.title,
};

interface AdminSociPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default function AdminSociPage({ searchParams }: AdminSociPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {copy.admin.players.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {copy.admin.players.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MembersCsvTools />
          <AddMemberDialog />
        </div>
      </div>

      <Suspense fallback={<SociPageSkeleton />}>
        <SociContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SociContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  // Fetch all members once; filtering and pagination happen client-side in
  // MembersBrowser, so typing never triggers another DB query.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("soci")
    .select(
      "id, nome, cognome, telefono, punti, punti_iniziali, vittorie, sconfitte, congelato, data_ultima_partita, created_at",
    )
    .order("punti", { ascending: false })
    .order("cognome", { ascending: true })
    .order("nome", { ascending: true });

  if (error) {
    console.error("Failed to load members:", error);
  }

  const members: SocioAdmin[] = data ?? [];
  const params = await searchParams;
  const initialQuery = sanitizeSearchQuery(params.q ?? "");
  const initialPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  return (
    <MembersBrowser
      members={members}
      initialQuery={initialQuery}
      initialPage={initialPage}
    />
  );
}

function SociPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-10 w-full max-w-xs" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
