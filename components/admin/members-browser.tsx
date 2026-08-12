"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ClientPagination } from "@/components/ui/client-pagination";
import { MembersTable } from "@/components/admin/members-table";
import { sanitizeSearchQuery } from "@/lib/validation";
import type { CategoryConfig } from "@/lib/categories";
import type { SocioAdmin } from "@/lib/types";

const PAGE_SIZE = 10;
const PATHNAME = "/admin/soci";

/**
 * Client-side members browser for the admin page. The server passes all
 * members once; filtering and pagination happen in memory here, so typing
 * never triggers a new DB fetch. The query and page are mirrored to the URL
 * (replaceState) to keep links shareable.
 */
export function MembersBrowser({
  members,
  initialQuery,
  initialPage,
  categoryConfig,
}: {
  members: SocioAdmin[];
  initialQuery: string;
  initialPage: number;
  categoryConfig: CategoryConfig;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = sanitizeSearchQuery(query).toLowerCase();
    if (!normalizedQuery) return members;
    return members.filter((member) => {
      const fullName = `${member.nome} ${member.cognome}`.toLowerCase();
      const reversedName = `${member.cognome} ${member.nome}`.toLowerCase();
      return (
        member.nome.toLowerCase().includes(normalizedQuery) ||
        member.cognome.toLowerCase().includes(normalizedQuery) ||
        fullName.includes(normalizedQuery) ||
        reversedName.includes(normalizedQuery)
      );
    });
  }, [members, query]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visibleMembers = filteredMembers.slice(start, start + PAGE_SIZE);

  function buildHref(page: number, nextQuery: string) {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (page > 1) params.set("page", String(page));
    const queryString = params.toString();
    return queryString ? `${PATHNAME}?${queryString}` : PATHNAME;
  }

  /** Mirrors the current filter/page to the URL without a server round-trip. */
  function syncUrl(nextQuery: string, page: number) {
    window.history.replaceState(null, "", buildHref(page, nextQuery));
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    setCurrentPage(1);
    syncUrl(sanitizeSearchQuery(nextQuery), 1);
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    syncUrl(sanitizeSearchQuery(query), page);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {filteredMembers.length} giocatori registrati.
      </p>
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Cerca per nome o cognome..."
          className="pl-9"
        />
      </div>

      <MembersTable
        members={visibleMembers}
        categoryConfig={categoryConfig}
      />

      <ClientPagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
