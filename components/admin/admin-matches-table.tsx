"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteMatch, updateMatch } from "@/app/actions/matches";
import { PlayerCombobox } from "@/components/shared/player-combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActionResult, MatchOutcome, Partita, SocioPublic } from "@/lib/types";

const INITIAL_STATE: ActionResult | null = null;

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function toUtcIsoValue(value: string) {
  return new Date(value).toISOString();
}

function inferSubmitterId(match: Partita) {
  if (!match.id_inseritore) return null;
  return match.id_inseritore;
}

function inferOpponentId(match: Partita) {
  if (!match.id_avversario) return null;
  return match.id_avversario;
}

/**
 * Points that changed hands in a match: "±X" when the swing is symmetric
 * (winner +X, loser −X), otherwise "+X" for the winner's gain.
 */
function variationLabel(match: Partita) {
  const winner = match.punti_vincitore_variazioni;
  const loser = match.punti_perdente_variazioni;
  return winner === loser ? `±${winner}` : `+${winner}`;
}

export function AdminMatchesTable({
  matches,
  players,
  sortHref,
  sortDirection,
}: {
  matches: Partita[];
  players: SocioPublic[];
  sortHref: string;
  sortDirection: "asc" | "desc";
}) {
  const [selectedMatch, setSelectedMatch] = useState<Partita | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
        Nessuna partita trovata con questi filtri.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <a href={sortHref} className="font-medium text-foreground hover:underline">
                  Data {sortDirection === "desc" ? "↓" : "↑"}
                </a>
              </TableHead>
              <TableHead>Partita</TableHead>
              <TableHead className="hidden sm:table-cell">Punteggio</TableHead>
              <TableHead className="text-right">Variazione punti</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(match.data)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                    <span
                      className={cn(
                        match.id_vincitore === match.id_inseritore
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {match.nome_completo_inseritore}
                    </span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span
                      className={cn(
                        match.id_vincitore === match.id_avversario
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {match.nome_completo_avversario}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                    {match.risultato}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{match.risultato}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className="border-tennis/40 text-tennis"
                  >
                    {variationLabel(match)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Azioni match</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedMatch(match);
                          setIsEditOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Modifica
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setSelectedMatch(match);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditMatchDialog
        match={selectedMatch}
        players={players}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteMatchDialog
        match={selectedMatch}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}

function EditMatchDialog({
  match,
  players,
  open,
  onOpenChange,
}: {
  match: Partita | null;
  players: SocioPublic[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [submitter, setSubmitter] = useState<SocioPublic | null>(null);
  const [opponent, setOpponent] = useState<SocioPublic | null>(null);
  const [outcome, setOutcome] = useState<MatchOutcome>("win");
  const [score, setScore] = useState("");
  const [dateValue, setDateValue] = useState("");

  useEffect(() => {
    if (!match) return;
    setSubmitter(players.find((player) => player.id === inferSubmitterId(match)) ?? null);
    setOpponent(players.find((player) => player.id === inferOpponentId(match)) ?? null);
    setOutcome(match.esito_inseritore);
    setScore(match.risultato);
    setDateValue(toDateTimeLocalValue(match.data));
  }, [match, players]);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
    }
  }, [open]);

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateMatch(INITIAL_STATE, formData);

      if (!result.success) {
        setErrorMessage(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Match aggiornato.");
      onOpenChange(false);
      router.refresh();
    });
  };

  const canSubmit = useMemo(() => {
    return submitter && opponent && submitter.id !== opponent.id && score.trim() && dateValue;
  }, [dateValue, opponent, score, submitter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica match</DialogTitle>
          <DialogDescription>
            Aggiorna i dettagli del match e ricalcola la classifica.
          </DialogDescription>
        </DialogHeader>
        {match && (
          <form action={handleSubmit} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={match.id} />
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
                <Label htmlFor="match-score">Punteggio</Label>
                <Input
                  id="match-score"
                  name="risultato"
                  value={score}
                  onChange={(event) => setScore(event.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="match-date">Data e ora</Label>
                <Input
                  id="match-date"
                  type="datetime-local"
                  value={dateValue}
                  onChange={(event) => setDateValue(event.target.value)}
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}

            <DialogFooter>
              <Button type="submit" disabled={!canSubmit || isPending}>
                {isPending ? "Salvataggio..." : "Salva modifiche"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteMatchDialog({
  match,
  open,
  onOpenChange,
}: {
  match: Partita | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Elimina match</DialogTitle>
          <DialogDescription>
            Il match verrà rimosso e la classifica sarà ricalcolata.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Vuoi eliminare il match tra {match?.nome_completo_inseritore} e {match?.nome_completo_avversario}?
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button
            variant="destructive"
            disabled={!match || isPending}
            onClick={() => {
              if (!match) return;
              startTransition(async () => {
                const result = await deleteMatch(match.id);
                if (!result.success) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Match eliminato.");
                onOpenChange(false);
                router.refresh();
              });
            }}
          >
            {isPending ? "Eliminazione..." : "Elimina"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}