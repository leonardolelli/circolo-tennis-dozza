import { Suspense } from "react";
import Link from "next/link";
import { Award, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddMatchDialog } from "@/components/classifica/add-match-dialog";
import { ClassificaBrowser } from "@/components/classifica/classifica-browser";
import { getRankedMembers } from "@/lib/data/members";
import { getCategoryConfig } from "@/lib/data/site-settings";
import { copy } from "@/lib/i18n";
import { sanitizeSearchQuery } from "@/lib/validation";

export const metadata = {
  title: copy.classifica.title,
};

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
  // Fetch the ranking once; filtering and pagination happen client-side in
  // ClassificaBrowser, so typing never triggers another DB query.
  const [members, categoryConfig] = await Promise.all([
    getRankedMembers(),
    getCategoryConfig(),
  ]);
  const params = await searchParams;
  const initialQuery = sanitizeSearchQuery(params.q ?? "");
  const initialPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  return (
    <ClassificaBrowser
      members={members}
      initialQuery={initialQuery}
      initialPage={initialPage}
      categoryConfig={categoryConfig}
    />
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
