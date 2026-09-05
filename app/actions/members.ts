"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { calculateEloDelta } from "@/lib/elo";
import { getEloParams } from "@/lib/data/site-settings";
import {
  addMemberSchema,
  updateMemberSchema,
  USERNAME_PATTERN,
} from "@/lib/validation";
import { authEmailForUsername } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import type { ActionResult } from "@/lib/types";

const CSV_MAX_FILE_SIZE = 5 * 1024 * 1024;

interface MemberCsvRow {
  id?: string;
  nome: string;
  cognome: string;
  telefono: string;
  username: string;
  password: string;
  punti_iniziali?: string;
  punti?: string;
  vittorie?: string;
  sconfitte?: string;
  congelato?: string;
  data_ultima_partita?: string;
  created_at?: string;
}

type SocioInsert = Database["public"]["Tables"]["soci"]["Insert"];

/** Admin-only guard (session + soci.is_admin) used by every mutating action. */
const assertAdmin = requireAdmin;

/**
 * Derives the login username from `nome.cognome` (lowercase, sanitized): e.g.
 * "Mario Rossi" -> "mario.rossi", "Danilo Di Tullio" -> "danilo.ditullio".
 */
function deriveUsername(nome: string, cognome: string): string {
  const raw = `${nome}.${cognome}`.toLowerCase();
  const cleaned = raw.replace(/[^a-z0-9._-]+/g, "");
  return cleaned.replace(/^[._-]+|[._-]+$/g, "");
}

/**
 * Ensures a Supabase Auth account exists for a member: creates it when there
 * is no linked `user_id`, otherwise updates its password. The auth email is
 * derived from the username (`<username>@<AUTH_EMAIL_DOMAIN>`). Supabase
 * hashes the password internally; the reversible copy the manager needs lives
 * in `soci.password` (plaintext, by request).
 */
async function ensureAuthAccount({
  serviceClient,
  existingUserId,
  username,
  password,
}: {
  serviceClient: ReturnType<typeof createServiceRoleClient>;
  existingUserId: string | null;
  username: string;
  password: string;
}): Promise<{ userId: string | null; error?: string }> {
  if (existingUserId) {
    const { error } = await serviceClient.auth.admin.updateUserById(
      existingUserId,
      { password },
    );

    if (error) {
      return {
        userId: null,
        error: `Account non aggiornato (${username}): ${error.message}`,
      };
    }
    return { userId: existingUserId };
  }

  const { data, error } = await serviceClient.auth.admin.createUser({
    email: authEmailForUsername(username),
    password,
    email_confirm: true,
  });

  if (error || !data?.user) {
    const duplicate =
      /already (been )?registered|user already exists|email_exists|user_exists/i.test(
        error?.message ?? "",
      );
    return {
      userId: null,
      error: duplicate
        ? `Esiste già un account con lo username ${username}.`
        : `Account non creato (${username}): ${error?.message ?? "errore sconosciuto"}`,
    };
  }

  return { userId: data.user.id };
}

/**
 * Creates a NEW Supabase Auth account for a different username (the derived
 * auth email changes with the username). When the socio already has an
 * account, the caller must delete the old auth user only AFTER the `soci` row
 * has been updated to point to the new user id. Password is required whenever
 * an account is (re)created.
 */
async function replaceAuthAccount({
  serviceClient,
  currentUserId,
  currentUsername,
  newUsername,
  password,
}: {
  serviceClient: ReturnType<typeof createServiceRoleClient>;
  currentUserId: string | null;
  currentUsername: string | null;
  newUsername: string;
  password: string;
}): Promise<{ userId: string | null; error?: string }> {
  const email = authEmailForUsername(newUsername);

  if (!currentUserId) {
    if (!password) {
      return { userId: null };
    }
    const { data, error } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data?.user) {
      const duplicate =
        /already (been )?registered|user already exists|email_exists|user_exists/i.test(
          error?.message ?? "",
        );
      return {
        userId: null,
        error: duplicate
          ? `Esiste già un account con lo username ${newUsername}.`
          : `Account non creato (${newUsername}): ${error?.message ?? "errore sconosciuto"}`,
      };
    }
    return { userId: data.user.id };
  }

  if (!password) {
    return {
      userId: null,
      error: `Per cambiare lo username di "${currentUsername}" in "${newUsername}" serve la password del socio (per ricreare l'account).`,
    };
  }

  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data?.user) {
    const duplicate =
      /already (been )?registered|user already exists|email_exists|user_exists/i.test(
        error?.message ?? "",
      );
    return {
      userId: null,
      error: duplicate
        ? `Esiste già un account con lo username ${newUsername}.`
        : `Account non creato (${newUsername}): ${error?.message ?? "errore sconosciuto"}`,
    };
  }

  return { userId: data.user.id };
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

function parseMembersCsv(csvText: string): {
  rows: MemberCsvRow[];
  error: string | null;
} {
  const table = parseCsvText(csvText);
  if (table.length < 2) {
    return { rows: [], error: "Il CSV non contiene righe dati." };
  }

  const headers = table[0].map((header) => header.trim().toLowerCase());
  // `username`/`password` are optional: username defaults to nome.cognome and
  // password is only needed to create/update the auth account.
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
      username: obj.username ?? "",
      password: obj.password ?? "",
      punti_iniziali: obj.punti_iniziali || undefined,
      punti: obj.punti || undefined,
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

  // Rebuild with the currently persisted rating parameters so the recomputed
  // ranking reflects any admin change to the K factor / rating floor.
  const eloParams = await getEloParams();

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
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  const { nome, cognome, telefono, puntiIniziali, username, password } =
    parsed.data;
  const isAdmin = formData.get("isAdmin") === "on";

  const serviceClient = createServiceRoleClient();

  // Create the linked Supabase Auth account first. The auth email is derived
  // from the username (synthetic, never delivered), so account + socio stay
  // consistent and the member can log in immediately with username+password.
  const { data: createdUser, error: createUserError } =
    await serviceClient.auth.admin.createUser({
      email: authEmailForUsername(username),
      password,
      email_confirm: true,
    });

  if (createUserError || !createdUser?.user) {
    console.error(
      "addMember createUser failed:",
      createUserError?.message ?? "no user returned",
    );
    const duplicate = /already (been )?registered|user already exists|email_exists|user_exists/i.test(
      createUserError?.message ?? "",
    );
    return {
      success: false,
      error: duplicate
        ? "Esiste già un account con questo username."
        : "Impossibile creare l'account del giocatore. Riprova.",
    };
  }

  const { error } = await serviceClient.from("soci").insert({
    nome,
    cognome,
    telefono,
    punti_iniziali: puntiIniziali,
    punti: puntiIniziali,
    username,
    password,
    user_id: createdUser.user.id,
    is_admin: isAdmin,
  });

  if (error) {
    console.error("addMember failed:", error);
    // Roll back the just-created auth user so a retry is not blocked by the
    // (derived) email already being taken.
    await serviceClient.auth.admin
      .deleteUser(createdUser.user.id)
      .catch(() => undefined);

    return {
      success: false,
      error: /username/i.test(error.message ?? "")
        ? "Esiste già un socio con questo username."
        : "Impossibile aggiungere il giocatore. Riprova.",
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

  const rawPassword = (formData.get("password") as string | null)?.trim() ?? "";
  const parsed = updateMemberSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    cognome: formData.get("cognome"),
    telefono: formData.get("telefono"),
    punti: formData.get("punti"),
    username: formData.get("username"),
    password: rawPassword.length > 0 ? rawPassword : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  const { id, nome, cognome, telefono, punti, username, password } =
    parsed.data;
  const serviceClient = createServiceRoleClient();

  const { data: existing, error: existingError } = await serviceClient
    .from("soci")
    .select("id, username, user_id, password")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return { success: false, error: "Giocatore non trovato." };
  }

  let userId = existing.user_id;
  const wantsPassword = typeof password === "string" && password.length > 0;
  const usernameChanged = existing.username !== username;

  // When the username of an account-linked socio changes we recreate the auth
  // account under the new username and delete the OLD one only after the soci
  // update succeeds.
  let oldAuthUserId: string | null = null;
  let createdNewAuthId: string | null = null;

  if (usernameChanged && existing.user_id) {
    const recreatePassword = wantsPassword
      ? (password as string)
      : (existing.password ?? "");
    const replacement = await replaceAuthAccount({
      serviceClient,
      currentUserId: existing.user_id,
      currentUsername: existing.username ?? username,
      newUsername: username,
      password: recreatePassword,
    });

    if (replacement.error) {
      return { success: false, error: replacement.error };
    }
    if (replacement.userId) {
      oldAuthUserId = existing.user_id;
      createdNewAuthId = replacement.userId;
      userId = replacement.userId;
    }
  } else if (!userId && wantsPassword) {
    // The socio has no auth account yet (e.g. imported via CSV): create it now
    // with the chosen password so the member can log in.
    const { data: createdUser, error: createUserError } =
      await serviceClient.auth.admin.createUser({
        email: authEmailForUsername(username),
        password,
        email_confirm: true,
      });

    if (createUserError || !createdUser?.user) {
      console.error(
        "updateMember createUser failed:",
        createUserError?.message ?? "no user returned",
      );
      const duplicate = /already (been )?registered|user already exists|email_exists|user_exists/i.test(
        createUserError?.message ?? "",
      );
      return {
        success: false,
        error: duplicate
          ? "Esiste già un account con questo username."
          : "Impossibile creare l'account del giocatore. Riprova.",
      };
    }
    userId = createdUser.user.id;
    createdNewAuthId = userId;
  } else if (userId && wantsPassword) {
    // Existing account, unchanged username: reset the password.
    const { error: updatePasswordError } =
      await serviceClient.auth.admin.updateUserById(userId, {
        password,
      });

    if (updatePasswordError) {
      console.error(
        "updateMember update password failed:",
        updatePasswordError.message,
      );
      return {
        success: false,
        error: "Impossibile aggiornare la password. Riprova.",
      };
    }
  }

  const updatePayload: {
    nome: string;
    cognome: string;
    telefono: string;
    punti: number;
    punti_iniziali: number;
    username: string;
    user_id?: string | null;
    is_admin?: boolean;
    password?: string | null;
  } = {
    nome,
    cognome,
    telefono,
    punti,
    punti_iniziali: punti,
    username,
  };

  if (userId) {
    updatePayload.user_id = userId;
  }

  const isAdmin = formData.get("isAdmin") === "on";
  updatePayload.is_admin = isAdmin;

  // Keep the reversible (plaintext) copy of the password in sync: it is what
  // the CSV export shows to the manager.
  if (wantsPassword) {
    updatePayload.password = password;
  }

  const { error } = await serviceClient
    .from("soci")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error("updateMember failed:", error);
    // Roll back the auth account created for this update.
    if (createdNewAuthId) {
      await serviceClient.auth.admin
        .deleteUser(createdNewAuthId)
        .catch(() => undefined);
    }
    return {
      success: false,
      error: /username/i.test(error.message ?? "")
        ? "Esiste già un socio con questo username."
        : "Impossibile aggiornare il giocatore. Riprova.",
    };
  }

  // The socio now points to the new account (username changed): remove the
  // OLD auth user.
  if (oldAuthUserId && createdNewAuthId) {
    const { error: deleteOldError } =
      await serviceClient.auth.admin.deleteUser(oldAuthUserId);

    if (deleteOldError) {
      console.error(
        "updateMember delete old auth failed:",
        deleteOldError.message,
      );
      // Roll back: drop the new account and restore the previous link.
      await serviceClient.auth.admin
        .deleteUser(createdNewAuthId)
        .catch(() => undefined);
      const { error: revertError } = await serviceClient
        .from("soci")
        .update({
          user_id: oldAuthUserId,
          username: existing.username ?? username,
        })
        .eq("id", id);
      if (revertError) {
        console.error("updateMember rollback failed:", revertError.message);
      }
      return {
        success: false,
        error:
          "Impossibile sostituire il vecchio account del giocatore. Riprova.",
      };
    }
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

  const serviceClient = createServiceRoleClient();
  const seenUsernames = new Set<string>();
  let imported = 0;

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

    const explicitUsername = (row.username ?? "").trim().toLowerCase();
    const username = explicitUsername || deriveUsername(nome, cognome);

    if (!USERNAME_PATTERN.test(username)) {
      return {
        success: false,
        error: `Username non valido per ${nome} ${cognome}: "${username}". Usa solo minuscole, numeri, punti, trattini o underscore (2-30 caratteri).`,
      };
    }

    if (seenUsernames.has(username)) {
      return {
        success: false,
        error: `Due righe hanno lo stesso username "${username}" (${nome} ${cognome}).`,
      };
    }
    seenUsernames.add(username);

    const password = (row.password ?? "").trim();
    if (password.length > 0 && password.length < 8) {
      return {
        success: false,
        error: `La password di ${nome} ${cognome} deve avere almeno 8 caratteri.`,
      };
    }

    const { data: existing, error: existingError } = row.id
      ? await serviceClient
          .from("soci")
          .select("id, username, user_id, password")
          .eq("id", row.id)
          .maybeSingle()
      : await serviceClient
          .from("soci")
          .select("id, username, user_id, password")
          .eq("username", username)
          .maybeSingle();

    if (existingError) {
      console.error("importMembersCsv lookup failed:", existingError);
      return {
        success: false,
        error:
          "Import CSV non riuscito durante la verifica dei giocatori.",
      };
    }

    // Changing the username of a socio whose account is already linked is
    // allowed: the account is recreated under the new username and the OLD one
    // is deleted after the socio write succeeds.
    let account: { userId: string | null; error?: string };
    let oldAuthUserId: string | null = null;
    let createdNewAuthId: string | null = null;

    const usernameChanged =
      Boolean(existing?.user_id) &&
      Boolean(existing?.username) &&
      existing!.username !== username;

    if (usernameChanged) {
      const recreatePassword =
        password.length > 0 ? password : (existing?.password ?? "");
      const replacement = await replaceAuthAccount({
        serviceClient,
        currentUserId: existing!.user_id,
        currentUsername: existing!.username ?? username,
        newUsername: username,
        password: recreatePassword,
      });

      if (replacement.error) {
        return { success: false, error: replacement.error };
      }
      account = { userId: replacement.userId };
      if (replacement.userId) {
        oldAuthUserId = existing!.user_id;
        createdNewAuthId = replacement.userId;
      }
    } else if (password.length > 0) {
      account = await ensureAuthAccount({
        serviceClient,
        existingUserId: existing?.user_id ?? null,
        username,
        password,
      });
      if (account.userId && !existing?.user_id) {
        createdNewAuthId = account.userId;
      }
    } else {
      account = { userId: existing?.user_id ?? null };
    }

    if (account.error) {
      return { success: false, error: account.error };
    }

    const payload: SocioInsert = {
      nome,
      cognome,
      telefono,
      username,
      punti_iniziali: toOptionalInt(row.punti_iniziali) ?? 1000,
      punti: toOptionalInt(row.punti) ?? toOptionalInt(row.punti_iniziali) ?? 1000,
      vittorie: toOptionalInt(row.vittorie) ?? 0,
      sconfitte: toOptionalInt(row.sconfitte) ?? 0,
      congelato: toOptionalBoolean(row.congelato) ?? false,
      data_ultima_partita: toOptionalIsoDate(row.data_ultima_partita),
      created_at: toOptionalIsoDate(row.created_at) ?? undefined,
    };

    if (account.userId) {
      payload.user_id = account.userId;
    }
    if (password.length > 0) {
      payload.password = password;
    }

    const targetId = row.id ?? existing?.id;

    if (targetId) {
      payload.id = targetId;
      const { error } = await serviceClient
        .from("soci")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        console.error("importMembersCsv upsert failed:", error);
        // Roll back the auth account created for this row.
        if (createdNewAuthId) {
          await serviceClient.auth.admin
            .deleteUser(createdNewAuthId)
            .catch(() => undefined);
        }
        return {
          success: false,
          error: `Import non riuscito per ${nome} ${cognome}: ${error.message}.`,
        };
      }
    } else {
      const { error: insertError } = await serviceClient
        .from("soci")
        .insert(payload);

      if (insertError) {
        console.error("importMembersCsv insert failed:", insertError);
        // Roll back the auth account created for this row.
        if (createdNewAuthId) {
          await serviceClient.auth.admin
            .deleteUser(createdNewAuthId)
            .catch(() => undefined);
        }
        return {
          success: false,
          error: `Import non riuscito per ${nome} ${cognome}: ${insertError.message}.`,
        };
      }
    }

    // Username of an account-linked socio changed: remove the OLD auth user
    // now that the socio points to the new account.
    if (oldAuthUserId && createdNewAuthId) {
      const { error: deleteOldError } =
        await serviceClient.auth.admin.deleteUser(oldAuthUserId);

      if (deleteOldError) {
        console.error(
          "importMembersCsv delete old auth failed:",
          deleteOldError.message,
        );
        // Roll back: drop the new account and restore the previous link.
        await serviceClient.auth.admin
          .deleteUser(createdNewAuthId)
          .catch(() => undefined);
        const { error: revertError } = await serviceClient
          .from("soci")
          .update({
            user_id: oldAuthUserId,
            username: existing?.username ?? username,
          })
          .eq("id", targetId as string);
        if (revertError) {
          console.error(
            "importMembersCsv rollback failed:",
            revertError.message,
          );
        }
        return {
          success: false,
          error: `Import non riuscito per ${nome} ${cognome}: impossibile sostituire il vecchio account.`,
        };
      }
    }

    imported += 1;
  }

  revalidateMemberPaths();
  return {
    success: true,
    data: { imported },
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

  const { data: socioToDelete } = await serviceClient
    .from("soci")
    .select("user_id")
    .eq("id", memberId)
    .maybeSingle();

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

  // Best-effort cleanup of the linked Supabase Auth account.
  if (socioToDelete?.user_id) {
    await serviceClient.auth.admin
      .deleteUser(socioToDelete.user_id)
      .catch(() => undefined);
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
