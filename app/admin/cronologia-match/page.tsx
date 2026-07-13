import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { MatchesFilters } from "@/components/cronologia/matches-filters";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminMatchesTable } from "@/components/admin/admin-matches-table";
import { sanitizeSearchQuery } from "@/lib/validation";
import type { Partita, SocioPublic } from "@/lib/types";

export const metadata = {
  title: "Cronologia match",
};

const PAGE_SIZE = 5;
const PATHNAME = "/admin/cronologia-match";

interface AdminCronologiaSearchParams {
  page?: string;
  q?: string;
  sort?: string;
}

export default function AdminCronologiaMatchPage({
  searchParams,
}: {
  searchParams: Promise<AdminCronologiaSearchParams>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Cronologia match
        </h1>
        <p className="text-sm text-muted-foreground">
          Modifica o elimina i match registrati dal pannello amministratore.
        </p>
      </div>

      <Suspense fallback={<AdminCronologiaSkeleton />}>
        <AdminCronologiaContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminCronologiaContent({
  searchParams,
}: {
  searchParams: Promise<AdminCronologiaSearchParams>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = sanitizeSearchQuery(params.q ?? "");
  const sort: "asc" | "desc" = params.sort === "asc" ? "asc" : "desc";

  const supabase = await createClient();
  let matchesQuery = supabase.from("partite").select("*", { count: "exact" });

  if (query) {
    matchesQuery = matchesQuery.or(
      `nome_completo_inseritore.ilike.%${query}%,nome_completo_avversario.ilike.%${query}%`,
    );
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data: matchesData, count, error: matchesError }, { data: playersData, error: playersError }] = await Promise.all([
    matchesQuery.order("data", { ascending: sort === "asc" }).range(from, to),
    supabase
      .from("soci")
      .select("id, nome, cognome, punti, vittorie, sconfitte, congelato, data_ultima_partita, created_at")
      .order("cognome", { ascending: true }),
  ]);

  if (matchesError) {
    console.error("Failed to load admin match history:", matchesError);
  }
  if (playersError) {
    console.error("Failed to load admin players:", playersError);
  }

  const matches: Partita[] = matchesData ?? [];
  const players: SocioPublic[] = playersData ?? [];
  const totalMatches = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));

  function buildHref(overrides: Record<string, string | number | undefined>) {
    const merged: Record<string, string | number | undefined> = {
      q: query || undefined,
      sort: sort !== "desc" ? sort : undefined,
      page: currentPage > 1 ? currentPage : undefined,
      ...overrides,
    };
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== "") next.set(key, String(value));
    }
    const queryString = next.toString();
    return queryString ? `${PATHNAME}?${queryString}` : PATHNAME;
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {totalMatches} match registrat{totalMatches === 1 ? "o" : "i"} in totale.
      </p>

      <MatchesFilters pathname={PATHNAME} query={query} sort={sort} />

      <AdminMatchesTable
        matches={matches}
        players={players}
        sortDirection={sort}
        sortHref={buildHref({ sort: sort === "asc" ? "desc" : "asc", page: undefined })}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={(page) => buildHref({ page: page > 1 ? page : undefined })}
      />
    </div>
  );
}

function AdminCronologiaSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-10 w-full max-w-xs" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}