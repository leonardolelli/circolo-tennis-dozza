"use client";

import { useState, useTransition } from "react";
import { Construction, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { setMaintenanceMode } from "@/app/actions/site-settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function MaintenanceModeCard({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEnabled, setIsEnabled] = useState(initialEnabled);

  const handleToggle = () => {
    const nextValue = !isEnabled;

    startTransition(async () => {
      const result = await setMaintenanceMode(nextValue);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setIsEnabled(result.data.maintenanceMode);
      toast.success(
        result.data.maintenanceMode
          ? "Modalità manutenzione attivata."
          : "Modalità manutenzione disattivata.",
      );
    });
  };

  return (
    <Card className="overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50 via-background to-lime-50 dark:border-amber-900/60 dark:from-amber-950/30 dark:via-card dark:to-lime-950/20">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                <Construction className="h-5 w-5" />
              </span>
              <Badge variant={isEnabled ? "default" : "secondary"} className="w-fit">
                {isEnabled ? "Manutenzione attiva" : "Sito in campo"}
              </Badge>
            </div>
            <CardTitle>Modalità manutenzione</CardTitle>
            <CardDescription>
              Mostra su tutte le pagine pubbliche un avviso mentre il sito è in manutenzione.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant={isEnabled ? "destructive" : "default"}
            className={!isEnabled ? "bg-tennis text-tennis-foreground hover:bg-tennis/90" : undefined}
            disabled={isPending}
            onClick={handleToggle}
          >
            <Sparkles className="h-4 w-4" />
            {isPending
              ? "Aggiornamento..."
              : isEnabled
                ? "Disattiva manutenzione"
                : "Attiva manutenzione"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200/60 bg-background/80 p-3 dark:border-amber-900/60 dark:bg-card/70">
          Banner visibile a tutti i visitatori fuori dall&apos;area admin.
        </div>
        <div className="rounded-xl border border-amber-200/60 bg-background/80 p-3 dark:border-amber-900/60 dark:bg-card/70">
          Utile per interventi rapidi, aggiornamenti o lavori in corso.
        </div>
        <div className="rounded-xl border border-amber-200/60 bg-background/80 p-3 dark:border-amber-900/60 dark:bg-card/70">
          L&apos;area admin resta operativa per chi è autenticato.
        </div>
      </CardContent>
    </Card>
  );
}