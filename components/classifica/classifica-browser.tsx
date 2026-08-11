"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClientPagination } from "@/components/ui/client-pagination";
import { RankingList } from "@/components/classifica/ranking-list";
import { copy, getPlayerLabel } from "@/lib/i18n";
import { sanitizeSearchQuery } from "@/lib/validation";
import type { SocioPublic } from "@/lib/types";

const PAGE_SIZE = 10;
const PATHNAME = "/classifica";

/**
 * Client-side ranking browser. The server passes all members once; filtering
 * and pagination happen in memory here, so typing/paginating never triggers a
 * new DB fetch. The query and page are mirrored to the URL (replaceState) to
 * keep links shareable.
 */
export function ClassificaBrowser({
  members,
  initialQuery,
  initialPage,
}: {
  members: SocioPublic[];
  initialQuery: string;
  initialPage: number;
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
        fullName.includes(normalizedQuery) ||
        reversedName.includes(normalizedQuery)
      );
    });
  }, [members, query]);

  // The real 1-based rank of every member in the full classifica, keyed by id,
  // so filtered results keep their actual position instead of restarting at 1.
  const rankByMemberId = useMemo(() => {
    const ranks: Record<string, number> = {};
    members.forEach((member, index) => {
      ranks[member.id] = index + 1;
    });
    return ranks;
  }, [members]);

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredMembers.length} {getPlayerLabel(filteredMembers.length)} in
          classifica.
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
      </div>

      <RankingList
        members={visibleMembers}
        players={members}
        ranks={rankByMemberId}
      />

      <ClientPagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <Card className="space-y-2 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          {copy.classifica.usage.title}
        </p>
        <p>{copy.classifica.usage.challenge}</p>
        <p>{copy.classifica.usage.search}</p>
        <p>{copy.classifica.usage.frozen}</p>
      </Card>
    </div>
  );
}
