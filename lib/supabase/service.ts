import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Creates a Supabase client authenticated with the `service_role` secret
 * key, which bypasses Row Level Security entirely.
 *
 * ⚠️ SECURITY: only ever import this from Server Actions or Route Handlers,
 * never from a Client Component, and never forward its results to the
 * client without first filtering out sensitive columns (e.g. `soci.pin`).
 * The `server-only` import above makes it a build error to accidentally
 * bundle this module into client code.
 *
 * Every caller MUST perform its own authorization check before using this
 * client for a write (see app/actions/*.ts):
 *   - Admin-only actions must confirm a valid Supabase Auth session first.
 *   - Member actions (recording a match, requesting a challenge) must
 *     verify the submitted PIN against `soci.pin` (bcrypt) first.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
