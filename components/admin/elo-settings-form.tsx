"use client";

import { useState, useTransition } from "react";
import { Calculator, Info, Save, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { updateEloSettings } from "@/app/actions/site-settings";
import { calculateEloDelta, DEFAULT_ELO_PARAMS, type EloParams } from "@/lib/elo";
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

interface ExampleScenario {
  id: string;
  winner: number;
  loser: number;
  title: string;
  description: string;
}

const EXAMPLES: ExampleScenario[] = [
  {
    id: "even",
    winner: 1000,
    loser: 1000,
    title: "Partita equilibrata",
    description: "Due giocatori allo stesso livello (1000 vs 1000).",
  },
  {
    id: "favorite",
    winner: 1500,
    loser: 1000,
    title: "Il favorito vince",
    description: "Il giocatore più forte batte il meno forte (1500 vs 1000).",
  },
  {
    id: "upset",
    winner: 1000,
    loser: 1500,
    title: "La sorpresa",
    description: "Il giocatore meno forte batte il favorito (1000 vs 1500).",
  },
];

function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function EloSettingsForm({ initialParams }: { initialParams: EloParams }) {
  const [kFactor, setKFactor] = useState(String(initialParams.kFactor));
  const [minDelta, setMinDelta] = useState(String(initialParams.minDelta));
  const [minRating, setMinRating] = useState(String(initialParams.minRating));
  const [isPending, startTransition] = useTransition();

  const liveKFactor = parseNumber(kFactor, DEFAULT_ELO_PARAMS.kFactor);
  const liveMinDelta = parseNumber(minDelta, DEFAULT_ELO_PARAMS.minDelta);
  const liveMinRating = parseNumber(minRating, DEFAULT_ELO_PARAMS.minRating);
  const params: EloParams = {
    kFactor: liveKFactor,
    minRating: liveMinRating,
    minDelta: liveMinDelta,
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateEloSettings({
        kFactor: liveKFactor,
        minDelta: liveMinDelta,
        minRating: liveMinRating,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setKFactor(String(result.data.elo.kFactor));
      setMinDelta(String(result.data.elo.minDelta));
      setMinRating(String(result.data.elo.minRating));
      toast.success("Parametri dei punteggi salvati.");
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Explanation */}
      <Card className="overflow-hidden border-tennis/30 bg-gradient-to-br from-tennis/10 via-background to-background">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-tennis/15 text-tennis dark:text-tennis">
              <Info className="h-5 w-5" />
            </span>
            <Badge className="w-fit">Come funziona</Badge>
          </div>
          <CardTitle>Sistema di punteggio Elo</CardTitle>
          <CardDescription>
            Ogni partita sposta punti dal perdente al vincitore: chi vince guadagna
            esattamente gli stessi punti che chi perde perde. Quanti punti si
            spostano dipende dal punteggio dei due giocatori al momento della partita.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="rounded-xl border bg-background/80 p-4">
            <p className="font-medium text-foreground">Risultato atteso = pochi punti</p>
            <p className="mt-1">
              Se il giocatore più forte batte uno molto più debole (risultato
              scontato), si spostano pochi punti: il più forte non guadagna quasi
              nulla battendo un principiante.
            </p>
          </div>
          <div className="rounded-xl border bg-background/80 p-4">
            <p className="font-medium text-foreground">Sorpresa = tanti punti</p>
            <p className="mt-1">
              Se invece il giocatore meno forte batte il favorito (una sorpresa),
              si spostano molti punti, fino allo spostamento massimo K.
            </p>
          </div>
          <div className="rounded-xl border bg-background/80 p-4">
            <p className="font-medium text-foreground">Partita alla pari = K/2 punti</p>
            <p className="mt-1">
              Se i due giocatori hanno lo stesso punteggio, il vincitore guadagna
              esattamente la metà dello spostamento massimo ({Math.round(liveKFactor / 2)} punti
              con i valori attuali).
            </p>
          </div>
          <div className="rounded-xl border bg-background/80 p-4">
            <p className="font-medium text-foreground">Punteggio minimo</p>
            <p className="mt-1">
              Nessun giocatore può scendere sotto {liveMinRating} punti, anche dopo
              tante sconfitte consecutive.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Parameters */}
      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-tennis/15 text-tennis">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <CardTitle>Parametri dei punteggi</CardTitle>
          </div>
          <CardDescription>
            Le modifiche si applicano alle partite successive. Quando modifichi o
            elimini una partita nella sezione Cronologia match, la classifica viene
            ricalcolata con i parametri correnti.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kFactor">Spostamento massimo (K)</Label>
              <Input
                id="kFactor"
                name="kFactor"
                type="number"
                min={1}
                max={200}
                value={kFactor}
                onChange={(event) => setKFactor(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Punti massimi che possono cambiare di mano in una singola partita.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="minDelta">Spostamento minimo</Label>
              <Input
                id="minDelta"
                name="minDelta"
                type="number"
                min={1}
                max={100}
                value={minDelta}
                onChange={(event) => setMinDelta(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ogni partita sposta sempre almeno questi punti, anche a risultato scontato.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="minRating">Punteggio minimo</Label>
              <Input
                id="minRating"
                name="minRating"
                type="number"
                min={0}
                max={5000}
                value={minRating}
                onChange={(event) => setMinRating(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nessun giocatore può scendere sotto questo valore.
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

      {/* Examples */}
      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-tennis/15 text-tennis">
              <Calculator className="h-5 w-5" />
            </span>
            <CardTitle>Esempi con i parametri correnti</CardTitle>
          </div>
          <CardDescription>
            I punti si aggiornano in tempo reale mentre modifichi i parametri qui sopra.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {EXAMPLES.map(({ id, winner, loser, title, description }) => {
            const delta = calculateEloDelta(winner, loser, params);

            return (
              <div
                key={id}
                className="flex flex-col gap-3 rounded-xl border bg-background/80 p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <Badge variant="default" className="bg-tennis text-tennis-foreground">
                    +{delta} punti
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    al vincitore e -{delta} al perdente
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
