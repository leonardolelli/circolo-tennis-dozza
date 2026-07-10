"use client";

import { useEffect, useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";

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
} from "@/components/ui/dialog";
import { PlayerCombobox } from "@/components/shared/player-combobox";
import { requestChallenge } from "@/app/actions/challenge";
import { PIN_LENGTH } from "@/lib/validation";
import type { SocioPublic } from "@/lib/types";

interface ChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opponent: SocioPublic | null;
  players: SocioPublic[];
}

/**
 * PIN-gated "challenge" flow: the requester identifies themselves, and on
 * success we open a `wa.me` deep link to the opponent with a pre-filled
 * message - see app/actions/challenge.ts for the security model.
 */
export function ChallengeDialog({
  open,
  onOpenChange,
  opponent,
  players,
}: ChallengeDialogProps) {
  const [requester, setRequester] = useState<SocioPublic | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setRequester(null);
      setPin("");
      setError(null);
    }
  }, [open]);

  function handleSubmit() {
    if (!requester || !opponent) return;
    setError(null);
    startTransition(async () => {
      const result = await requestChallenge({
        requesterId: requester.id,
        requesterPin: pin,
        opponentId: opponent.id,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      window.open(result.data.whatsappUrl, "_blank", "noopener,noreferrer");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sfida {opponent?.nome}</DialogTitle>
          <DialogDescription>
            Conferma la tua identità per aprire WhatsApp e proporre una
            partita a {opponent?.nome}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <PlayerCombobox
            label="Il tuo nome"
            players={players}
            excludeId={opponent?.id}
            value={requester}
            onChange={setRequester}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="requester-pin">
              Il tuo PIN ({PIN_LENGTH} cifre)
            </Label>
            <Input
              id="requester-pin"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={(event) =>
                setPin(event.target.value.replace(/\D/g, ""))
              }
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            disabled={!requester || pin.length !== PIN_LENGTH || isPending}
            onClick={handleSubmit}
            className="bg-tennis text-tennis-foreground hover:bg-tennis/90"
          >
            <MessageCircle className="h-4 w-4" />
            {isPending ? "Verifica in corso..." : "Apri WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
