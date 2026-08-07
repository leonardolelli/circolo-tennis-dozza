"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  adminMatchSchema,
  createAdminMatchSchema,
  submitMatchSchema,
} from "@/lib/validation";
import { calculateEloDelta } from "@/lib/elo";
import { getEloParams } from "@/lib/data/site-settings";
import type { ActionResult, MatchOutcome } from "@/lib/types";

export interface SubmitMatchPayload {
  inseritoreId: string;
  inseritorePin: string;
  avversarioId: string;
  esito: MatchOutcome;
  risultato: string;
}

function normalizeFullName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("it-IT");
}

async function assertAdmin() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    return { success: false as const, error: "Devi accedere come amministratore." };
  }

  return { success: true as const };
}

async function rebuildRankingFromHistory(
  serviceClient: ReturnType<typeof createServiceRoleClient>,
  forcedResetMemberIds: string[] = [],
) {
  const [{ data: members, error: membersError }, { data: matches, error: matchesError }] = await Promise.all([
    serviceClient
      .from("soci")
      .select("id, nome, cognome, punti_iniziali, punti, vittorie, sconfitte, data_ultima_partita"),
    serviceClient
      .from("partite")
      .select(
        "id, id_inseritore, id_avversario, nome_completo_inseritore, nome_completo_avversario, esito_inseritore, data",
      )
      .order("data", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  if (membersError || matchesError || !members) {
    console.error("rebuildRankingFromHistory failed:", membersError ?? matchesError);
    return false;
  }

  // Rebuild with the currently persisted rating parameters so an admin edit
  // of the K factor / floor is reflected in the recomputed ranking.
  const eloParams = await getEloParams();

  const membersById = new Map(
    members.map((member) => [member.id, member]),
  );
  const membersByNormalizedName = new Map<string, Array<(typeof members)[number]>>();
  for (const member of members) {
    const fullName = normalizeFullName(`${member.nome} ${member.cognome}`);
    const existing = membersByNormalizedName.get(fullName);

    if (existing) {
      existing.push(member);
    } else {
      membersByNormalizedName.set(fullName, [member]);
    }
  }

  const resolveMemberId = (rawId: string | null, rawName: string) => {
    if (rawId && membersById.has(rawId)) {
      return rawId;
    }

    const byName = membersByNormalizedName.get(normalizeFullName(rawName));
    if (!byName || byName.length !== 1) {
      return null;
    }

    return byName[0].id;
  };

  const involvedMemberIds = new Set<string>();
  for (const memberId of forcedResetMemberIds) {
    if (membersById.has(memberId)) {
      involvedMemberIds.add(memberId);
    }
  }

  const snapshots = new Map(
    members.map((member) => [
      member.id,
      {
        punti: member.punti,
        vittorie: member.vittorie,
        sconfitte: member.sconfitte,
        dataUltimaPartita: member.data_ultima_partita,
      },
    ]),
  );

  const resolvedMatches: Array<{
    id: string;
    esito: "win" | "loss";
    data: string;
    inseritoreId: string;
    avversarioId: string;
  }> = [];

  for (const match of matches ?? []) {
    const inseritoreId = resolveMemberId(
      match.id_inseritore,
      match.nome_completo_inseritore,
    );
    const avversarioId = resolveMemberId(
      match.id_avversario,
      match.nome_completo_avversario,
    );

    if (!inseritoreId || !avversarioId || inseritoreId === avversarioId) {
      continue;
    }

    involvedMemberIds.add(inseritoreId);
    involvedMemberIds.add(avversarioId);
    resolvedMatches.push({
      id: match.id,
      esito: match.esito_inseritore,
      data: match.data,
      inseritoreId,
      avversarioId,
    });
  }

  for (const memberId of involvedMemberIds) {
    const member = membersById.get(memberId);
    const snapshot = snapshots.get(memberId);

    if (!member || !snapshot) {
      continue;
    }

    snapshot.punti = member.punti_iniziali;
    snapshot.vittorie = 0;
    snapshot.sconfitte = 0;
    snapshot.dataUltimaPartita = null;
  }

  for (const match of resolvedMatches) {
    const inseritore = membersById.get(match.inseritoreId);
    const avversario = membersById.get(match.avversarioId);
    const inseritoreState = snapshots.get(match.inseritoreId);
    const avversarioState = snapshots.get(match.avversarioId);

    if (!inseritore || !avversario || !inseritoreState || !avversarioState) {
      continue;
    }

    const winner = match.esito === "win"
      ? { member: inseritore, state: inseritoreState }
      : { member: avversario, state: avversarioState };
    const loser = match.esito === "win"
      ? { member: avversario, state: avversarioState }
      : { member: inseritore, state: inseritoreState };

    const delta = calculateEloDelta(
      winner.state.punti,
      loser.state.punti,
      eloParams,
    );

    winner.state.punti = Math.max(eloParams.minRating, winner.state.punti + delta);
    winner.state.vittorie += 1;
    winner.state.dataUltimaPartita = match.data;

    loser.state.punti = Math.max(eloParams.minRating, loser.state.punti - delta);
    loser.state.sconfitte += 1;
    loser.state.dataUltimaPartita = match.data;

    const nomeInseritore = `${inseritore.nome} ${inseritore.cognome}`.trim();
    const nomeAvversario = `${avversario.nome} ${avversario.cognome}`.trim();

    const { error: updateMatchError } = await serviceClient
      .from("partite")
      .update({
        id_inseritore: inseritore.id,
        id_avversario: avversario.id,
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

  for (const memberId of involvedMemberIds) {
    const snapshot = snapshots.get(memberId);
    if (!snapshot) continue;

    const { error: updateMemberError } = await serviceClient
      .from("soci")
      .update({
        punti: snapshot.punti,
        vittorie: snapshot.vittorie,
        sconfitte: snapshot.sconfitte,
        data_ultima_partita: snapshot.dataUltimaPartita,
      })
      .eq("id", memberId);

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
  const eloParams = await getEloParams();
  const variazione = calculateEloDelta(winnerRating, loserRating, eloParams);

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

export async function createAdminMatch(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const parsed = createAdminMatchSchema.safeParse({
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

  const { inseritoreId, avversarioId, esito, risultato, data } = parsed.data;
  const serviceClient = createServiceRoleClient();

  const { data: players, error: playersError } = await serviceClient
    .from("soci")
    .select("id, nome, cognome, congelato")
    .in("id", [inseritoreId, avversarioId]);

  if (playersError || !players || players.length !== 2) {
    return { success: false, error: "Seleziona due giocatori validi." };
  }

  const inseritore = players.find((player) => player.id === inseritoreId);
  const avversario = players.find((player) => player.id === avversarioId);

  if (!inseritore || !avversario) {
    return { success: false, error: "Seleziona due giocatori validi." };
  }

  if (inseritore.congelato || avversario.congelato) {
    return {
      success: false,
      error: "Non puoi registrare partite per giocatori congelati.",
    };
  }

  const winnerId = esito === "win" ? inseritoreId : avversarioId;
  const loserId = esito === "win" ? avversarioId : inseritoreId;

  const { error: insertError } = await serviceClient.from("partite").insert({
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
  });

  if (insertError) {
    console.error("createAdminMatch failed:", insertError);
    return {
      success: false,
      error: "Impossibile registrare il match. Riprova.",
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

  const { data: matchToDelete, error: matchFetchError } = await serviceClient
    .from("partite")
    .select("id_inseritore, id_avversario")
    .eq("id", matchId)
    .maybeSingle();

  if (matchFetchError) {
    console.error("deleteMatch preload failed:", matchFetchError);
    return {
      success: false,
      error: "Impossibile eliminare il match. Riprova.",
    };
  }

  const { error } = await serviceClient.from("partite").delete().eq("id", matchId);

  if (error) {
    console.error("deleteMatch failed:", error);
    return {
      success: false,
      error: "Impossibile eliminare il match. Riprova.",
    };
  }

  const forcedResetMemberIds = [
    matchToDelete?.id_inseritore,
    matchToDelete?.id_avversario,
  ].filter((value): value is string => Boolean(value));

  const rebuilt = await rebuildRankingFromHistory(serviceClient, forcedResetMemberIds);
  if (!rebuilt) {
    return {
      success: false,
      error: "Il match è stato eliminato ma la classifica non è stata ricalcolata correttamente.",
    };
  }

  revalidateMatchPaths();
  return { success: true };
}
