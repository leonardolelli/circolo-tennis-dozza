"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { adminMatchSchema, submitMatchSchema } from "@/lib/validation";
import { calculateEloDelta } from "@/lib/elo";
import type { ActionResult, MatchOutcome } from "@/lib/types";

const MIN_RATING = 100;

export interface SubmitMatchPayload {
  inseritoreId: string;
  inseritorePin: string;
  avversarioId: string;
  esito: MatchOutcome;
  risultato: string;
}

async function assertAdmin() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    return { success: false as const, error: "Devi accedere come amministratore." };
  }

  return { success: true as const };
}

async function rebuildRankingFromHistory(serviceClient: ReturnType<typeof createServiceRoleClient>) {
  const [{ data: members, error: membersError }, { data: matches, error: matchesError }] = await Promise.all([
    serviceClient
      .from("soci")
      .select("id, nome, cognome, punti_iniziali"),
    serviceClient
      .from("partite")
      .select("id, id_inseritore, id_avversario, esito_inseritore, risultato, data")
      .order("data", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  if (membersError || matchesError || !members) {
    console.error("rebuildRankingFromHistory failed:", membersError ?? matchesError);
    return false;
  }

  const membersById = new Map(
    members.map((member) => [member.id, member]),
  );
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

    const winner = match.esito_inseritore === "win"
      ? { member: inseritore, state: inseritoreState }
      : { member: avversario, state: avversarioState };
    const loser = match.esito_inseritore === "win"
      ? { member: avversario, state: avversarioState }
      : { member: inseritore, state: inseritoreState };

    const delta = calculateEloDelta(winner.state.punti, loser.state.punti);

    winner.state.punti = Math.max(MIN_RATING, winner.state.punti + delta);
    winner.state.vittorie += 1;
    winner.state.dataUltimaPartita = match.data;

    loser.state.punti = Math.max(MIN_RATING, loser.state.punti - delta);
    loser.state.sconfitte += 1;
    loser.state.dataUltimaPartita = match.data;

    const nomeInseritore = `${inseritore.nome} ${inseritore.cognome}`.trim();
    const nomeAvversario = `${avversario.nome} ${avversario.cognome}`.trim();

    const { error: updateMatchError } = await serviceClient
      .from("partite")
      .update({
        nome_completo_inseritore: nomeInseritore,
        nome_completo_avversario: nomeAvversario,
        id_vincitore: winner.member.id,
        id_perdente: loser.member.id,
        punti_vincitore_variazioni: delta,
        punti_perdente_variazioni: delta,
      })
      .eq("id", match.id);

    if (updateMatchError) {
      console.error("rebuildRankingFromHistory match update failed:", updateMatchError);
      return false;
    }
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
      console.error("rebuildRankingFromHistory member update failed:", updateMemberError);
      return false;
    }
  }

  return true;
}

function revalidateMatchPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/cronologia-match");
  revalidatePath("/admin/soci");
  revalidatePath("/classifica");
  revalidatePath("/classifica/cronologia");
}

/**
 * Records a match result and updates both players' Elo-style rating.
 *
 * Security: this is a public Server Action (no Supabase Auth session
 * involved - club members only ever identify themselves with their PIN).
 * It re-validates every input with zod, then verifies the submitting
 * player's PIN against the bcrypt hash stored in `soci.pin` *before*
 * touching anything else. Only once that succeeds does it compute the
 * rating swing and hand off to the `apply_match_result` SQL function
 * (via the service-role client) to perform the atomic write.
 */
export async function submitMatchResult(
  payload: SubmitMatchPayload,
): Promise<ActionResult> {
  const parsed = submitMatchSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }
  const { inseritoreId, inseritorePin, avversarioId, esito, risultato } =
    parsed.data;

  const supabase = createServiceRoleClient();

  const { data: players, error: fetchError } = await supabase
    .from("soci")
    .select("id, punti, pin, congelato")
    .in("id", [inseritoreId, avversarioId]);

  if (fetchError || !players || players.length !== 2) {
    return { success: false, error: "Giocatore o avversario non trovato." };
  }

  const inseritore = players.find((player) => player.id === inseritoreId);
  const avversario = players.find((player) => player.id === avversarioId);
  if (!inseritore || !avversario) {
    return { success: false, error: "Giocatore o avversario non trovato." };
  }

  if (inseritore.congelato || avversario.congelato) {
    return {
      success: false,
      error: "Non puoi registrare partite per giocatori congelati.",
    };
  }

  const isPinValid = await bcrypt.compare(inseritorePin, inseritore.pin);
  if (!isPinValid) {
    return { success: false, error: "PIN errato." };
  }

  const winnerRating = esito === "win" ? inseritore.punti : avversario.punti;
  const loserRating = esito === "win" ? avversario.punti : inseritore.punti;
  const variazione = calculateEloDelta(winnerRating, loserRating);

  const { error: rpcError } = await supabase.rpc("apply_match_result", {
    p_inseritore_id: inseritoreId,
    p_avversario_id: avversarioId,
    p_esito_inseritore: esito,
    p_risultato: risultato,
    p_variazione: variazione,
  });

  if (rpcError) {
    console.error("apply_match_result failed:", rpcError);
    return {
      success: false,
      error: "Impossibile registrare la partita. Riprova.",
    };
  }

  revalidateMatchPaths();
  return { success: true };
}

export async function updateMatch(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const parsed = adminMatchSchema.safeParse({
    id: formData.get("id"),
    inseritoreId: formData.get("inseritoreId"),
    avversarioId: formData.get("avversarioId"),
    esito: formData.get("esito"),
    risultato: formData.get("risultato"),
    data: formData.get("data"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  const { id, inseritoreId, avversarioId, esito, risultato, data } = parsed.data;
  const serviceClient = createServiceRoleClient();

  const { data: players, error: playersError } = await serviceClient
    .from("soci")
    .select("id, nome, cognome")
    .in("id", [inseritoreId, avversarioId]);

  if (playersError || !players || players.length !== 2) {
    return { success: false, error: "Seleziona due giocatori validi." };
  }

  const inseritore = players.find((player) => player.id === inseritoreId);
  const avversario = players.find((player) => player.id === avversarioId);
  if (!inseritore || !avversario) {
    return { success: false, error: "Seleziona due giocatori validi." };
  }

  const winnerId = esito === "win" ? inseritoreId : avversarioId;
  const loserId = esito === "win" ? avversarioId : inseritoreId;

  const { error } = await serviceClient
    .from("partite")
    .update({
      id_inseritore: inseritoreId,
      id_avversario: avversarioId,
      nome_completo_inseritore: `${inseritore.nome} ${inseritore.cognome}`.trim(),
      nome_completo_avversario: `${avversario.nome} ${avversario.cognome}`.trim(),
      esito_inseritore: esito,
      id_vincitore: winnerId,
      id_perdente: loserId,
      risultato,
      data,
      punti_vincitore_variazioni: 1,
      punti_perdente_variazioni: 1,
    })
    .eq("id", id);

  if (error) {
    console.error("updateMatch failed:", error);
    return {
      success: false,
      error: "Impossibile aggiornare il match. Riprova.",
    };
  }

  const rebuilt = await rebuildRankingFromHistory(serviceClient);
  if (!rebuilt) {
    return {
      success: false,
      error: "Il match è stato salvato ma la classifica non è stata ricalcolata correttamente.",
    };
  }

  revalidateMatchPaths();
  return { success: true };
}

export async function deleteMatch(matchId: string): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const serviceClient = createServiceRoleClient();
  const { error } = await serviceClient.from("partite").delete().eq("id", matchId);

  if (error) {
    console.error("deleteMatch failed:", error);
    return {
      success: false,
      error: "Impossibile eliminare il match. Riprova.",
    };
  }

  const rebuilt = await rebuildRankingFromHistory(serviceClient);
  if (!rebuilt) {
    return {
      success: false,
      error: "Il match è stato eliminato ma la classifica non è stata ricalcolata correttamente.",
    };
  }

  revalidateMatchPaths();
  return { success: true };
}
