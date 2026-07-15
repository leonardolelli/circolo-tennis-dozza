"use client";

import { useEffect, useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Snowflake, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteMember, toggleMemberFrozen, updateMember } from "@/app/actions/members";
import { formatDate, formatWinRate } from "@/lib/format";
import { PIN_LENGTH } from "@/lib/validation";
import type { ActionResult, SocioAdmin } from "@/lib/types";

const INITIAL_STATE: ActionResult | null = null;

export function MembersTable({ members }: { members: SocioAdmin[] }) {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState<SocioAdmin | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (members.length === 0) {
    return (
      <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
        Nessun giocatore trovato.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Giocatore</TableHead>
              <TableHead className="hidden sm:table-cell">Telefono</TableHead>
              <TableHead className="hidden md:table-cell">Stato</TableHead>
              <TableHead className="text-right">Punti</TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                V - S
              </TableHead>
              <TableHead className="hidden text-right md:table-cell">
                % Vittorie
              </TableHead>
              <TableHead className="hidden text-right lg:table-cell">
                Ultima partita
              </TableHead>
              <TableHead className="w-12 text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span>
                      {member.nome} {member.cognome}
                    </span>
                    {member.congelato && (
                      <Badge variant="secondary" className="w-fit gap-1">
                        <Snowflake className="h-3 w-3" />
                        Congelato
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {member.telefono}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {member.congelato ? (
                    <Badge variant="secondary" className="gap-1">
                      <Snowflake className="h-3 w-3" />
                      Congelato
                    </Badge>
                  ) : (
                    <Badge variant="outline">Attivo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold text-tennis">
                  {member.punti}
                </TableCell>
                <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                  {member.vittorie} - {member.sconfitte}
                </TableCell>
                <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                  {formatWinRate(member.vittorie, member.sconfitte)}
                </TableCell>
                <TableCell className="hidden text-right text-muted-foreground lg:table-cell">
                  {member.data_ultima_partita
                    ? formatDate(member.data_ultima_partita)
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Azioni giocatore</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedMember(member);
                          setIsEditOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Modifica
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          startTransition(async () => {
                            const result = await toggleMemberFrozen(
                              member.id,
                              !member.congelato,
                            );
                            if (!result.success) {
                              toast.error(result.error);
                              return;
                            }
                            toast.success(
                              member.congelato
                                ? "Giocatore riattivato."
                                : "Giocatore congelato.",
                            );
                            router.refresh();
                          });
                        }}
                        disabled={isPending}
                      >
                        <Snowflake className="h-4 w-4" />
                        {member.congelato ? "Riattiva" : "Congela"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setSelectedMember(member);
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

      <EditMemberDialog
        member={selectedMember}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteMemberDialog
        member={selectedMember}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}

function EditMemberDialog({
  member,
  open,
  onOpenChange,
}: {
  member: SocioAdmin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
    }
  }, [open]);

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateMember(INITIAL_STATE, formData);

      if (!result.success) {
        setErrorMessage(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Giocatore aggiornato.");
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica giocatore</DialogTitle>
          <DialogDescription>
            Aggiorna i dati anagrafici e il punteggio del giocatore selezionato.
          </DialogDescription>
        </DialogHeader>
        {member && (
          <form action={handleSubmit} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={member.id} />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-nome">Nome</Label>
                <Input id="edit-nome" name="nome" defaultValue={member.nome} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-cognome">Cognome</Label>
                <Input id="edit-cognome" name="cognome" defaultValue={member.cognome} required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-telefono">Numero di telefono</Label>
              <Input
                id="edit-telefono"
                name="telefono"
                defaultValue={member.telefono}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-punti">Punteggio attuale</Label>
              <Input
                id="edit-punti"
                name="punti"
                type="number"
                defaultValue={member.punti}
                required
                min={0}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-pin">PIN ({PIN_LENGTH} cifre)</Label>
              <Input
                id="edit-pin"
                name="pin"
                inputMode="numeric"
                maxLength={PIN_LENGTH}
                pattern="\d{8}"
                placeholder="Lascia vuoto per non modificarlo"
              />
            </div>
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvataggio..." : "Salva modifiche"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteMemberDialog({
  member,
  open,
  onOpenChange,
}: {
  member: SocioAdmin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [shouldDeleteMatches, setShouldDeleteMatches] = useState(false);
  const [shouldRecalculateRanking, setShouldRecalculateRanking] = useState(true);

  useEffect(() => {
    if (!open) {
      setShouldDeleteMatches(false);
      setShouldRecalculateRanking(true);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Elimina giocatore</DialogTitle>
          <DialogDescription>
            Scegli come gestire cronologia e classifica prima di confermare.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Vuoi eliminare {member?.nome} {member?.cognome}?
        </p>
        <div className="flex flex-col gap-3 rounded-md border p-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="delete-member-matches"
              checked={shouldDeleteMatches}
              onCheckedChange={(checked) => setShouldDeleteMatches(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="delete-member-matches" className="cursor-pointer">
                Elimina anche i suoi match dalla cronologia
              </Label>
              <p className="text-xs text-muted-foreground">
                Se disattivato, i match rimangono visibili ma senza il giocatore eliminato.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="delete-member-recalculate"
              checked={shouldRecalculateRanking}
              onCheckedChange={(checked) => setShouldRecalculateRanking(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="delete-member-recalculate" className="cursor-pointer">
                Ricalcola classifica dopo la rimozione
              </Label>
              <p className="text-xs text-muted-foreground">
                Se disattivato, i punti attuali dei giocatori non verranno aggiornati.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button
            variant="destructive"
            disabled={!member || isPending}
            onClick={() => {
              if (!member) return;
              startTransition(async () => {
                const result = await deleteMember(member.id, {
                  deleteMatches: shouldDeleteMatches,
                  recalculateRanking: shouldRecalculateRanking,
                });
                if (!result.success) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Giocatore eliminato.");
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
