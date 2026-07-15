"use server";

import { revalidatePath } from "next/cache";

import { SITE_SETTINGS_ROW_ID } from "@/lib/data/site-settings";
import type { ActionResult } from "@/lib/types";
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