"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
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
import { addMember } from "@/app/actions/members";
import { PIN_LENGTH } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

const INITIAL_STATE: ActionResult | null = null;

export function AddMemberDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(addMember, INITIAL_STATE);

  useEffect(() => {
    if (state?.success) {
      toast.success("Giocatore aggiunto con successo.");
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-tennis text-tennis-foreground hover:bg-tennis/90">
          <UserPlus className="h-4 w-4" />
          Aggiungi giocatore
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi giocatore</DialogTitle>
          <DialogDescription>
            Il PIN verra usato dal giocatore per registrare i risultati e sfidare
            altri giocatori: comunicalo solo a lui.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required maxLength={60} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cognome">Cognome</Label>
              <Input id="cognome" name="cognome" required maxLength={60} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telefono">Numero di telefono</Label>
            <Input
              id="telefono"
              name="telefono"
              required
              placeholder="333 1234567"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="puntiIniziali">Punti iniziali</Label>
              <Input
                id="puntiIniziali"
                name="puntiIniziali"
                type="number"
                required
                defaultValue={1000}
                min={0}
                max={5000}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pin">PIN ({PIN_LENGTH} cifre)</Label>
              <Input
                id="pin"
                name="pin"
                required
                inputMode="numeric"
                maxLength={PIN_LENGTH}
                pattern="\d{8}"
              />
            </div>
          </div>
          {state && !state.success && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-tennis text-tennis-foreground hover:bg-tennis/90"
            >
              {isPending ? "Salvataggio..." : "Aggiungi giocatore"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
