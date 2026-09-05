"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlayerCombobox } from "@/components/shared/player-combobox";
import { submitMatchResult } from "@/app/actions/matches";
import { cn } from "@/lib/utils";
import type { MatchOutcome, SocioPublic } from "@/lib/types";

type WizardStep = 1 | 2;

interface WizardState {
  step: WizardStep;
  opponent: SocioPublic | null;
  outcome: MatchOutcome | null;
  score: string;
  error: string | null;
}

const INITIAL_STATE: WizardState = {
  step: 1,
  opponent: null,
  outcome: null,
  score: "",
  error: null,
};

/**
 * "Add match" wizard rendered inside a modal (bottom sheet on mobile):
 *   1. pick the opponent (type-ahead search),
 *   2. pick win/loss and type the set score.
 * The submitting player is always the logged-in socio (`currentSocio`): no
 * self-identification or PIN is needed anymore (identity comes from the
 * session server-side).
 */
export function AddMatchDialog({
  players,
  currentSocio,
}: {
  players: SocioPublic[];
  currentSocio: SocioPublic;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setState(INITIAL_STATE);
  }

  function handleSubmit() {
    if (!state.opponent || !state.outcome) return;
    setState((s) => ({ ...s, error: null }));
    startTransition(async () => {
      const result = await submitMatchResult({
        avversarioId: state.opponent!.id,
        esito: state.outcome!,
        risultato: state.score,
      });
      if (!result.success) {
        setState((s) => ({ ...s, error: result.error }));
        return;
      }
      toast.success("Risultato registrato! La classifica è stata aggiornata.");
      handleOpenChange(false);
      router.refresh();
    });
  }

  const fullName = `${currentSocio.nome} ${currentSocio.cognome}`.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-tennis text-tennis-foreground hover:bg-tennis/90">
          <Plus className="h-4 w-4" />
          Aggiungi risultato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi risultato</DialogTitle>
          <DialogDescription>
            {state.step === 1
              ? `Registra la partita a nome di ${fullName}.`
              : "Indica l'esito e il punteggio dei set."}
          </DialogDescription>
        </DialogHeader>

        {state.step === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Ciao{" "}
              <span className="font-medium text-foreground">{fullName}</span>,
              contro chi hai giocato?
            </p>
            <PlayerCombobox
              label="Cerca avversario"
              players={players}
              excludeId={currentSocio.id}
              value={state.opponent}
              onChange={(player) =>
                setState((s) => ({ ...s, opponent: player }))
              }
            />
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <DialogFooter>
              <Button
                disabled={!state.opponent}
                onClick={() => setState((s) => ({ ...s, step: 2 }))}
              >
                Continua
              </Button>
            </DialogFooter>
          </div>
        )}

        {state.step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Esito della partita</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setState((s) => ({ ...s, outcome: "win" }))}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm font-semibold transition-colors",
                    state.outcome === "win"
                      ? "border-tennis bg-tennis/10 text-tennis"
                      : "hover:bg-accent",
                  )}
                >
                  Ho vinto
                </button>
                <button
                  type="button"
                  onClick={() => setState((s) => ({ ...s, outcome: "loss" }))}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm font-semibold transition-colors",
                    state.outcome === "loss"
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "hover:bg-accent",
                  )}
                >
                  Ho perso
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="score">Punteggio set (es. 6-4 6-2)</Label>
              <Input
                id="score"
                value={state.score}
                placeholder="6-4 6-2"
                onChange={(event) =>
                  setState((s) => ({ ...s, score: event.target.value }))
                }
              />
            </div>
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setState((s) => ({ ...s, step: 1 }))}
              >
                Indietro
              </Button>
              <Button
                disabled={!state.outcome || !state.score.trim() || isPending}
                onClick={handleSubmit}
                className="bg-tennis text-tennis-foreground hover:bg-tennis/90"
              >
                {isPending ? "Invio in corso..." : "Registra risultato"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
