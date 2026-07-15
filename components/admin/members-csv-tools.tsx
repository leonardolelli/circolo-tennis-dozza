"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      formRef.current?.reset();
    }
  }, [open]);

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await importMembersCsv(INITIAL_STATE, formData);

      if (!result.success) {
        setErrorMessage(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(`${result.data.imported} giocatori importati dal CSV.`);
      setOpen(false);
      router.refresh();
    });
  };

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
          <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="members-csv-file">File CSV</Label>
              <Input id="members-csv-file" name="file" type="file" accept=".csv" required />
            </div>
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
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
