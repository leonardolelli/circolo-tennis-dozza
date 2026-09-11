import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Socio, SocioPublic } from "@/lib/types";

/** Minimal identity read from the current Supabase Auth session (JWT claims). */
export type SessionUser = {
  id: string;
  email: string | null;
};

/**
 * Returns the Supabase Auth user for the current request, or null when there
 * is no session. Reads only the (client-safe) JWT claims - no DB round-trip.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    return null;
  }

  return {
    id: claims.sub as string,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSessionUser()) !== null;
}

/**
 * The `soci` row linked to the current session (via `user_id`), or null.
 * Uses the service-role client because `soci.user_id`/`is_admin` are not
 * readable by authenticated sessions (see supabase/schema.sql).
 */
export async function getCurrentSocio(): Promise<Socio | null> {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  const serviceClient = createServiceRoleClient();
  const { data } = await serviceClient
    .from("soci")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

/**
 * The public-safe subset of the current socio, safe to forward to Client
 * Components (no telefono/username/user_id/is_admin). Returns null when
 * there is no session or no linked socio.
 */
export async function getCurrentSocioPublic(): Promise<SocioPublic | null> {
  const socio = await getCurrentSocio();
  if (!socio) {
    return null;
  }

  return {
    id: socio.id,
    nome: socio.nome,
    cognome: socio.cognome,
    punti: socio.punti,
    vittorie: socio.vittorie,
    sconfitte: socio.sconfitte,
    congelato: socio.congelato,
    data_ultima_partita: socio.data_ultima_partita,
    created_at: socio.created_at,
    disponibilita: socio.disponibilita,
  };
}

export type MemberGuard =
  | { success: true; socio: Socio }
  | { success: false; error: string };

/**
 * Guard used by member actions (recording a match, requesting a challenge):
 * requires a session linked to a `soci` row. Identity is derived from the
 * session, never from client-supplied ids.
 */
export async function requireSocio(): Promise<MemberGuard> {
  const socio = await getCurrentSocio();

  if (!socio) {
    return {
      success: false,
      error:
        "Il tuo account non è collegato a un socio. Contatta l'amministratore.",
    };
  }

  return { success: true, socio };
}

export type AdminStatus =
  | { ok: true; socio: Socio }
  | { ok: false; reason: "no-session" | "not-admin" };
/** Session + linked socio with `is_admin = true` (used by layouts/pages). */
export async function getCurrentAdmin(): Promise<AdminStatus> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: "no-session" };
  }

  const socio = await getCurrentSocio();
  if (!socio?.is_admin) {
    return { ok: false, reason: "not-admin" };
  }

  return { ok: true, socio };
}

export type AdminGuard =
  | { success: true; socio: Socio }
  | { success: false; error: string };

/** Guard used by admin Server Actions: session + socio with `is_admin`. */
export async function requireAdmin(): Promise<AdminGuard> {
  const status = await getCurrentAdmin();

  if (!status.ok) {
    return {
      success: false,
      error:
        status.reason === "no-session"
          ? "Devi accedere come amministratore."
          : "Non hai i permessi di amministratore.",
    };
  }

  return { success: true, socio: status.socio };
}
