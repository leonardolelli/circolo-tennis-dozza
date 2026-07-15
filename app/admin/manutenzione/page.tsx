import { Suspense } from "react";

import { MaintenanceModeCard } from "@/components/admin/maintenance-mode-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSiteSettings } from "@/lib/data/site-settings";

export const metadata = {
  title: "Manutenzione",
};

export default function AdminMaintenancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Manutenzione
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestisci la schermata di manutenzione visibile sul sito pubblico.
        </p>
      </div>

      <Suspense fallback={<MaintenancePageSkeleton />}>
        <MaintenanceContent />
      </Suspense>
    </div>
  );
}

async function MaintenanceContent() {
  const siteSettings = await getSiteSettings();

  return <MaintenanceModeCard initialEnabled={siteSettings.maintenanceMode} />;
}

function MaintenancePageSkeleton() {
  return <Skeleton className="h-72 w-full rounded-2xl" />;
}