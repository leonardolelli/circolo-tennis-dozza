import { Suspense } from "react";
import Link from "next/link";
import { Award, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MembersSearch } from "@/components/admin/members-search";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { RankingList } from "@/components/classifica/ranking-list";
import { AddMatchDialog } from "@/components/classifica/add-match-dialog";
import { getRankedMembers } from "@/lib/data/members";
import { copy, getPlayerLabel } from "@/lib/i18n";
import { sanitizeSearchQuery } from "@/lib/validation";

export const metadata = {
  title: copy.classifica.title,
};

const PATHNAME = "/classifica";
const PAGE_SIZE = 10;

interface ClassificaSearchParams {
  page?: string;
  q?: string;
}

export default function ClassificaPage({
  searchParams,
}: {
  searchParams: Promise<ClassificaSearchParams>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {copy.classifica.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {copy.classifica.subtitle}
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex gap-2">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-44" />
            </div>
          }
        >
          <ClassificaActions />
        </Suspense>
      </div>

      <Suspense fallback={<RankingListSkeleton />}>
        <ClassificaContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/** Depends on the same cached member list as the ranking below - see getRankedMembers. */
async function ClassificaActions() {
  const members = await getRankedMembers();
  const activeMembers = members.filter((member) => !member.congelato);
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <Link href="/classifica/cronologia">
          <History className="h-4 w-4" />
          {copy.classifica.actions.history}
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/classifica/premi">
          <Award className="h-4 w-4" />
          {copy.classifica.actions.awards}
        </Link>
      </Button>
      <AddMatchDialog players={activeMembers} />
    </div>
  );
}

async function ClassificaContent({
  searchParams,
}: {
  searchParams: Promise<ClassificaSearchParams>;
}) {
  const members = await getRankedMembers();
  const params = await searchParams;
  const query = sanitizeSearchQuery(params.q ?? "");
  const currentPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const filteredMembers = members.filter((member) => {
    if (!query) return true;
    const fullName = `${member.nome} ${member.cognome}`.toLowerCase();
    const reversedName = `${member.cognome} ${member.nome}`.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    return (
      fullName.includes(normalizedQuery) ||
      reversedName.includes(normalizedQuery)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visibleMembers = filteredMembers.slice(start, start + PAGE_SIZE);

  function buildHref(page: number) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (page > 1) next.set("page", String(page));
    const queryString = next.toString();
    return queryString ? `${PATHNAME}?${queryString}` : PATHNAME;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredMembers.length} {getPlayerLabel(filteredMembers.length)} in classifica.
        </p>
        <MembersSearch pathname={PATHNAME} query={query} />
      </div>

      <RankingList members={visibleMembers} players={members} rankStart={start + 1} />

      <Pagination currentPage={safePage} totalPages={totalPages} buildHref={buildHref} />

      <Card className="space-y-2 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{copy.classifica.usage.title}</p>
        <p>
          {copy.classifica.usage.challenge}
        </p>
        <p>
          {copy.classifica.usage.search}
        </p>
        <p>
          {copy.classifica.usage.frozen}
        </p>
      </Card>
    </div>
  );
}

function RankingListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}
