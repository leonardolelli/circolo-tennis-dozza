import { createServiceRoleClient } from "@/lib/supabase/service";

export const SITE_SETTINGS_ROW_ID = "global";

export interface SiteSettingsSnapshot {
  maintenanceMode: boolean;
}

const MISSING_SETTINGS_TABLE_CODES = new Set(["42P01", "PGRST205"]);

export async function getSiteSettings(): Promise<SiteSettingsSnapshot> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("maintenance_mode")
    .eq("id", SITE_SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) {
    if (MISSING_SETTINGS_TABLE_CODES.has(error.code ?? "")) {
      console.warn("site_settings table not found; maintenance mode disabled by fallback.");
      return { maintenanceMode: false };
    }

    console.error("Failed to load site settings:", error);
    return { maintenanceMode: false };
  }

  return {
    maintenanceMode: data?.maintenance_mode ?? false,
  };
}