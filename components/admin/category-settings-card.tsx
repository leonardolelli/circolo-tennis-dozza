"use client";

import { useState, useTransition } from "react";
import { Layers, Save, Swords } from "lucide-react";
import { toast } from "sonner";

import { updateCategorySettings } from "@/app/actions/site-settings";
import {
  DEFAULT_CATEGORY_CONFIG,
  getCategoryLabel,
  getMaxRankDelta,
  type CategoryConfig,
  type PlayerCategory,
} from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryBadge } from "@/components/shared/category-badge";

function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const CATEGORY_ORDER: PlayerCategory[] = ["gold", "silver", "bronze"];

/**
 * Admin form for the player category parameters (score thresholds and the
 * maximum number of ranking positions each category may challenge above
 * itself). Saved to the `site_settings` singleton row - see
 * app/actions/site-settings.ts and lib/categories.ts.
 */
export function CategorySettingsCard({
  initialConfig,
}: {
  initialConfig: CategoryConfig;
}) {
  const [goldMin, setGoldMin] = useState(String(initialConfig.goldMin));
  const [silverMin, setSilverMin] = useState(String(initialConfig.silverMin));
  const [goldMaxRankDelta, setGoldMaxRankDelta] = useState(
    String(initialConfig.goldMaxRankDelta),
  );
  const [silverMaxRankDelta, setSilverMaxRankDelta] = useState(
    String(initialConfig.silverMaxRankDelta),
  );
  const [bronzeMaxRankDelta, setBronzeMaxRankDelta] = useState(
    String(initialConfig.bronzeMaxRankDelta),
  );
  const [isPending, startTransition] = useTransition();

  const liveConfig: CategoryConfig = {
    goldMin: parseNumber(goldMin, DEFAULT_CATEGORY_CONFIG.goldMin),
    silverMin: parseNumber(silverMin, DEFAULT_CATEGORY_CONFIG.silverMin),
    goldMaxRankDelta: parseNumber(
      goldMaxRankDelta,
      DEFAULT_CATEGORY_CONFIG.goldMaxRankDelta,
    ),
    silverMaxRankDelta: parseNumber(
      silverMaxRankDelta,
      DEFAULT_CATEGORY_CONFIG.silverMaxRankDelta,
    ),
    bronzeMaxRankDelta: parseNumber(
      bronzeMaxRankDelta,
      DEFAULT_CATEGORY_CONFIG.bronzeMaxRankDelta,
    ),
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateCategorySettings({
        goldMin: liveConfig.goldMin,
        silverMin: liveConfig.silverMin,
        goldMaxRankDelta: liveConfig.goldMaxRankDelta,
        silverMaxRankDelta: liveConfig.silverMaxRankDelta,
        bronzeMaxRankDelta: liveConfig.bronzeMaxRankDelta,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setGoldMin(String(result.data.categories.goldMin));
      setSilverMin(String(result.data.categories.silverMin));
      setGoldMaxRankDelta(String(result.data.categories.goldMaxRankDelta));
      setSilverMaxRankDelta(
        String(result.data.categories.silverMaxRankDelta),
      );
      setBronzeMaxRankDelta(String(result.data.categories.bronzeMaxRankDelta));
      toast.success("Parametri delle categorie salvati.");
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden border-tennis/30 bg-gradient-to-br from-tennis/10 via-background to-background">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-tennis/15 text-tennis">
              <Layers className="h-5 w-5" />
            </span>
            <CardTitle>Categorie giocatori</CardTitle>
          </div>
          <CardDescription>
            Ogni giocatore appartiene a una categoria in base ai suoi punti in
            classifica. Ogni categoria può sfidare al massimo un certo numero
            di posizioni sopra di sé: chi è più in basso in classifica può
            sempre essere sfidato senza limiti.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          {CATEGORY_ORDER.map((category) => (
            <div
              key={category}
              className="flex flex-col gap-2 rounded-xl border bg-background/80 p-4"
            >
              <div className="flex items-center justify-between">
                <CategoryBadge category={category} />
                <span className="text-xs font-semibold text-foreground">
                  fino a {getMaxRankDelta(category, liveConfig)} posizioni
                </span>
              </div>
              <p className="text-xs">
                {category === "gold" &&
                  `Da ${liveConfig.goldMin} punti in su.`}
                {category === "silver" &&
                  `Da ${liveConfig.silverMin} a ${
                    liveConfig.goldMin - 1
                  } punti.`}
                {category === "bronze" &&
                  `Fino a ${Math.max(0, liveConfig.silverMin - 1)} punti.`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-tennis/15 text-tennis">
              <Swords className="h-5 w-5" />
            </span>
            <CardTitle>Parametri delle categorie</CardTitle>
          </div>
          <CardDescription>
            Le soglie dei punteggi e i limiti di sfida si applicano a ogni
            nuova richiesta di sfida da parte dei giocatori.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Oro */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goldMin">Soglia Oro</Label>
              <Input
                id="goldMin"
                name="goldMin"
                type="number"
                min={0}
                max={5000}
                value={goldMin}
                onChange={(event) => setGoldMin(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Punti da cui un giocatore è{" "}
                {getCategoryLabel("gold").toLowerCase()}.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goldMaxRankDelta">
                Oro: posizioni sfidabili sopra
              </Label>
              <Input
                id="goldMaxRankDelta"
                name="goldMaxRankDelta"
                type="number"
                min={1}
                max={50}
                value={goldMaxRankDelta}
                onChange={(event) => setGoldMaxRankDelta(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Quante posizioni sopra di sé può sfidare un giocatore Oro.
              </p>
            </div>

            {/* Argento */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="silverMin">Soglia Argento</Label>
              <Input
                id="silverMin"
                name="silverMin"
                type="number"
                min={0}
                max={5000}
                value={silverMin}
                onChange={(event) => setSilverMin(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Punti da cui un giocatore è{" "}
                {getCategoryLabel("silver").toLowerCase()}.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="silverMaxRankDelta">
                Argento: posizioni sfidabili sopra
              </Label>
              <Input
                id="silverMaxRankDelta"
                name="silverMaxRankDelta"
                type="number"
                min={1}
                max={50}
                value={silverMaxRankDelta}
                onChange={(event) => setSilverMaxRankDelta(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Quante posizioni sopra di sé può sfidare un giocatore Argento.
              </p>
            </div>

            {/* Bronzo */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bronzeMax">Soglia Bronzo</Label>
              <Input
                id="bronzeMax"
                type="number"
                value={Math.max(0, liveConfig.silverMin - 1)}
                disabled
                className="text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Calcolata automaticamente: Soglia Argento - 1. Fino a{" "}
                {Math.max(0, liveConfig.silverMin - 1)} punti un giocatore è{" "}
                {getCategoryLabel("bronze").toLowerCase()}.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bronzeMaxRankDelta">
                Bronzo: posizioni sfidabili sopra
              </Label>
              <Input
                id="bronzeMaxRankDelta"
                name="bronzeMaxRankDelta"
                type="number"
                min={1}
                max={50}
                value={bronzeMaxRankDelta}
                onChange={(event) => setBronzeMaxRankDelta(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Quante posizioni sopra di sé può sfidare un giocatore Bronzo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-tennis text-tennis-foreground hover:bg-tennis/90"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Salvataggio..." : "Salva parametri"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
