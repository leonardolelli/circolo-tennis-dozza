import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

interface MembersSearchProps {
  pathname: string;
  query: string;
}

/** Plain GET form (no client JS needed) for the admin members search box. */
export function MembersSearch({ pathname, query }: MembersSearchProps) {
  return (
    <form action={pathname} method="GET" className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Cerca per nome o cognome..."
        className="pl-9"
      />
    </form>
  );
}
