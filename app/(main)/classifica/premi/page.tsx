import { Suspense, type ComponentType } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Frown, Swords, Trophy } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMonthlyAwards } from "@/lib/data/awards";
import { copy } from "@/lib/i18n";

export const metadata = {
  title: copy.premi.title,
};

export default function PremiPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{copy.premi.title}</h1>
          <p className="text-sm text-muted-foreground">
            {copy.premi.subtitle}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/classifica">
            <ArrowLeft className="h-4 w-4" />
            {copy.premi.backToRanking}
          </Link>
        </Button>
      </div>

      <Suspense fallback={<PremiSkeleton />}>
        <PremiContent />
      </Suspense>
    </div>
  );
}

async function PremiContent() {
  const awards = await getMonthlyAwards();

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 text-sm text-muted-foreground">
        {copy.premi.periodLabel}{" "}
        <span className="font-medium text-foreground">{awards.monthLabel}</span>
        {" · "}
        {awards.totalMatches} partit{awards.totalMatches === 1 ? "a" : "e"} registrat
        {awards.totalMatches === 1 ? "a" : "e"}.
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <AwardCard
          title={copy.premi.cards.mostWins}
          icon={Trophy}
          leaders={awards.mostWins}
          unit={copy.premi.units.wins}
        />
        <AwardCard
          title={copy.premi.cards.mostMatches}
          icon={Swords}
          leaders={awards.mostMatches}
          unit={copy.premi.units.matches}
        />
        <AwardCard
          title={copy.premi.cards.mostLosses}
          icon={Frown}
          leaders={awards.mostLosses}
          unit={copy.premi.units.losses}
        />
      </div>
    </div>
  );
}

function AwardCard({
  title,
  leaders,
  unit,
  icon: Icon,
}: {
  title: string;
  leaders: Array<{ id: string; name: string; value: number }>;
  unit: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-tennis" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>

      {leaders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.premi.empty}</p>
      ) : (
        <ul className="space-y-2">
          {leaders.map((leader) => (
            <li key={leader.id} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-sm">
                <BadgeCheck className="h-4 w-4 shrink-0 text-tennis" />
                <span className="truncate">{leader.name}</span>
              </span>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {leader.value} {unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function PremiSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-14 w-full rounded-lg" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-44 w-full rounded-lg" />
        <Skeleton className="h-44 w-full rounded-lg" />
        <Skeleton className="h-44 w-full rounded-lg" />
      </div>
    </div>
  );
}
