"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addMember } from "@/app/actions/members";
import { Checkbox } from "@/components/ui/checkbox";
import type { ActionResult } from "@/lib/types";

const INITIAL_STATE: ActionResult | null = null;

export function AddMemberDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      formRef.current?.reset();
      setIsAdmin(false);
    }
  }, [open]);

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);
    formData.set("isAdmin", isAdmin ? "on" : "off");

    startTransition(async () => {
      const result = await addMember(INITIAL_STATE, formData);

      if (!result.success) {
        setErrorMessage(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Giocatore aggiunto con successo.");
      setOpen(false);
      router.refresh();
    });
  };

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
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              required
              autoCapitalize="none"
              autoComplete="username"
              placeholder="es. mario.rossi"
              pattern="[a-z0-9._-]{2,30}"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              placeholder="Minimo 8 caratteri"
            />
          </div>
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
          <div className="flex items-center gap-2">
            <Checkbox
              id="isAdmin"
              checked={isAdmin}
              onCheckedChange={(checked) => setIsAdmin(checked === true)}
            />
            <Label htmlFor="isAdmin" className="cursor-pointer">
              Amministratore (accesso all&apos;area di gestione)
            </Label>
          </div>
          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
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
