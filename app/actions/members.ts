"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { addMemberSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

/** Bcrypt cost factor for hashing member PINs. */
const BCRYPT_SALT_ROUNDS = 12;

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
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    return { success: false, error: "Devi accedere come amministratore." };
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
    punti: puntiIniziali,
    pin: pinHash,
  });

  if (error) {
    console.error("addMember failed:", error);
    return {
      success: false,
      error: "Impossibile aggiungere il socio. Riprova.",
    };
  }

  revalidatePath("/admin/soci");
  revalidatePath("/admin");
  revalidatePath("/classifica");
  return { success: true };
}
