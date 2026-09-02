import { Suspense } from "react";

import { AwardPrizesForm } from "@/components/admin/award-prizes-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getSiteSettings } from "@/lib/data/site-settings";

export const metadata = {
  title: "Premi",
};

export default function AdminPremiPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Premi</h1>
        <p className="text-sm text-muted-foreground">
          Assegna un premio a ogni categoria mensile mostrata nella pagina
          pubblica Premi della classifica.
        </p>
      </div>

      <Suspense fallback={<PremiPageSkeleton />}>
        <PremiContent />
      </Suspense>
    </div>
  );
}

async function PremiContent() {
  const settings = await getSiteSettings();

  return <AwardPrizesForm initialPrizes={settings.prizes} />;
}

function PremiPageSkeleton() {
  return <Skeleton className="h-96 w-full rounded-2xl" />;
}
