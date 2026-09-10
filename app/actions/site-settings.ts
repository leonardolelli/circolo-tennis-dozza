"use server";

import { revalidatePath } from "next/cache";

import { SITE_SETTINGS_ROW_ID } from "@/lib/data/site-settings";
import {
  awardPrizesSchema,
  categorySettingsSchema,
  eloSettingsSchema,
  type AwardPrizesInput,
  type CategorySettingsInput,
  type EloSettingsInput,
} from "@/lib/validation";
import type { ActionResult } from "@/lib/types";
import type { EloParams } from "@/lib/elo";
import type { CategoryConfig } from "@/lib/categories";
import type { AwardPrizes } from "@/lib/data/site-settings";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth";

/** Admin-only guard (session + soci.is_admin). */
const assertAdmin = requireAdmin;

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

function revalidateCategoryPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/soci");
  revalidatePath("/classifica");
  revalidatePath("/classifica/cronologia");
}

/**
 * Persists the player category parameters (score thresholds and the maximum
 * number of ranking positions each category may challenge above itself).
 * Admin only; changes apply to every future challenge request.
 */
export async function updateCategorySettings(
  params: CategorySettingsInput,
): Promise<ActionResult<{ categories: CategoryConfig }>> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const parsed = categorySettingsSchema.safeParse(params);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Parametri non validi.",
    };
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("site_settings").upsert({
    id: SITE_SETTINGS_ROW_ID,
    category_gold_min: parsed.data.goldMin,
    category_silver_min: parsed.data.silverMin,
    category_gold_max_rank_delta: parsed.data.goldMaxRankDelta,
    category_silver_max_rank_delta: parsed.data.silverMaxRankDelta,
    category_bronze_max_rank_delta: parsed.data.bronzeMaxRankDelta,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("updateCategorySettings failed:", error);
    return {
      success: false,
      error:
        "Impossibile salvare i parametri delle categorie. Verifica che la tabella site_settings sia presente.",
    };
  }

  revalidateCategoryPaths();
  return {
    success: true,
    data: {
      categories: {
        goldMin: parsed.data.goldMin,
        silverMin: parsed.data.silverMin,
        goldMaxRankDelta: parsed.data.goldMaxRankDelta,
        silverMaxRankDelta: parsed.data.silverMaxRankDelta,
        bronzeMaxRankDelta: parsed.data.bronzeMaxRankDelta,
      },
    },
  };
}

function revalidatePrizePaths() {
  revalidatePath("/admin/premi");
  revalidatePath("/classifica");
  revalidatePath("/classifica/premi");
}

/**
 * Persists the free-text prize assigned by the admin to each monthly award
 * category ("Chi ha vinto di più", "Chi ha fatto più partite", "Chi ha perso
 * di più"). The prizes are shown on the public /classifica/premi page. Admin
 * only; an empty string clears the prize for that category.
 */
export async function updateAwardPrizes(
  params: AwardPrizesInput,
): Promise<ActionResult<{ prizes: AwardPrizes }>> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const parsed = awardPrizesSchema.safeParse(params);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Premi non validi.",
    };
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("site_settings").upsert({
    id: SITE_SETTINGS_ROW_ID,
    premio_most_wins: parsed.data.mostWins || null,
    premio_most_matches: parsed.data.mostMatches || null,
    premio_most_losses: parsed.data.mostLosses || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("updateAwardPrizes failed:", error);
    return {
      success: false,
      error:
        "Impossibile salvare i premi. Verifica che la tabella site_settings sia presente.",
    };
  }

  revalidatePrizePaths();
  return {
    success: true,
    data: {
      prizes: {
        mostWins: parsed.data.mostWins || "",
        mostMatches: parsed.data.mostMatches || "",
        mostLosses: parsed.data.mostLosses || "",
      },
    },
  };
}