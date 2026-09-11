import type { Database } from "@/lib/database.types";

/** A club member row exactly as stored in the database (server-only columns included). */
export type Socio = Database["public"]["Tables"]["soci"]["Row"];

/**
 * The subset of `soci` columns that anon/authenticated clients are actually
 * allowed to read (see the column-level GRANT in supabase/schema.sql).
 * Sensitive columns (`telefono`, `username`, `user_id`, `is_admin`, ...)
 * are never sent to the browser.
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
  | "disponibilita"
>;

export type Partita = Database["public"]["Tables"]["partite"]["Row"];

/**
 * Columns used by the admin member-management screen: public columns plus the
 * sensitive ones needed to manage the member and its account. Read through the
 * service-role client only (see supabase/schema.sql - these columns are not
 * granted to anon/authenticated). `username` is treated as present here: rows
 * are provisioned (or updated via CSV import) with a username.
 */
export type SocioAdmin = SocioPublic & {
  telefono: string;
  punti_iniziali: number;
  username: string;
  is_admin: boolean;
  password: string | null;
};

export type Sponsor = Database["public"]["Tables"]["sponsor"]["Row"];

export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];

/** Outcome of a match from the submitting player's point of view. */
export type MatchOutcome = "win" | "loss";

/** Generic discriminated result type returned by every Server Action. */
export type ActionResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : { data: T }))
  | { success: false; error: string };
