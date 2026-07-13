import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

interface MatchesFiltersProps {
  pathname: string;
  query: string;
  sort: "asc" | "desc";
}

/**
 * Filter bar for the match history: a plain GET `<form>` for the name
 * search and plain `<Link>`s for the outcome toggle, so the whole thing
 * works as server-rendered navigation with zero client-side JavaScript.
 */
export function MatchesFilters({
  pathname,
  query,
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
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Cerca per nome o cognome..."
          className="pl-9"
        />
      </form>
    </div>
  );
}
