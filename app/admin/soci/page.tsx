import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { AddMemberDialog } from "@/components/admin/add-member-dialog";
import { MembersTable } from "@/components/admin/members-table";
import { MembersSearch } from "@/components/admin/members-search";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/i18n";
import { sanitizeSearchQuery } from "@/lib/validation";
import type { SocioAdmin } from "@/lib/types";

export const metadata = {
  title: copy.admin.players.title,
};

const PATHNAME = "/admin/soci";

interface AdminSociPageProps {
  searchParams: Promise<{ q?: string }>;
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
        <AddMemberDialog />
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
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = sanitizeSearchQuery(params.q ?? "");

  const supabase = await createClient();
  let dbQuery = supabase
    .from("soci")
    .select(
      "id, nome, cognome, telefono, punti, punti_iniziali, vittorie, sconfitte, congelato, data_ultima_partita, created_at",
    );

  if (query) {
    dbQuery = dbQuery.or(`nome.ilike.%${query}%,cognome.ilike.%${query}%`);
  }

  const { data, error } = await dbQuery.order("cognome", { ascending: true });

  if (error) {
    console.error("Failed to load members:", error);
  }

  const members: SocioAdmin[] = data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {members.length} giocatori registrati.
      </p>
      <MembersSearch pathname={PATHNAME} query={query} />
      <MembersTable members={members} />
    </div>
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
