"use client";

import { useState } from "react";
import { Medal } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatWinRate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SocioPublic } from "@/lib/types";
import { ChallengeDialog } from "@/components/classifica/challenge-dialog";

const MEDAL_COLORS = ["text-yellow-500", "text-zinc-400", "text-amber-700"];

/** Ranking list; clicking a row opens the PIN-gated WhatsApp challenge dialog. */
export function RankingList({ members }: { members: SocioPublic[] }) {
  const [selectedOpponent, setSelectedOpponent] = useState<SocioPublic | null>(
    null,
  );
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);

  if (members.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
        Nessun socio in classifica per ora.
      </Card>
    );
  }

  return (
    <>
      <Card className="divide-y overflow-hidden p-0">
        {members.map((member, index) => {
          const rank = index + 1;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => {
                setSelectedOpponent(member);
                setIsChallengeOpen(true);
              }}
              className="flex w-full animate-fade-in items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-accent/60 sm:px-6"
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
              <span className="min-w-0 flex-1 truncate font-medium">
                {member.nome} {member.cognome}
              </span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                {member.vittorie}V - {member.sconfitte}P (
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
        players={members}
      />
    </>
  );
}
