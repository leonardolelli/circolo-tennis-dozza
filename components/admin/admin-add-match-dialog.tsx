"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createAdminMatch } from "@/app/actions/matches";
import { PlayerCombobox } from "@/components/shared/player-combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ActionResult, MatchOutcome, SocioPublic } from "@/lib/types";

const INITIAL_STATE: ActionResult | null = null;

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function toUtcIsoValue(value: string) {
  return new Date(value).toISOString();
}

export function AdminAddMatchDialog({ players }: { players: SocioPublic[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [playerOne, setPlayerOne] = useState<SocioPublic | null>(null);
  const [playerTwo, setPlayerTwo] = useState<SocioPublic | null>(null);
  // Winner is chosen by tapping a player name (like the member dialog):
  // "win" = playerOne won, "loss" = playerTwo won (relative to playerOne).
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  const [score, setScore] = useState("");
  const [dateValue, setDateValue] = useState("");

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setPlayerOne(null);
      setPlayerTwo(null);
      setOutcome(null);
      setScore("");
      setDateValue("");
      return;
    }

    setDateValue((current) => current || toDateTimeLocalValue(new Date().toISOString()));
  }, [open]);

  const canSubmit = useMemo(() => {
    return (
      !!playerOne &&
      !!playerTwo &&
      playerOne.id !== playerTwo.id &&
      !!outcome &&
      !!score.trim() &&
      !!dateValue
    );
  }, [dateValue, outcome, playerOne, playerTwo, score]);

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await createAdminMatch(INITIAL_STATE, formData);

      if (!result.success) {
        setErrorMessage(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Match aggiunto dal pannello admin.");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-tennis text-tennis-foreground hover:bg-tennis/90" disabled={players.length < 2}>
          <Plus className="h-4 w-4" />
          Aggiungi match
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi match</DialogTitle>
          <DialogDescription>
            Registra un risultato come amministratore, con attribuzione ai
            giocatori selezionati.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="inseritoreId" value={playerOne?.id ?? ""} />
          <input type="hidden" name="avversarioId" value={playerTwo?.id ?? ""} />
          <input type="hidden" name="esito" value={outcome ?? ""} />
          <input type="hidden" name="data" value={dateValue ? toUtcIsoValue(dateValue) : ""} />

          <div className="grid gap-4 sm:grid-cols-2">
            <PlayerCombobox
              label="Giocatore 1"
              players={players}
              value={playerOne}
              onChange={(player) => {
                setPlayerOne(player);
                setOutcome(null);
              }}
            />
            <PlayerCombobox
              label="Giocatore 2"
              players={players}
              value={playerTwo}
              excludeId={playerOne?.id}
              onChange={(player) => {
                setPlayerTwo(player);
                setOutcome(null);
              }}
            />
          </div>

          {playerOne && playerTwo ? (
            <div className="flex flex-col gap-1.5">
              <Label>Chi ha vinto la partita?</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setOutcome("win")}
                  aria-pressed={outcome === "win"}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm font-semibold transition-colors",
                    outcome === "win"
                      ? "border-tennis bg-tennis/10 text-tennis"
                      : "hover:bg-accent",
                  )}
                >
                  {playerOne.nome} {playerOne.cognome}
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome("loss")}
                  aria-pressed={outcome === "loss"}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm font-semibold transition-colors",
                    outcome === "loss"
                      ? "border-tennis bg-tennis/10 text-tennis"
                      : "hover:bg-accent",
                  )}
                >
                  {playerTwo.nome} {playerTwo.cognome}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Seleziona Giocatore 1 e Giocatore 2: appariranno i pulsanti per
              scegliere chi ha vinto la partita.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-match-score">
                Punteggio di chi ha vinto (es. 8-2 o 6-4 6-2)
              </Label>
              <Input
                id="admin-match-score"
                name="risultato"
                value={score}
                placeholder="es. 8-2 oppure 6-4 6-2"
                onChange={(event) => setScore(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-match-date">Data e ora</Label>
              <Input
                id="admin-match-date"
                type="datetime-local"
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
                required
              />
            </div>
          </div>

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending ? "Salvataggio..." : "Registra match"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}