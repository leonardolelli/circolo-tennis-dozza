import { createServiceRoleClient } from "@/lib/supabase/service";
import { DEFAULT_ELO_PARAMS, type EloParams } from "@/lib/elo";
import {
  DEFAULT_CATEGORY_CONFIG,
  type CategoryConfig,
} from "@/lib/categories";

export const SITE_SETTINGS_ROW_ID = "global";

/** Free-text prize the admin assigns to each monthly award category. */
export interface AwardPrizes {
  mostWins: string;
  mostMatches: string;
  mostLosses: string;
}

/** Keys of the three monthly award categories, in display order. */
export const AWARD_CATEGORY_KEYS = [
  "mostWins",
  "mostMatches",
  "mostLosses",
] as const;
export type AwardCategoryKey = (typeof AWARD_CATEGORY_KEYS)[number];

export const DEFAULT_AWARD_PRIZES: AwardPrizes = {
  mostWins: "",
  mostMatches: "",
  mostLosses: "",
};

export interface SiteSettingsSnapshot {
  maintenanceMode: boolean;
  /** Rating system parameters (K factor, minimum delta and rating floor). */
  elo: EloParams;
  /** Player category thresholds and per-category challenge rank limits. */
  categories: CategoryConfig;
  /** Free-text prize assigned to each monthly award category. */
  prizes: AwardPrizes;
}

const MISSING_SETTINGS_TABLE_CODES = new Set(["42P01", "PGRST205"]);

export async function getSiteSettings(): Promise<SiteSettingsSnapshot> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "maintenance_mode, elo_k_factor, elo_min_rating, elo_min_delta, category_gold_min, category_silver_min, category_gold_max_rank_delta, category_silver_max_rank_delta, category_bronze_max_rank_delta, premio_most_wins, premio_most_matches, premio_most_losses",
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
        prizes: DEFAULT_AWARD_PRIZES,
      };
    }

    console.error("Failed to load site settings:", error);
    return {
      maintenanceMode: false,
      elo: DEFAULT_ELO_PARAMS,
      categories: DEFAULT_CATEGORY_CONFIG,
      prizes: DEFAULT_AWARD_PRIZES,
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
    prizes: {
      mostWins: data?.premio_most_wins ?? "",
      mostMatches: data?.premio_most_matches ?? "",
      mostLosses: data?.premio_most_losses ?? "",
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