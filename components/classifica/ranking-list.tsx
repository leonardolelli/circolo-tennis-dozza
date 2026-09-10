"use client";

import { useState } from "react";
import { Medal, ShieldAlert, Snowflake } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatWinRate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SocioPublic } from "@/lib/types";
import {
  evaluateChallengeRule,
  getCategory,
  type CategoryConfig,
} from "@/lib/categories";
import { CategoryBadge } from "@/components/shared/category-badge";
import { ChallengeDialog } from "@/components/classifica/challenge-dialog";

const MEDAL_COLORS = ["text-yellow-500", "text-zinc-400", "text-amber-700"];

/**
 * Ranking list. Tapping an active player decides what happens based on the
 * ranking rule (shared with the server - see lib/categories.ts):
 *   - allowed   → opens the "Apri WhatsApp" challenge confirmation;
 *   - blocked   → opens a warning dialog explaining why (no WhatsApp form);
 *   - own row   → warning dialog ("non puoi sfidare te stesso");
 *   - frozen    → the row is disabled.
 */
export function RankingList({
  members,
  ranks,
  categoryConfig,
  currentSocio,
}: {
  members: SocioPublic[];
  /**
   * Overall 1-based ranking keyed by member id. Used when `members` is a
   * filtered subset so each row keeps its real position in the classifica.
   */
  ranks?: Record<string, number>;
  /** Player category thresholds, used to label each row's category. */
  categoryConfig: CategoryConfig;
  /** The logged-in socio viewing the list (used as the challenger). */
  currentSocio: SocioPublic | null;
}) {
  const [selectedOpponent, setSelectedOpponent] = useState<SocioPublic | null>(
    null,
  );
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  if (members.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
        Nessun giocatore in classifica per ora.
      </Card>
    );
  }

  function handleRowClick(member: SocioPublic) {
    if (!currentSocio) {
      setBlockedMessage(
        "Il tuo account non risulta collegato a un socio. Contatta l'amministratore.",
      );
      return;
    }

    const rule = evaluateChallengeRule({
      requester: currentSocio,
      opponent: {
        id: member.id,
        punti: member.punti,
        nome: `${member.nome} ${member.cognome}`.trim(),
      },
      rankById: ranks ?? {},
      config: categoryConfig,
    });

    if (rule.allowed) {
      setSelectedOpponent(member);
      setIsChallengeOpen(true);
    } else {
      setBlockedMessage(rule.reason);
    }
  }

  return (
    <>
      <Card className="divide-y overflow-hidden p-0">
        {members.map((member, index) => {
          const rank = ranks?.[member.id] ?? index + 1;
          return (
            <button
              key={member.id}
              type="button"
              disabled={member.congelato}
              onClick={() => handleRowClick(member)}
              className={cn(
                "flex w-full animate-fade-in items-center gap-4 px-4 py-3.5 text-left transition-colors sm:px-6",
                member.congelato
                  ? "cursor-not-allowed opacity-75"
                  : "hover:bg-accent/60",
              )}
              style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
            >
              <span
                className={cn(
                  "flex w-7 shrink-0 items-center justify-center text-sm font-bold tabular-nums text-muted-foreground",
                  rank <= 3 && MEDAL_COLORS[rank - 1],
                )}
              >
                {rank <= 3 ? <Medal className="h-5 w-5" /> : rank}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 truncate font-medium">
                  <span className="truncate">
                    {member.nome} {member.cognome}
                  </span>
                  <CategoryBadge
                    category={getCategory(member.punti, categoryConfig)}
                  />
                  {currentSocio && member.id === currentSocio.id && (
                    <span className="shrink-0 text-xs font-semibold text-tennis">
                      (tu)
                    </span>
                  )}
                  {member.congelato && (
                    <Snowflake className="h-4 w-4 shrink-0 text-sky-400" />
                  )}
                </span>
              </span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                {member.vittorie}V - {member.sconfitte}S (
                {formatWinRate(member.vittorie, member.sconfitte)})
              </span>
              <span className="w-14 shrink-0 text-right text-base font-bold tabular-nums text-tennis">
                {member.punti}
              </span>
            </button>
          );
        })}
      </Card>

      <ChallengeDialog
        open={isChallengeOpen}
        onOpenChange={setIsChallengeOpen}
        opponent={selectedOpponent}
        requesterName={
          currentSocio
            ? `${currentSocio.nome} ${currentSocio.cognome}`.trim()
            : ""
        }
      />

      <Dialog open={blockedMessage !== null} onOpenChange={(open) => !open && setBlockedMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Sfida non consentita
            </DialogTitle>
            <DialogDescription className="text-left">
              {blockedMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setBlockedMessage(null)}>Ok</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
