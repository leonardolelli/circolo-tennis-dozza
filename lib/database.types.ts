/**
 * Hand-written equivalent of the file produced by
 * `supabase gen types typescript`, kept in sync with supabase/schema.sql.
 *
 * If you later wire up the Supabase CLI, you can regenerate this file with:
 *   supabase gen types typescript --project-id <id> > lib/database.types.ts
 * The shape below intentionally matches the CLI output so nothing else in
 * the codebase needs to change if you do.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      soci: {
        Row: {
          id: string;
          nome: string;
          cognome: string;
          telefono: string;
          punti_iniziali: number;
          punti: number;
          pin: string;
          vittorie: number;
          sconfitte: number;
          congelato: boolean;
          data_ultima_partita: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cognome: string;
          telefono: string;
          punti_iniziali?: number;
          punti?: number;
          pin: string;
          vittorie?: number;
          sconfitte?: number;
          congelato?: boolean;
          data_ultima_partita?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          cognome?: string;
          telefono?: string;
          punti_iniziali?: number;
          punti?: number;
          pin?: string;
          vittorie?: number;
          sconfitte?: number;
          congelato?: boolean;
          data_ultima_partita?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      partite: {
        Row: {
          id: string;
          id_inseritore: string | null;
          id_avversario: string | null;
          nome_completo_inseritore: string;
          nome_completo_avversario: string;
          esito_inseritore: "win" | "loss";
          id_vincitore: string | null;
          id_perdente: string | null;
          risultato: string;
          punti_vincitore_variazioni: number;
          punti_perdente_variazioni: number;
          data: string;
          /** Generated column - derived automatically, never inserted/updated. */
          nome_vincitore: string | null;
          /** Generated column - derived automatically, never inserted/updated. */
          nome_perdente: string | null;
        };
        Insert: {
          id?: string;
          id_inseritore?: string | null;
          id_avversario?: string | null;
          nome_completo_inseritore: string;
          nome_completo_avversario: string;
          esito_inseritore: "win" | "loss";
          id_vincitore?: string | null;
          id_perdente?: string | null;
          risultato: string;
          punti_vincitore_variazioni: number;
          punti_perdente_variazioni: number;
          data?: string;
        };
        Update: {
          id?: string;
          id_inseritore?: string | null;
          id_avversario?: string | null;
          nome_completo_inseritore?: string;
          nome_completo_avversario?: string;
          esito_inseritore?: "win" | "loss";
          id_vincitore?: string | null;
          id_perdente?: string | null;
          risultato?: string;
          punti_vincitore_variazioni?: number;
          punti_perdente_variazioni?: number;
          data?: string;
        };
        Relationships: [];
      };
      sponsor: {
        Row: {
          id: string;
          nome: string;
          logo_url: string;
          link: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          logo_url: string;
          link: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          logo_url?: string;
          link?: string;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      apply_match_result: {
        Args: {
          p_inseritore_id: string;
          p_avversario_id: string;
          p_esito_inseritore: string;
          p_risultato: string;
          p_variazione: number;
        };
        Returns: { id: string; data: string }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
