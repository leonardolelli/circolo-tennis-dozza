import Link from "next/link";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MatchOutcome } from "@/lib/types";

interface MatchesFiltersProps {
  pathname: string;
  query: string;
  outcome: MatchOutcome | null;
  sort: "asc" | "desc";
}

function buildHref(
  pathname: string,
  params: Record<string, string | undefined>,
) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

/**
 * Filter bar for the match history: a plain GET `<form>` for the name
 * search and plain `<Link>`s for the outcome toggle, so the whole thing
 * works as server-rendered navigation with zero client-side JavaScript.
 */
export function MatchesFilters({
  pathname,
  query,
  outcome,
  sort,
}: MatchesFiltersProps) {
  const preserved = { sort: sort !== "desc" ? sort : undefined };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form
        action={pathname}
        method="GET"
        className="relative w-full sm:max-w-xs"
      >
        {preserved.sort && (
          <input type="hidden" name="sort" value={preserved.sort} />
        )}
        {outcome && <input type="hidden" name="esito" value={outcome} />}
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Cerca per nome o cognome..."
          className="pl-9"
        />
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref(pathname, { ...preserved, q: query || undefined })}
          className={cn(
            buttonVariants({ size: "sm", variant: !outcome ? "default" : "outline" }),
          )}
        >
          Tutte
        </Link>
        <Link
          href={buildHref(pathname, {
            ...preserved,
            q: query || undefined,
            esito: "win",
          })}
          className={cn(
            buttonVariants({
              size: "sm",
              variant: outcome === "win" ? "default" : "outline",
            }),
          )}
        >
          Vittorie
        </Link>
        <Link
          href={buildHref(pathname, {
            ...preserved,
            q: query || undefined,
            esito: "loss",
          })}
          className={cn(
            buttonVariants({
              size: "sm",
              variant: outcome === "loss" ? "default" : "outline",
            }),
          )}
        >
          Sconfitte
        </Link>
      </div>
    </div>
  );
}
