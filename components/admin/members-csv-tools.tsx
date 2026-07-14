"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { importMembersCsv } from "@/app/actions/members";
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
import type { ActionResult } from "@/lib/types";

const INITIAL_STATE: ActionResult<{ imported: number }> | null = null;

export function MembersCsvTools() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    importMembersCsv,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(`${state.data.imported} giocatori importati dal CSV.`);
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
      return;
    }

    if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <a href="/admin/soci/export">
          <Download className="h-4 w-4" />
          Scarica CSV
        </a>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="h-4 w-4" />
            Carica CSV
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importa giocatori da CSV</DialogTitle>
            <DialogDescription>
              Carica un CSV esportato da questa pagina per ripristinare o aggiornare
              la lista giocatori. I match non vengono importati.
            </DialogDescription>
          </DialogHeader>
          <form ref={formRef} action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="members-csv-file">File CSV</Label>
              <Input id="members-csv-file" name="file" type="file" accept=".csv" required />
            </div>
            {state && !state.success && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Importazione..." : "Importa CSV"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
