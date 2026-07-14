import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { AddMemberDialog } from "@/components/admin/add-member-dialog";
import { MembersCsvTools } from "@/components/admin/members-csv-tools";
import { MembersTable } from "@/components/admin/members-table";
import { MembersSearch } from "@/components/admin/members-search";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/i18n";
import { sanitizeSearchQuery } from "@/lib/validation";
import type { SocioAdmin } from "@/lib/types";

export const metadata = {
  title: copy.admin.players.title,
};

const PATHNAME = "/admin/soci";
const PAGE_SIZE = 10;

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
  const params = await searchParams;
  const query = sanitizeSearchQuery(params.q ?? "");
  const currentPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const supabase = await createClient();
  let dbQuery = supabase
    .from("soci")
    .select(
      "id, nome, cognome, telefono, punti, punti_iniziali, vittorie, sconfitte, congelato, data_ultima_partita, created_at",
    );

  if (query) {
    dbQuery = dbQuery.or(`nome.ilike.%${query}%,cognome.ilike.%${query}%`);
  }

  const { data, error } = await dbQuery
    .order("punti", { ascending: false })
    .order("cognome", { ascending: true })
    .order("nome", { ascending: true });

  if (error) {
    console.error("Failed to load members:", error);
  }

  const members: SocioAdmin[] = data ?? [];
  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visibleMembers = members.slice(start, start + PAGE_SIZE);

  function buildHref(page: number) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (page > 1) next.set("page", String(page));
    const queryString = next.toString();
    return queryString ? `${PATHNAME}?${queryString}` : PATHNAME;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {members.length} giocatori registrati.
      </p>
      <MembersSearch pathname={PATHNAME} query={query} />
      <MembersTable members={visibleMembers} />
      <Pagination currentPage={safePage} totalPages={totalPages} buildHref={buildHref} />
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
