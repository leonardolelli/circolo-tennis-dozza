"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { addMemberSchema, updateMemberSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

/** Bcrypt cost factor for hashing member PINs. */
const BCRYPT_SALT_ROUNDS = 12;

async function assertAdmin() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    return { success: false as const, error: "Devi accedere come amministratore." };
  }

  return { success: true as const };
}

function revalidateMemberPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/soci");
  revalidatePath("/admin/cronologia-match");
  revalidatePath("/classifica");
  revalidatePath("/classifica/cronologia");
}

/**
 * Adds a new club member. Admin only.
 *
 * The `/admin` section is already gated by proxy.ts (Next.js middleware),
 * but Server Actions are independently callable HTTP endpoints, so this
 * action re-checks the caller's Supabase Auth session itself before doing
 * anything privileged. Only after that check does it reach for the
 * service-role client, which is required because anon/authenticated roles
 * have no INSERT grant on `soci` (see supabase/schema.sql).
 */
export async function addMember(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const parsed = addMemberSchema.safeParse({
    nome: formData.get("nome"),
    cognome: formData.get("cognome"),
    telefono: formData.get("telefono"),
    puntiIniziali: formData.get("puntiIniziali"),
    pin: formData.get("pin"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  const { nome, cognome, telefono, puntiIniziali, pin } = parsed.data;
  const pinHash = await bcrypt.hash(pin, BCRYPT_SALT_ROUNDS);

  const serviceClient = createServiceRoleClient();
  const { error } = await serviceClient.from("soci").insert({
    nome,
    cognome,
    telefono,
    punti_iniziali: puntiIniziali,
    punti: puntiIniziali,
    pin: pinHash,
  });

  if (error) {
    console.error("addMember failed:", error);
    return {
      success: false,
      error: "Impossibile aggiungere il giocatore. Riprova.",
    };
  }

  revalidateMemberPaths();
  return { success: true };
}

export async function updateMember(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const parsed = updateMemberSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    cognome: formData.get("cognome"),
    telefono: formData.get("telefono"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  const { id, nome, cognome, telefono } = parsed.data;
  const serviceClient = createServiceRoleClient();

  const { error } = await serviceClient
    .from("soci")
    .update({ nome, cognome, telefono })
    .eq("id", id);

  if (error) {
    console.error("updateMember failed:", error);
    return {
      success: false,
      error: "Impossibile aggiornare il giocatore. Riprova.",
    };
  }

  const { error: matchNamesError } = await serviceClient
    .from("partite")
    .update({ nome_completo_inseritore: `${nome} ${cognome}`.trim() })
    .eq("id_inseritore", id);

  if (matchNamesError) {
    console.error("updateMember inseritore names failed:", matchNamesError);
  }

  const { error: opponentNamesError } = await serviceClient
    .from("partite")
    .update({ nome_completo_avversario: `${nome} ${cognome}`.trim() })
    .eq("id_avversario", id);

  if (opponentNamesError) {
    console.error("updateMember avversario names failed:", opponentNamesError);
  }

  revalidateMemberPaths();
  return { success: true };
}

export async function toggleMemberFrozen(
  memberId: string,
  nextFrozen: boolean,
): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const serviceClient = createServiceRoleClient();
  const { error } = await serviceClient
    .from("soci")
    .update({ congelato: nextFrozen })
    .eq("id", memberId);

  if (error) {
    console.error("toggleMemberFrozen failed:", error);
    return {
      success: false,
      error: "Impossibile aggiornare lo stato del giocatore. Riprova.",
    };
  }

  revalidateMemberPaths();
  return { success: true };
}

export async function deleteMember(memberId: string): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const serviceClient = createServiceRoleClient();
  const { count, error: countError } = await serviceClient
    .from("partite")
    .select("id", { count: "exact", head: true })
    .or(`id_inseritore.eq.${memberId},id_avversario.eq.${memberId},id_vincitore.eq.${memberId},id_perdente.eq.${memberId}`);

  if (countError) {
    console.error("deleteMember relation check failed:", countError);
    return {
      success: false,
      error: "Impossibile verificare le partite del giocatore. Riprova.",
    };
  }

  if ((count ?? 0) > 0) {
    return {
      success: false,
      error: "Non puoi eliminare un giocatore con partite registrate. Congelalo invece.",
    };
  }

  const { error } = await serviceClient.from("soci").delete().eq("id", memberId);

  if (error) {
    console.error("deleteMember failed:", error);
    return {
      success: false,
      error: "Impossibile eliminare il giocatore. Riprova.",
    };
  }

  revalidateMemberPaths();
  return { success: true };
}
