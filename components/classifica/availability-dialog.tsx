"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateAvailability } from "@/app/actions/members";
import type { ActionResult, SocioPublic } from "@/lib/types";

const MAX_LENGTH = 150;
const INITIAL_STATE: ActionResult | null = null;

/**
 * "Aggiungi disponibilità" dialog: lets the logged-in socio publish a
 * free-text availability (days and times they can play), max 150 characters.
 * The value is shown to opponents inside the challenge dialog. Leaving the
 * field empty clears the saved availability.
 */
export function AvailabilityDialog({
  currentSocio,
}: {
  currentSocio: SocioPublic;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentSocio.disponibilita ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Restore the persisted value every time the dialog is (re)opened, so a
  // cancelled edit never leaks into the next opening.
  useEffect(() => {
    if (!open) {
      setValue(currentSocio.disponibilita ?? "");
      setErrorMessage(null);
    }
  }, [open, currentSocio.disponibilita]);

  function handleSubmit(formData: FormData) {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updateAvailability(INITIAL_STATE, formData);

      if (!result.success) {
        setErrorMessage(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Disponibilità salvata.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarClock className="h-4 w-4" />
          Aggiungi disponibilità
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>La tua disponibilità</DialogTitle>
          <DialogDescription>
            Scrivi i giorni e gli orari in cui sei disponibile a giocare: la
            vedranno i giocatori che ti sfidano.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="disponibilita">Giorni e orari</Label>
            <Textarea
              id="disponibilita"
              name="disponibilita"
              value={value}
              maxLength={MAX_LENGTH}
              rows={3}
              placeholder="es. Lunedì-Venerdì dalle 17 in poi"
              onChange={(event) => setValue(event.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {value.length}/{MAX_LENGTH}
            </p>
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
              {isPending ? "Salvataggio..." : "Salva disponibilità"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
