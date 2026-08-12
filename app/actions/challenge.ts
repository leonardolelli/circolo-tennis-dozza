"use server";

import bcrypt from "bcryptjs";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { challengeSchema } from "@/lib/validation";
import { buildChallengeMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { getCategoryConfig } from "@/lib/data/site-settings";
import {
  getCategory,
  getCategoryLabel,
  getMaxRankDelta,
} from "@/lib/categories";
import type { ActionResult } from "@/lib/types";

export interface RequestChallengePayload {
  requesterId: string;
  requesterPin: string;
  opponentId: string;
}

/**
 * Verifies the requester's PIN and, if valid, returns a ready-to-open
 * `wa.me` deep link for challenging the selected opponent.
 *
 * The opponent's phone number never reaches the browser directly as plain
 * data - it is only ever embedded inside the returned WhatsApp URL, and
 * only after the requester has proven (via PIN) that they are a real club
 * member. Nothing is persisted; this is a read-only, PIN-gated lookup.
 */
export async function requestChallenge(
  payload: RequestChallengePayload,
): Promise<ActionResult<{ whatsappUrl: string }>> {
  const parsed = challengeSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }
  const { requesterId, requesterPin, opponentId } = parsed.data;

  const supabase = createServiceRoleClient();
  const { data: players, error } = await supabase
    .from("soci")
    .select("id, nome, cognome, pin, telefono, congelato, punti")
    .in("id", [requesterId, opponentId]);

  if (error || !players || players.length !== 2) {
    return { success: false, error: "Giocatore o avversario non trovato." };
  }

  const requester = players.find((player) => player.id === requesterId);
  const opponent = players.find((player) => player.id === opponentId);
  if (!requester || !opponent) {
    return { success: false, error: "Giocatore o avversario non trovato." };
  }

  if (requester.congelato || opponent.congelato) {
    return {
      success: false,
      error: "Le sfide verso o da giocatori congelati non sono disponibili.",
    };
  }

  const isPinValid = await bcrypt.compare(requesterPin, requester.pin);
  if (!isPinValid) {
    return { success: false, error: "PIN errato." };
  }

  // Enforce the per-category "max positions above" rule: a member may only
  // challenge opponents that are at most N places higher in the ranking,
  // where N depends on their category (e.g. gold up to 4). Challenging
  // someone lower in the ranking is always allowed.
  const categoryConfig = await getCategoryConfig();
  const { data: ranking } = await supabase
    .from("soci")
    .select("id, punti")
    .order("punti", { ascending: false });
  const rankById = new Map<string, number>();
  (ranking ?? []).forEach((player, index) => {
    rankById.set(player.id, index + 1);
  });

  const requesterRank = rankById.get(requester.id);
  const opponentRank = rankById.get(opponent.id);

  if (requesterRank && opponentRank && opponentRank < requesterRank) {
    const category = getCategory(requester.punti, categoryConfig);
    const maxRankDelta = getMaxRankDelta(category, categoryConfig);
    const positionsAbove = requesterRank - opponentRank;

    if (positionsAbove > maxRankDelta) {
      return {
        success: false,
        error: `Puoi sfidare al massimo ${maxRankDelta} posizioni sopra di te in classifica (categoria ${getCategoryLabel(category)}). L'avversario selezionato è ${positionsAbove} posizioni sopra di te.`,
      };
    }
  }

  const message = buildChallengeMessage(
    `${requester.nome} ${requester.cognome}`,
    opponent.nome,
  );
  const whatsappUrl = buildWhatsAppLink(opponent.telefono, message);

  return { success: true, data: { whatsappUrl } };
}
