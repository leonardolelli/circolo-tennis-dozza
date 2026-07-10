import { Suspense } from "react";
import Link from "next/link";
import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RankingList } from "@/components/classifica/ranking-list";
import { AddMatchDialog } from "@/components/classifica/add-match-dialog";
import { getRankedMembers } from "@/lib/data/members";

export const metadata = {
  title: "Classifica",
};

export default function ClassificaPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Classifica
          </h1>
          <p className="text-sm text-muted-foreground">
            Punteggio stile Elo, aggiornato dopo ogni partita registrata.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex gap-2">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-44" />
            </div>
          }
        >
          <ClassificaActions />
        </Suspense>
      </div>

      <Suspense fallback={<RankingListSkeleton />}>
        <ClassificaRanking />
      </Suspense>
    </div>
  );
}

/** Depends on the same cached member list as the ranking below - see getRankedMembers. */
async function ClassificaActions() {
  const members = await getRankedMembers();
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <Link href="/classifica/cronologia">
          <History className="h-4 w-4" />
          Cronologia match
        </Link>
      </Button>
      <AddMatchDialog players={members} />
    </div>
  );
}

async function ClassificaRanking() {
  const members = await getRankedMembers();
  return <RankingList members={members} />;
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
