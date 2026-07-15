"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { calculateEloDelta } from "@/lib/elo";
import { addMemberSchema, updateMemberSchema } from "@/lib/validation";
import type { Database } from "@/lib/database.types";
import type { ActionResult } from "@/lib/types";

/** Bcrypt cost factor for hashing member PINs. */
const BCRYPT_SALT_ROUNDS = 12;
const MIN_RATING = 100;
const CSV_MAX_FILE_SIZE = 5 * 1024 * 1024;

interface MemberCsvRow {
  id?: string;
  nome: string;
  cognome: string;
  telefono: string;
  punti_iniziali?: string;
  punti?: string;
  pin?: string;
  pin_hash?: string;
  vittorie?: string;
  sconfitte?: string;
  congelato?: string;
  data_ultima_partita?: string;
  created_at?: string;
}

type SocioInsert = Database["public"]["Tables"]["soci"]["Insert"];

async function assertAdmin() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    return { success: false as const, error: "Devi accedere come amministratore." };
  }

  return { success: true as const };
}

function normalizeFullName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("it-IT");
}

function revalidateMemberPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/soci");
  revalidatePath("/admin/cronologia-match");
  revalidatePath("/classifica");
  revalidatePath("/classifica/cronologia");
}

function parseCsvText(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (char === '"') {
      if (inQuotes && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && input[index + 1] === "\n") {
        index += 1;
      }
      row.push(cell.trim());
      cell = "";
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

function toOptionalInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toOptionalBoolean(value: string | undefined): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return null;
}

function toOptionalIsoDate(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

async function resolvePinHash(row: MemberCsvRow): Promise<string | null> {
  if (row.pin_hash && row.pin_hash.length > 0) {
    return row.pin_hash;
  }
  if (!row.pin || !/^\d{8}$/.test(row.pin)) {
    return null;
  }
  return bcrypt.hash(row.pin, BCRYPT_SALT_ROUNDS);
}

function parseMembersCsv(csvText: string): {
  rows: MemberCsvRow[];
  error: string | null;
} {
  const table = parseCsvText(csvText);
  if (table.length < 2) {
    return { rows: [], error: "Il CSV non contiene righe dati." };
  }

  const headers = table[0].map((header) => header.trim().toLowerCase());
  const requiredHeaders = ["nome", "cognome", "telefono"];
  const missing = requiredHeaders.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    return {
      rows: [],
      error: `Colonne mancanti nel CSV: ${missing.join(", ")}.`,
    };
  }

  const rows: MemberCsvRow[] = [];
  for (let rowIndex = 1; rowIndex < table.length; rowIndex += 1) {
    const raw = table[rowIndex];
    const obj: Record<string, string> = {};
    headers.forEach((header, columnIndex) => {
      obj[header] = raw[columnIndex] ?? "";
    });

    rows.push({
      id: obj.id || undefined,
      nome: obj.nome ?? "",
      cognome: obj.cognome ?? "",
      telefono: obj.telefono ?? "",
      punti_iniziali: obj.punti_iniziali || undefined,
      punti: obj.punti || undefined,
      pin: obj.pin || undefined,
      pin_hash: obj.pin_hash || undefined,
      vittorie: obj.vittorie || undefined,
      sconfitte: obj.sconfitte || undefined,
      congelato: obj.congelato || undefined,
      data_ultima_partita: obj.data_ultima_partita || undefined,
      created_at: obj.created_at || undefined,
    });
  }

  return { rows, error: null };
}

async function rebuildRankingFromHistory(
  serviceClient: ReturnType<typeof createServiceRoleClient>,
  forcedResetMemberIds: string[] = [],
) {
  const [{ data: members, error: membersError }, { data: matches, error: matchesError }] =
    await Promise.all([
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
    console.error("members rebuildRankingFromHistory failed:", membersError ?? matchesError);
    return false;
  }

  const membersById = new Map(members.map((member) => [member.id, member]));
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
    inseritoreId: string;
    avversarioId: string;
    esito: "win" | "loss";
    data: string;
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
      inseritoreId,
      avversarioId,
      esito: match.esito_inseritore,
      data: match.data,
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

    const winner =
      match.esito === "win"
        ? { state: inseritoreState }
        : { state: avversarioState };
    const loser =
      match.esito === "win"
        ? { state: avversarioState }
        : { state: inseritoreState };

    const delta = calculateEloDelta(winner.state.punti, loser.state.punti);

    winner.state.punti = Math.max(MIN_RATING, winner.state.punti + delta);
    winner.state.vittorie += 1;
    winner.state.dataUltimaPartita = match.data;

    loser.state.punti = Math.max(MIN_RATING, loser.state.punti - delta);
    loser.state.sconfitte += 1;
    loser.state.dataUltimaPartita = match.data;

    const { error: updateMatchError } = await serviceClient
      .from("partite")
      .update({
        id_inseritore: inseritore.id,
        id_avversario: avversario.id,
        nome_completo_inseritore: `${inseritore.nome} ${inseritore.cognome}`.trim(),
        nome_completo_avversario: `${avversario.nome} ${avversario.cognome}`.trim(),
      })
      .eq("id", match.id);

    if (updateMatchError) {
      console.error("members rebuildRankingFromHistory match update failed:", updateMatchError);
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
    pin: formData.get("pin"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  const { id, nome, cognome, telefono, punti, pin } = parsed.data;
  const serviceClient = createServiceRoleClient();

  const updatePayload: {
    nome: string;
    cognome: string;
    telefono: string;
    punti: number;
    pin?: string;
  } = {
    nome,
    cognome,
    telefono,
    punti,
  };

  if (pin && pin.length > 0) {
    updatePayload.pin = await bcrypt.hash(pin, BCRYPT_SALT_ROUNDS);
  }

  const { error } = await serviceClient
    .from("soci")
    .update(updatePayload)
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

export async function importMembersCsv(
  _prevState: ActionResult<{ imported: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ imported: number }>> {
  const admin = await assertAdmin();
  if (!admin.success) {
    return admin;
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Seleziona un file CSV valido." };
  }

  if (file.size <= 0) {
    return { success: false, error: "Il file CSV e vuoto." };
  }

  if (file.size > CSV_MAX_FILE_SIZE) {
    return {
      success: false,
      error: "Il file CSV supera il limite massimo di 5MB.",
    };
  }

  const csvText = await file.text();
  const parsedCsv = parseMembersCsv(csvText);
  if (parsedCsv.error) {
    return { success: false, error: parsedCsv.error };
  }

  const rowsWithId: SocioInsert[] = [];
  const rowsWithoutId: SocioInsert[] = [];

  for (const row of parsedCsv.rows) {
    const nome = row.nome.trim();
    const cognome = row.cognome.trim();
    const telefono = row.telefono.trim();

    if (!nome || !cognome || !telefono) {
      return {
        success: false,
        error: "Ogni riga deve contenere nome, cognome e telefono.",
      };
    }

    const pinHash = await resolvePinHash(row);
    if (!pinHash) {
      return {
        success: false,
        error: "Ogni riga deve includere pin_hash oppure un PIN numerico a 8 cifre.",
      };
    }

    const payload: SocioInsert = {
      nome,
      cognome,
      telefono,
      punti_iniziali: toOptionalInt(row.punti_iniziali) ?? 1000,
      punti: toOptionalInt(row.punti) ?? toOptionalInt(row.punti_iniziali) ?? 1000,
      pin: pinHash,
      vittorie: toOptionalInt(row.vittorie) ?? 0,
      sconfitte: toOptionalInt(row.sconfitte) ?? 0,
      congelato: toOptionalBoolean(row.congelato) ?? false,
      data_ultima_partita: toOptionalIsoDate(row.data_ultima_partita),
      created_at: toOptionalIsoDate(row.created_at) ?? undefined,
    };

    if (row.id) {
      payload.id = row.id;
      rowsWithId.push(payload);
    } else {
      delete payload.created_at;
      rowsWithoutId.push(payload);
    }
  }

  const serviceClient = createServiceRoleClient();

  if (rowsWithId.length > 0) {
    const { error } = await serviceClient
      .from("soci")
      .upsert(rowsWithId, { onConflict: "id" });

    if (error) {
      console.error("importMembersCsv upsert failed:", error);
      return {
        success: false,
        error: "Import CSV non riuscito durante l'aggiornamento dei giocatori.",
      };
    }
  }

  if (rowsWithoutId.length > 0) {
    const { error } = await serviceClient.from("soci").insert(rowsWithoutId);

    if (error) {
      console.error("importMembersCsv insert failed:", error);
      return {
        success: false,
        error: "Import CSV non riuscito durante l'inserimento dei giocatori.",
      };
    }
  }

  revalidateMemberPaths();
  return {
    success: true,
    data: {
      imported: parsedCsv.rows.length,
    },
  };
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

  const { data: impactedMatches, error: impactedMatchesError } = await serviceClient
    .from("partite")
    .select("id_inseritore, id_avversario")
    .or(
      `id_inseritore.eq.${memberId},id_avversario.eq.${memberId},id_vincitore.eq.${memberId},id_perdente.eq.${memberId}`,
    );

  if (impactedMatchesError) {
    console.error("deleteMember impacted matches preload failed:", impactedMatchesError);
    return {
      success: false,
      error: "Impossibile eliminare il giocatore. Riprova.",
    };
  }

  const forcedResetMemberIds = new Set<string>();
  for (const match of impactedMatches ?? []) {
    if (match.id_inseritore && match.id_inseritore !== memberId) {
      forcedResetMemberIds.add(match.id_inseritore);
    }
    if (match.id_avversario && match.id_avversario !== memberId) {
      forcedResetMemberIds.add(match.id_avversario);
    }
  }

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
    const rebuilt = await rebuildRankingFromHistory(
      serviceClient,
      Array.from(forcedResetMemberIds),
    );
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
