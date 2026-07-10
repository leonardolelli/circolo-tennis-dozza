import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { SocioPublic } from "@/lib/types";

/**
 * Loads the public ranking (safe columns only - see the column-level GRANT
 * in supabase/schema.sql). Wrapped in React's `cache()` so the several
 * places that need the member list during the same request (the ranking
 * list, the "add match" dialog, the challenge dialog) share a single
 * network round-trip instead of re-fetching.
 */
export const getRankedMembers = cache(async (): Promise<SocioPublic[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("soci")
    .select(
      "id, nome, cognome, punti, vittorie, sconfitte, data_ultima_partita, created_at",
    )
    .order("punti", { ascending: false });

  if (error) {
    console.error("Failed to load soci ranking:", error);
  }

  return data ?? [];
});
