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
import { verifyPlayerPin } from "@/app/actions/pin";
import { submitMatchResult } from "@/app/actions/matches";
import { PIN_LENGTH } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { MatchOutcome, SocioPublic } from "@/lib/types";

type WizardStep = 1 | 2 | 3;

interface WizardState {
  step: WizardStep;
  submitter: SocioPublic | null;
  pin: string;
  opponent: SocioPublic | null;
  outcome: MatchOutcome | null;
  score: string;
  error: string | null;
}

const INITIAL_STATE: WizardState = {
  step: 1,
  submitter: null,
  pin: "",
  opponent: null,
  outcome: null,
  score: "",
  error: null,
};

/**
 * 3-step "add match" wizard, rendered inside a modal (bottom sheet on
 * mobile) as suggested by the product spec, instead of a dedicated route:
 *   1. identify the submitting player (name + PIN),
 *   2. pick the opponent (type-ahead search),
 *   3. pick win/loss and type the set score.
 */
export function AddMatchDialog({ players }: { players: SocioPublic[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setState(INITIAL_STATE);
  }

  function handleStepOneSubmit() {
    if (!state.submitter) return;
    setState((s) => ({ ...s, error: null }));
    startTransition(async () => {
      const result = await verifyPlayerPin({
        playerId: state.submitter!.id,
        pin: state.pin,
      });
      if (!result.success) {
        setState((s) => ({ ...s, error: result.error }));
        return;
      }
      setState((s) => ({ ...s, step: 2 }));
    });
  }

  function handleFinalSubmit() {
    if (!state.submitter || !state.opponent || !state.outcome) return;
    setState((s) => ({ ...s, error: null }));
    startTransition(async () => {
      const result = await submitMatchResult({
        inseritoreId: state.submitter!.id,
        inseritorePin: state.pin,
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
            {state.step === 1 && "Identificati con il tuo nome e il tuo PIN."}
            {state.step === 2 && "Cerca il tuo avversario tra i soci."}
            {state.step === 3 && "Indica l'esito e il punteggio dei set."}
          </DialogDescription>
        </DialogHeader>

        {state.step === 1 && (
          <div className="flex flex-col gap-4">
            <PlayerCombobox
              label="Il tuo nome"
              players={players}
              value={state.submitter}
              onChange={(player) =>
                setState((s) => ({ ...s, submitter: player }))
              }
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="submitter-pin">
                Il tuo PIN ({PIN_LENGTH} cifre)
              </Label>
              <Input
                id="submitter-pin"
                inputMode="numeric"
                maxLength={PIN_LENGTH}
                value={state.pin}
                onChange={(event) =>
                  setState((s) => ({
                    ...s,
                    pin: event.target.value.replace(/\D/g, ""),
                  }))
                }
              />
            </div>
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <DialogFooter>
              <Button
                disabled={
                  !state.submitter ||
                  state.pin.length !== PIN_LENGTH ||
                  isPending
                }
                onClick={handleStepOneSubmit}
              >
                {isPending ? "Verifica in corso..." : "Continua"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {state.step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Ciao{" "}
              <span className="font-medium text-foreground">
                {state.submitter?.nome}
              </span>
              , contro chi hai giocato?
            </p>
            <PlayerCombobox
              label="Cerca avversario"
              players={players}
              excludeId={state.submitter?.id}
              value={state.opponent}
              onChange={(player) =>
                setState((s) => ({ ...s, opponent: player }))
              }
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setState((s) => ({ ...s, step: 1 }))}
              >
                Indietro
              </Button>
              <Button
                disabled={!state.opponent}
                onClick={() => setState((s) => ({ ...s, step: 3 }))}
              >
                Continua
              </Button>
            </DialogFooter>
          </div>
        )}

        {state.step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Esito della partita</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setState((s) => ({ ...s, outcome: "win" }))
                  }
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
                  onClick={() =>
                    setState((s) => ({ ...s, outcome: "loss" }))
                  }
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
                onClick={() => setState((s) => ({ ...s, step: 2 }))}
              >
                Indietro
              </Button>
              <Button
                disabled={!state.outcome || !state.score.trim() || isPending}
                onClick={handleFinalSubmit}
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
