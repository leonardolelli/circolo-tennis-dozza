import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { MatchesFilters } from "@/components/cronologia/matches-filters";
import { MatchesTable } from "@/components/cronologia/matches-table";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeSearchQuery } from "@/lib/validation";
import type { MatchOutcome, Partita } from "@/lib/types";

export const metadata = {
  title: "Cronologia match",
};

const PAGE_SIZE = 10;
const PATHNAME = "/classifica/cronologia";

interface CronologiaSearchParams {
  page?: string;
  esito?: string;
  q?: string;
  sort?: string;
}

interface CronologiaPageProps {
  searchParams: Promise<CronologiaSearchParams>;
}

/**
 * The page itself is a static shell (title only); the filters/table/
 * pagination all depend on `searchParams` and a live Supabase query, so
 * they're isolated in an async child wrapped in `<Suspense>` - required by
 * Next's Cache Components model (see next.config.ts) for any uncached,
 * per-request data access.
 */
export default function CronologiaPage({ searchParams }: CronologiaPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Cronologia match
        </h1>
        <p className="text-sm text-muted-foreground">
          Storico di tutte le partite registrate dai soci.
        </p>
      </div>

      <Suspense fallback={<CronologiaSkeleton />}>
        <CronologiaContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CronologiaContent({
  searchParams,
}: {
  searchParams: Promise<CronologiaSearchParams>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const outcome: MatchOutcome | null =
    params.esito === "win" || params.esito === "loss" ? params.esito : null;
  const query = sanitizeSearchQuery(params.q ?? "");
  const sort: "asc" | "desc" = params.sort === "asc" ? "asc" : "desc";

  const supabase = await createClient();
  let dbQuery = supabase.from("partite").select("*", { count: "exact" });

  if (query) {
    dbQuery = dbQuery.or(
      `nome_completo_inseritore.ilike.%${query}%,nome_completo_avversario.ilike.%${query}%`,
    );
  }
  if (outcome === "win" && query) {
    dbQuery = dbQuery.ilike("nome_vincitore", `%${query}%`);
  } else if (outcome === "loss" && query) {
    dbQuery = dbQuery.ilike("nome_perdente", `%${query}%`);
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await dbQuery
    .order("data", { ascending: sort === "asc" })
    .range(from, to);

  if (error) {
    console.error("Failed to load match history:", error);
  }

  const matches: Partita[] = data ?? [];
  const totalMatches = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));

  function buildHref(overrides: Record<string, string | number | undefined>) {
    const merged: Record<string, string | number | undefined> = {
      q: query || undefined,
      esito: outcome ?? undefined,
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
        {totalMatches} partit{totalMatches === 1 ? "a" : "e"} registrat
        {totalMatches === 1 ? "a" : "e"} in totale.
      </p>

      <div className="flex flex-col gap-2">
        <MatchesFilters
          pathname={PATHNAME}
          query={query}
          outcome={outcome}
          sort={sort}
        />
        {outcome && !query && (
          <p className="text-xs text-muted-foreground">
            Aggiungi anche un nome per vedere le vittorie o le sconfitte di un
            socio specifico.
          </p>
        )}
      </div>

      <MatchesTable
        matches={matches}
        sortDirection={sort}
        sortHref={buildHref({
          sort: sort === "asc" ? "desc" : "asc",
          page: undefined,
        })}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={(page) => buildHref({ page: page > 1 ? page : undefined })}
      />
    </div>
  );
}

function CronologiaSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-10 w-full max-w-xs" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
