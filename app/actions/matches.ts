"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { submitMatchSchema } from "@/lib/validation";
import { calculateEloDelta } from "@/lib/elo";
import type { ActionResult, MatchOutcome } from "@/lib/types";

export interface SubmitMatchPayload {
  inseritoreId: string;
  inseritorePin: string;
  avversarioId: string;
  esito: MatchOutcome;
  risultato: string;
}

/**
 * Records a match result and updates both players' Elo-style rating.
 *
 * Security: this is a public Server Action (no Supabase Auth session
 * involved - club members only ever identify themselves with their PIN).
 * It re-validates every input with zod, then verifies the submitting
 * player's PIN against the bcrypt hash stored in `soci.pin` *before*
 * touching anything else. Only once that succeeds does it compute the
 * rating swing and hand off to the `apply_match_result` SQL function
 * (via the service-role client) to perform the atomic write.
 */
export async function submitMatchResult(
  payload: SubmitMatchPayload,
): Promise<ActionResult> {
  const parsed = submitMatchSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }
  const { inseritoreId, inseritorePin, avversarioId, esito, risultato } =
    parsed.data;

  const supabase = createServiceRoleClient();

  const { data: players, error: fetchError } = await supabase
    .from("soci")
    .select("id, punti, pin")
    .in("id", [inseritoreId, avversarioId]);

  if (fetchError || !players || players.length !== 2) {
    return { success: false, error: "Giocatore o avversario non trovato." };
  }

  const inseritore = players.find((player) => player.id === inseritoreId);
  const avversario = players.find((player) => player.id === avversarioId);
  if (!inseritore || !avversario) {
    return { success: false, error: "Giocatore o avversario non trovato." };
  }

  const isPinValid = await bcrypt.compare(inseritorePin, inseritore.pin);
  if (!isPinValid) {
    return { success: false, error: "PIN errato." };
  }

  const winnerRating = esito === "win" ? inseritore.punti : avversario.punti;
  const loserRating = esito === "win" ? avversario.punti : inseritore.punti;
  const variazione = calculateEloDelta(winnerRating, loserRating);

  const { error: rpcError } = await supabase.rpc("apply_match_result", {
    p_inseritore_id: inseritoreId,
    p_avversario_id: avversarioId,
    p_esito_inseritore: esito,
    p_risultato: risultato,
    p_variazione: variazione,
  });

  if (rpcError) {
    console.error("apply_match_result failed:", rpcError);
    return {
      success: false,
      error: "Impossibile registrare la partita. Riprova.",
    };
  }

  revalidatePath("/classifica");
  revalidatePath("/classifica/cronologia");
  revalidatePath("/admin");
  return { success: true };
}
