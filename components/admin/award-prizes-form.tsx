"use client";

import { useState, useTransition } from "react";
import { Frown, Gift, Save, Swords, Trophy } from "lucide-react";
import { toast } from "sonner";

import { updateAwardPrizes } from "@/app/actions/site-settings";
import type { AwardPrizes } from "@/lib/data/site-settings";
import { copy } from "@/lib/i18n";
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

type PrizeKey = keyof AwardPrizes;

interface CategoryField {
  key: PrizeKey;
  icon: typeof Trophy;
  title: string;
  description: string;
}

const CATEGORY_FIELDS: CategoryField[] = [
  {
    key: "mostWins",
    icon: Trophy,
    title: copy.premi.cards.mostWins,
    description: "Premio per il giocatore con più vittorie nel mese.",
  },
  {
    key: "mostMatches",
    icon: Swords,
    title: copy.premi.cards.mostMatches,
    description: "Premio per il giocatore con più partite giocate nel mese.",
  },
  {
    key: "mostLosses",
    icon: Frown,
    title: copy.premi.cards.mostLosses,
    description: "Premio per il giocatore con più sconfitte nel mese.",
  },
];

/**
 * Admin form for the monthly award prizes. For each of the three award
 * categories shown on /classifica/premi the admin can type a free-text
 * prize. Saved to the `site_settings` singleton row - see
 * app/actions/site-settings.ts.
 */
export function AwardPrizesForm({
  initialPrizes,
}: {
  initialPrizes: AwardPrizes;
}) {
  const [prizes, setPrizes] = useState<AwardPrizes>(initialPrizes);
  const [isPending, startTransition] = useTransition();

  const updatePrize = (key: PrizeKey, value: string) => {
    setPrizes((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateAwardPrizes({
        mostWins: prizes.mostWins,
        mostMatches: prizes.mostMatches,
        mostLosses: prizes.mostLosses,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setPrizes(result.data.prizes);
      toast.success("Premi salvati. Ora visibili nella pagina Premi pubblica.");
    });
  };

  return (
    <Card className="overflow-hidden border-tennis/30 bg-gradient-to-br from-tennis/10 via-background to-background">
      <CardHeader className="gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-tennis/15 text-tennis">
            <Gift className="h-5 w-5" />
          </span>
          <CardTitle>Premi mensili</CardTitle>
        </div>
        <CardDescription>
          Scrivi a mano il premio per ogni categoria. Il testo inserito viene
          mostrato accanto alla rispettiva card nella pagina pubblica Premi
          (Classifica → Premi). Lascia il campo vuoto per non assegnare un
          premio alla categoria.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORY_FIELDS.map(({ key, icon: Icon, title, description }) => (
            <div
              key={key}
              className="flex flex-col gap-3 rounded-xl border bg-background/80 p-4"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tennis/15 text-tennis">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold">{title}</h3>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`prize-${key}`}>Premio</Label>
                <Input
                  id={`prize-${key}`}
                  name={`prize-${key}`}
                  value={prizes[key]}
                  onChange={(event) => updatePrize(key, event.target.value)}
                  placeholder="Es. Coppa + spumante"
                  maxLength={200}
                />
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-tennis text-tennis-foreground hover:bg-tennis/90"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Salvataggio..." : "Salva premi"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
