"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { createServiceRoleClient } from "@/lib/supabase/service";
import { PIN_LENGTH } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

const verifyPinSchema = z.object({
  playerId: z.string().uuid(),
  pin: z.string().trim().regex(new RegExp(`^\\d{${PIN_LENGTH}}$`)),
});

export interface VerifyPlayerPinPayload {
  playerId: string;
  pin: string;
}

/**
 * Lightweight PIN check used purely for UX gating (e.g. unlocking step 2 of
 * the "add match" wizard as soon as the player proves who they are).
 *
 * This is intentionally *not* the only line of defense: every action that
 * actually mutates data (submitMatchResult, requestChallenge) re-verifies
 * the PIN itself right before doing anything privileged.
 */
export async function verifyPlayerPin(
  payload: VerifyPlayerPinPayload,
): Promise<ActionResult> {
  const parsed = verifyPinSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Dati non validi." };
  }

  const supabase = createServiceRoleClient();
  const { data: player, error } = await supabase
    .from("soci")
    .select("pin")
    .eq("id", parsed.data.playerId)
    .single();

  if (error || !player) {
    return { success: false, error: "Giocatore non trovato." };
  }

  const isPinValid = await bcrypt.compare(parsed.data.pin, player.pin);
  if (!isPinValid) {
    return { success: false, error: "PIN errato." };
  }

  return { success: true };
}
