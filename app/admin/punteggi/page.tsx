import { Suspense } from "react";

import { EloSettingsForm } from "@/components/admin/elo-settings-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getSiteSettings } from "@/lib/data/site-settings";

export const metadata = {
  title: "Punteggi",
};

export default function AdminPunteggiPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Punteggi
        </h1>
        <p className="text-sm text-muted-foreground">
          Configura come vengono calcolati i punti in classifica e scopri come
          funziona il sistema.
        </p>
      </div>

      <Suspense fallback={<PunteggiPageSkeleton />}>
        <PunteggiContent />
      </Suspense>
    </div>
  );
}

async function PunteggiContent() {
  const settings = await getSiteSettings();

  return <EloSettingsForm initialParams={settings.elo} />;
}

function PunteggiPageSkeleton() {
  return <Skeleton className="h-96 w-full rounded-2xl" />;
}
