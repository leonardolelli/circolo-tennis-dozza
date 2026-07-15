import type { Database } from "@/lib/database.types";

/** A club member row exactly as stored in the database (includes the pin hash). */
export type Socio = Database["public"]["Tables"]["soci"]["Row"];

/**
 * The subset of `soci` columns that anon/authenticated clients are actually
 * allowed to read (see the column-level GRANT in supabase/schema.sql).
 * `pin` and `telefono` are never sent to the browser.
 */
export type SocioPublic = Pick<
  Socio,
  | "id"
  | "nome"
  | "cognome"
  | "punti"
  | "vittorie"
  | "sconfitte"
  | "congelato"
  | "data_ultima_partita"
  | "created_at"
>;

export type Partita = Database["public"]["Tables"]["partite"]["Row"];

/**
 * Columns visible to an authenticated (admin) session: everything in
 * `SocioPublic` plus `telefono` (see the column-level GRANT in
 * supabase/schema.sql). `pin` is still never exposed to the app layer.
 */
export type SocioAdmin = SocioPublic & Pick<Socio, "telefono" | "punti_iniziali">;

export type Sponsor = Database["public"]["Tables"]["sponsor"]["Row"];

export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];

/** Outcome of a match from the submitting player's point of view. */
export type MatchOutcome = "win" | "loss";

/** Generic discriminated result type returned by every Server Action. */
export type ActionResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : { data: T }))
  | { success: false; error: string };
