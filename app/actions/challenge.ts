"use server";

import { createServiceRoleClient } from "@/lib/supabase/service";
import { challengeSchema } from "@/lib/validation";
import { buildChallengeMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { getCategoryConfig } from "@/lib/data/site-settings";
import { buildRankMap, evaluateChallengeRule } from "@/lib/categories";
import { requireSocio } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

export interface RequestChallengePayload {
  opponentId: string;
}

/**
 * Returns a ready-to-open `wa.me` deep link for challenging the selected
 * opponent. The requester is always the currently logged-in socio (derived
 * from the session via `soci.user_id`) - never taken from the client.
 *
 * The opponent's phone number never reaches the browser directly as plain
 * data - it is only ever embedded inside the returned WhatsApp URL, and only
 * after the requester is authenticated and the per-category ranking rule has
 * been validated. Nothing is persisted; this is a read-only lookup.
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
  const { opponentId } = parsed.data;

  const member = await requireSocio();
  if (!member.success) {
    return member;
  }
  const requester = member.socio;

  if (requester.id === opponentId) {
    return { success: false, error: "Non puoi sfidare te stesso." };
  }

  const supabase = createServiceRoleClient();
  const { data: opponent, error } = await supabase
    .from("soci")
    .select("id, nome, cognome, telefono, congelato, punti")
    .eq("id", opponentId)
    .maybeSingle();

  if (error || !opponent) {
    return { success: false, error: "Avversario non trovato." };
  }

  if (requester.congelato || opponent.congelato) {
    return {
      success: false,
      error: "Le sfide verso o da giocatori congelati non sono disponibili.",
    };
  }

  // Enforce the per-category "max positions above" rule (shared logic with the
  // client - see lib/categories.ts evaluateChallengeRule). Challenging someone
  // lower in the ranking is always allowed.
  const categoryConfig = await getCategoryConfig();
  const { data: ranking } = await supabase
    .from("soci")
    .select("id, punti")
    .order("punti", { ascending: false });

  const rule = evaluateChallengeRule({
    requester,
    opponent: {
      id: opponent.id,
      punti: opponent.punti,
      nome: `${opponent.nome} ${opponent.cognome}`.trim(),
    },
    rankById: buildRankMap(ranking ?? []),
    config: categoryConfig,
  });

  if (!rule.allowed) {
    return { success: false, error: rule.reason };
  }

  const message = buildChallengeMessage(
    `${requester.nome} ${requester.cognome}`,
    opponent.nome,
  );
  const whatsappUrl = buildWhatsAppLink(opponent.telefono, message);

  return { success: true, data: { whatsappUrl } };
}
