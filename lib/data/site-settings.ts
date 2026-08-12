import { createServiceRoleClient } from "@/lib/supabase/service";
import { DEFAULT_ELO_PARAMS, type EloParams } from "@/lib/elo";
import {
  DEFAULT_CATEGORY_CONFIG,
  type CategoryConfig,
} from "@/lib/categories";

export const SITE_SETTINGS_ROW_ID = "global";

export interface SiteSettingsSnapshot {
  maintenanceMode: boolean;
  /** Rating system parameters (K factor, minimum delta and rating floor). */
  elo: EloParams;
  /** Player category thresholds and per-category challenge rank limits. */
  categories: CategoryConfig;
}

const MISSING_SETTINGS_TABLE_CODES = new Set(["42P01", "PGRST205"]);

export async function getSiteSettings(): Promise<SiteSettingsSnapshot> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "maintenance_mode, elo_k_factor, elo_min_rating, elo_min_delta, category_gold_min, category_silver_min, category_gold_max_rank_delta, category_silver_max_rank_delta, category_bronze_max_rank_delta",
    )
    .eq("id", SITE_SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) {
    if (MISSING_SETTINGS_TABLE_CODES.has(error.code ?? "")) {
      console.warn("site_settings table not found; using default settings.");
      return {
        maintenanceMode: false,
        elo: DEFAULT_ELO_PARAMS,
        categories: DEFAULT_CATEGORY_CONFIG,
      };
    }

    console.error("Failed to load site settings:", error);
    return {
      maintenanceMode: false,
      elo: DEFAULT_ELO_PARAMS,
      categories: DEFAULT_CATEGORY_CONFIG,
    };
  }

  return {
    maintenanceMode: data?.maintenance_mode ?? false,
    elo: {
      kFactor: data?.elo_k_factor ?? DEFAULT_ELO_PARAMS.kFactor,
      minRating: data?.elo_min_rating ?? DEFAULT_ELO_PARAMS.minRating,
      minDelta: data?.elo_min_delta ?? DEFAULT_ELO_PARAMS.minDelta,
    },
    categories: {
      goldMin: data?.category_gold_min ?? DEFAULT_CATEGORY_CONFIG.goldMin,
      silverMin:
        data?.category_silver_min ?? DEFAULT_CATEGORY_CONFIG.silverMin,
      goldMaxRankDelta:
        data?.category_gold_max_rank_delta ??
        DEFAULT_CATEGORY_CONFIG.goldMaxRankDelta,
      silverMaxRankDelta:
        data?.category_silver_max_rank_delta ??
        DEFAULT_CATEGORY_CONFIG.silverMaxRankDelta,
      bronzeMaxRankDelta:
        data?.category_bronze_max_rank_delta ??
        DEFAULT_CATEGORY_CONFIG.bronzeMaxRankDelta,
    },
  };
}

/**
 * Loads only the persisted Elo rating parameters, falling back to the
 * defaults when the settings row (or table) is missing.
 */
export async function getEloParams(): Promise<EloParams> {
  return (await getSiteSettings()).elo;
}

/**
 * Loads only the persisted player category parameters, falling back to the
 * defaults when the settings row (or table) is missing.
 */
export async function getCategoryConfig(): Promise<CategoryConfig> {
  return (await getSiteSettings()).categories;
}