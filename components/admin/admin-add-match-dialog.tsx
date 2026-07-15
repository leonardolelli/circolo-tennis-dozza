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
  const [submitter, setSubmitter] = useState<SocioPublic | null>(null);
  const [opponent, setOpponent] = useState<SocioPublic | null>(null);
  const [outcome, setOutcome] = useState<MatchOutcome>("win");
  const [score, setScore] = useState("");
  const [dateValue, setDateValue] = useState("");

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setSubmitter(null);
      setOpponent(null);
      setOutcome("win");
      setScore("");
      setDateValue("");
      return;
    }

    setDateValue((current) => current || toDateTimeLocalValue(new Date().toISOString()));
  }, [open]);

  const canSubmit = useMemo(() => {
    return submitter && opponent && submitter.id !== opponent.id && score.trim() && dateValue;
  }, [dateValue, opponent, score, submitter]);

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
            Registra un risultato come amministratore, senza richiesta di PIN.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="inseritoreId" value={submitter?.id ?? ""} />
          <input type="hidden" name="avversarioId" value={opponent?.id ?? ""} />
          <input type="hidden" name="esito" value={outcome} />
          <input type="hidden" name="data" value={dateValue ? toUtcIsoValue(dateValue) : ""} />

          <PlayerCombobox
            label="Giocatore che ha inserito il risultato"
            players={players}
            value={submitter}
            onChange={setSubmitter}
          />
          <PlayerCombobox
            label="Avversario"
            players={players}
            value={opponent}
            excludeId={submitter?.id}
            onChange={setOpponent}
          />

          <div className="flex flex-col gap-1.5">
            <Label>Esito per il giocatore inseritore</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={outcome === "win" ? "default" : "outline"}
                onClick={() => setOutcome("win")}
              >
                Ha vinto
              </Button>
              <Button
                type="button"
                variant={outcome === "loss" ? "default" : "outline"}
                onClick={() => setOutcome("loss")}
              >
                Ha perso
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-match-score">Punteggio</Label>
              <Input
                id="admin-match-score"
                name="risultato"
                value={score}
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