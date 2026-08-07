import { createServiceRoleClient } from "@/lib/supabase/service";
import { DEFAULT_ELO_PARAMS, type EloParams } from "@/lib/elo";

export const SITE_SETTINGS_ROW_ID = "global";

export interface SiteSettingsSnapshot {
  maintenanceMode: boolean;
  /** Rating system parameters (K factor, minimum delta and rating floor). */
  elo: EloParams;
}

const MISSING_SETTINGS_TABLE_CODES = new Set(["42P01", "PGRST205"]);

export async function getSiteSettings(): Promise<SiteSettingsSnapshot> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("maintenance_mode, elo_k_factor, elo_min_rating, elo_min_delta")
    .eq("id", SITE_SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) {
    if (MISSING_SETTINGS_TABLE_CODES.has(error.code ?? "")) {
      console.warn("site_settings table not found; using default settings.");
      return { maintenanceMode: false, elo: DEFAULT_ELO_PARAMS };
    }

    console.error("Failed to load site settings:", error);
    return { maintenanceMode: false, elo: DEFAULT_ELO_PARAMS };
  }

  return {
    maintenanceMode: data?.maintenance_mode ?? false,
    elo: {
      kFactor: data?.elo_k_factor ?? DEFAULT_ELO_PARAMS.kFactor,
      minRating: data?.elo_min_rating ?? DEFAULT_ELO_PARAMS.minRating,
      minDelta: data?.elo_min_delta ?? DEFAULT_ELO_PARAMS.minDelta,
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