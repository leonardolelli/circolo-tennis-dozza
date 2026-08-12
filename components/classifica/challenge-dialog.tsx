"use client";

import { useEffect, useState, useTransition } from "react";
import { Info, MessageCircle } from "lucide-react";

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
import { CategoryBadge } from "@/components/shared/category-badge";
import { requestChallenge } from "@/app/actions/challenge";
import { PIN_LENGTH } from "@/lib/validation";
import {
  getCategory,
  getCategoryLabel,
  getMaxRankDelta,
  type CategoryConfig,
} from "@/lib/categories";
import type { SocioPublic } from "@/lib/types";

interface ChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opponent: SocioPublic | null;
  players: SocioPublic[];
  categoryConfig: CategoryConfig;
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
  categoryConfig,
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
      // Navigate the current tab to the wa.me deep link. `window.open`
      // would be blocked by Safari's popup blocker here because it runs
      // after the async PIN verification (no longer a direct user gesture),
      // so it never fired on iOS. Plain navigation is always allowed.
      window.location.href = result.data.whatsappUrl;
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
          {requester && (
            <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-tennis" />
              <div>
                La tua categoria è{" "}
                <CategoryBadge
                  category={getCategory(requester.punti, categoryConfig)}
                  className="align-middle"
                />{" "}
                e puoi sfidare fino a{" "}
                <span className="font-semibold text-foreground">
                  {getMaxRankDelta(
                    getCategory(requester.punti, categoryConfig),
                    categoryConfig,
                  )}{" "}
                  posizioni
                </span>{" "}
                sopra di te in classifica (
                {getCategoryLabel(
                  getCategory(requester.punti, categoryConfig),
                )}
                ).
              </div>
            </div>
          )}
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
