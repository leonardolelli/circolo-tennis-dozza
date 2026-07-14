"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { calculateEloDelta } from "@/lib/elo";
import { addMemberSchema, updateMemberSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

/** Bcrypt cost factor for hashing member PINs. */
const BCRYPT_SALT_ROUNDS = 12;
const MIN_RATING = 100;

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

async function rebuildRankingFromHistory(
  serviceClient: ReturnType<typeof createServiceRoleClient>,
) {
  const [{ data: members, error: membersError }, { data: matches, error: matchesError }] =
    await Promise.all([
      serviceClient.from("soci").select("id, nome, cognome, punti_iniziali"),
      serviceClient
        .from("partite")
        .select("id, id_inseritore, id_avversario, esito_inseritore, data")
        .order("data", { ascending: true })
        .order("id", { ascending: true }),
    ]);

  if (membersError || matchesError || !members) {
    console.error("members rebuildRankingFromHistory failed:", membersError ?? matchesError);
    return false;
  }

  const membersById = new Map(members.map((member) => [member.id, member]));
  const snapshots = new Map(
    members.map((member) => [
      member.id,
      {
        punti: member.punti_iniziali,
        vittorie: 0,
        sconfitte: 0,
        dataUltimaPartita: null as string | null,
      },
    ]),
  );

  for (const match of matches ?? []) {
    if (!match.id_inseritore || !match.id_avversario) {
      continue;
    }

    const inseritore = membersById.get(match.id_inseritore);
    const avversario = membersById.get(match.id_avversario);
    const inseritoreState = snapshots.get(match.id_inseritore);
    const avversarioState = snapshots.get(match.id_avversario);

    if (!inseritore || !avversario || !inseritoreState || !avversarioState) {
      continue;
    }

    const winner =
      match.esito_inseritore === "win"
        ? { state: inseritoreState }
        : { state: avversarioState };
    const loser =
      match.esito_inseritore === "win"
        ? { state: avversarioState }
        : { state: inseritoreState };

    const delta = calculateEloDelta(winner.state.punti, loser.state.punti);

    winner.state.punti = Math.max(MIN_RATING, winner.state.punti + delta);
    winner.state.vittorie += 1;
    winner.state.dataUltimaPartita = match.data;

    loser.state.punti = Math.max(MIN_RATING, loser.state.punti - delta);
    loser.state.sconfitte += 1;
    loser.state.dataUltimaPartita = match.data;
  }

  for (const member of members) {
    const snapshot = snapshots.get(member.id);
    if (!snapshot) continue;

    const { error: updateMemberError } = await serviceClient
      .from("soci")
      .update({
        punti: snapshot.punti,
        vittorie: snapshot.vittorie,
        sconfitte: snapshot.sconfitte,
        data_ultima_partita: snapshot.dataUltimaPartita,
      })
      .eq("id", member.id);

    if (updateMemberError) {
      console.error("members rebuildRankingFromHistory member update failed:", updateMemberError);
      return false;
    }
  }

  return true;
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
    punti: formData.get("punti"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  const { id, nome, cognome, telefono, punti } = parsed.data;
  const serviceClient = createServiceRoleClient();

  const { error } = await serviceClient
    .from("soci")
    .update({ nome, cognome, telefono, punti })
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

interface DeleteMemberOptions {
  deleteMatches?: boolean;
  recalculateRanking?: boolean;
}

export async function deleteMember(
  memberId: string,
  options?: DeleteMemberOptions,
): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const serviceClient = createServiceRoleClient();
  const deleteMatches = options?.deleteMatches ?? false;
  const recalculateRanking = options?.recalculateRanking ?? true;

  if (deleteMatches) {
    const { error: deleteMatchesError } = await serviceClient
      .from("partite")
      .delete()
      .or(
        `id_inseritore.eq.${memberId},id_avversario.eq.${memberId},id_vincitore.eq.${memberId},id_perdente.eq.${memberId}`,
      );

    if (deleteMatchesError) {
      console.error("deleteMember matches delete failed:", deleteMatchesError);
      return {
        success: false,
        error: "Impossibile eliminare i match del giocatore. Riprova.",
      };
    }
  }

  const { error } = await serviceClient.from("soci").delete().eq("id", memberId);

  if (error) {
    console.error("deleteMember failed:", error);
    return {
      success: false,
      error: "Impossibile eliminare il giocatore. Riprova.",
    };
  }

  if (recalculateRanking) {
    const rebuilt = await rebuildRankingFromHistory(serviceClient);
    if (!rebuilt) {
      return {
        success: false,
        error: "Il giocatore è stato eliminato ma la classifica non è stata ricalcolata correttamente.",
      };
    }
  }

  revalidateMemberPaths();
  return { success: true };
}
