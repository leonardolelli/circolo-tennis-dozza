"use server";

import { revalidatePath } from "next/cache";

import { SITE_SETTINGS_ROW_ID } from "@/lib/data/site-settings";
import { eloSettingsSchema, type EloSettingsInput } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";
import type { EloParams } from "@/lib/elo";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    return { success: false as const, error: "Devi accedere come amministratore." };
  }

  return { success: true as const };
}

function revalidateMaintenancePaths() {
  revalidatePath("/");
  revalidatePath("/classifica");
  revalidatePath("/classifica/cronologia");
  revalidatePath("/classifica/premi");
  revalidatePath("/privacy");
  revalidatePath("/note-legali");
  revalidatePath("/cookie");
  revalidatePath("/admin");
}

export async function setMaintenanceMode(
  enabled: boolean,
): Promise<ActionResult<{ maintenanceMode: boolean }>> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("site_settings").upsert({
    id: SITE_SETTINGS_ROW_ID,
    maintenance_mode: enabled,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("setMaintenanceMode failed:", error);
    return {
      success: false,
      error:
        "Impossibile aggiornare la modalità manutenzione. Verifica che la tabella site_settings sia presente.",
    };
  }

  revalidateMaintenancePaths();
  return {
    success: true,
    data: { maintenanceMode: enabled },
  };
}

function revalidateEloPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/punteggi");
  revalidatePath("/classifica");
  revalidatePath("/classifica/cronologia");
}

/**
 * Persists the Elo-style rating parameters (K factor, minimum delta and
 * rating floor) used to compute the points won/lost after every match.
 * Admin only; changes apply to every future computation.
 */
export async function updateEloSettings(
  params: EloSettingsInput,
): Promise<ActionResult<{ elo: EloParams }>> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const parsed = eloSettingsSchema.safeParse(params);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Parametri non validi.",
    };
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("site_settings").upsert({
    id: SITE_SETTINGS_ROW_ID,
    elo_k_factor: parsed.data.kFactor,
    elo_min_rating: parsed.data.minRating,
    elo_min_delta: parsed.data.minDelta,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("updateEloSettings failed:", error);
    return {
      success: false,
      error:
        "Impossibile salvare i parametri dei punteggi. Verifica che la tabella site_settings sia presente.",
    };
  }

  revalidateEloPaths();
  return {
    success: true,
    data: {
      elo: {
        kFactor: parsed.data.kFactor,
        minRating: parsed.data.minRating,
        minDelta: parsed.data.minDelta,
      },
    },
  };
}