"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestChallenge } from "@/app/actions/challenge";
import type { SocioPublic } from "@/lib/types";

interface ChallengeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opponent: SocioPublic | null;
}

/**
 * Confirmation dialog shown when tapping an opponent the ranking rule allows
 * to challenge. It contains ONLY an "Apri WhatsApp" button: on click the
 * server builds the `wa.me` deep link (validating the session socio and the
 * ranking rule again) and the current tab navigates there.
 *
 * Plain navigation is used instead of `window.open` because the navigation
 * happens after an async round-trip, which Safari would block as a popup.
 */
export function ChallengeDialog({
  open,
  onOpenChange,
  opponent,
}: ChallengeConfirmDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!opponent) return;
    setError(null);
    startTransition(async () => {
      const result = await requestChallenge({ opponentId: opponent.id });
      if (!result.success) {
        setError(result.error);
        return;
      }
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
            {opponent && (
              <>
                Disponibilità di {opponent.nome} {opponent.cognome}:{" "}
                {opponent.disponibilita?.trim() ? (
                  <span className="font-semibold text-foreground">
                    {opponent.disponibilita}
                  </span>
                ) : (
                  <>non ha ancora indicato la sua disponibilità.</>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            disabled={!opponent || isPending}
            onClick={handleSubmit}
            className="bg-tennis text-tennis-foreground hover:bg-tennis/90"
          >
            <MessageCircle className="h-4 w-4" />
            {isPending ? "Apertura..." : "Apri WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
