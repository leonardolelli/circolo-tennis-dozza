import { z } from "zod";

/**
 * Login username chosen by the manager for each member. Kept lowercase;
 * allows letters, digits, dots, dashes and underscores (2-30 chars).
 */
export const USERNAME_PATTERN = /^[a-z0-9._-]{2,30}$/;

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    USERNAME_PATTERN,
    "Lo username può contenere solo lettere minuscole, numeri, punti, trattini o underscore (2-30 caratteri).",
  );

const passwordSchema = z
  .string()
  .min(8, "La password deve avere almeno 8 caratteri.")
  .max(72, "La password è troppo lunga.");

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ]{6,20}$/, "Numero di telefono non valido.");

const nameSchema = z
  .string()
  .trim()
  .min(1, "Campo obbligatorio.")
  .max(60, "Massimo 60 caratteri.");

const scoreSchema = z
  .string()
  .trim()
  .min(1, "Inserisci il punteggio dei set.")
  .max(40, "Punteggio troppo lungo.")
  .regex(
    /^[\p{L}0-9\s\-(),./]{1,40}$/u,
    "Punteggio non valido. Usa un trattino, una barra o uno spazio (es. 6-4, 6/4 o 6 4).",
  )
  .transform((value) =>
    value.replace(/\//g, "-").replace(/\s+/g, " ").trim(),
  );

const uuidSchema = z.string().uuid();

/** Input accepted by the `addMember` Server Action (admin only). */
export const addMemberSchema = z.object({
  nome: nameSchema,
  cognome: nameSchema,
  telefono: phoneSchema,
  puntiIniziali: z.coerce.number().int().min(0).max(5000),
  username: usernameSchema,
  password: passwordSchema,
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberSchema = z.object({
  id: uuidSchema,
  nome: nameSchema,
  cognome: nameSchema,
  telefono: phoneSchema,
  punti: z.coerce.number().int().min(0),
  username: usernameSchema,
  password: passwordSchema.optional(),
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

/** Input accepted by the `submitMatchResult` Server Action. The inseritore is always the current session socio. */
export const submitMatchSchema = z.object({
  avversarioId: uuidSchema,
  esito: z.enum(["win", "loss"]),
  risultato: scoreSchema,
});
export type SubmitMatchInput = z.infer<typeof submitMatchSchema>;

/** Input accepted by the `requestChallenge` Server Action. The requester is always the current session socio. */
export const challengeSchema = z.object({
  opponentId: uuidSchema,
});
export type ChallengeInput = z.infer<typeof challengeSchema>;

export const adminMatchSchema = z
  .object({
    id: uuidSchema,
    inseritoreId: uuidSchema,
    avversarioId: uuidSchema,
    esito: z.enum(["win", "loss"]),
    risultato: scoreSchema,
    data: z.string().datetime({ offset: true }),
  })
  .refine((data) => data.inseritoreId !== data.avversarioId, {
    message: "Seleziona due giocatori diversi.",
    path: ["avversarioId"],
  });
export type AdminMatchInput = z.infer<typeof adminMatchSchema>;

export const createAdminMatchSchema = z
  .object({
    inseritoreId: uuidSchema,
    avversarioId: uuidSchema,
    esito: z.enum(["win", "loss"]),
    risultato: scoreSchema,
    data: z.string().datetime({ offset: true }),
  })
  .refine((data) => data.inseritoreId !== data.avversarioId, {
    message: "Seleziona due giocatori diversi.",
    path: ["avversarioId"],
  });
export type CreateAdminMatchInput = z.infer<typeof createAdminMatchSchema>;

/** Input accepted by the `updateEloSettings` Server Action (admin only). */
export const eloSettingsSchema = z
  .object({
    kFactor: z.coerce.number().int().min(1).max(200),
    minRating: z.coerce.number().int().min(0).max(5000),
    minDelta: z.coerce.number().int().min(1).max(100),
  })
  .refine((data) => data.minDelta <= data.kFactor, {
    message: "Lo spostamento minimo non può superare lo spostamento massimo (K).",
    path: ["minDelta"],
  });
export type EloSettingsInput = z.infer<typeof eloSettingsSchema>;

/** Input accepted by the `updateCategorySettings` Server Action (admin only). */
export const categorySettingsSchema = z
  .object({
    goldMin: z.coerce.number().int().min(0).max(5000),
    silverMin: z.coerce.number().int().min(0).max(5000),
    goldMaxRankDelta: z.coerce.number().int().min(1).max(50),
    silverMaxRankDelta: z.coerce.number().int().min(1).max(50),
    bronzeMaxRankDelta: z.coerce.number().int().min(1).max(50),
  })
  .refine((data) => data.silverMin <= data.goldMin, {
    message: "La soglia della categoria Argento non può superare quella della categoria Oro.",
    path: ["silverMin"],
  });
export type CategorySettingsInput = z.infer<typeof categorySettingsSchema>;

const prizeTextSchema = z
  .string()
  .trim()
  .max(200, "Il premio non può superare 200 caratteri.");

/** Input accepted by the `updateAwardPrizes` Server Action (admin only). */
export const awardPrizesSchema = z.object({
  mostWins: prizeTextSchema,
  mostMatches: prizeTextSchema,
  mostLosses: prizeTextSchema,
});
export type AwardPrizesInput = z.infer<typeof awardPrizesSchema>;

/**
 * Strips characters that are meaningful in PostgREST's filter/ILIKE syntax
 * (`,` `(` `)` separate/group `.or()` conditions; `%` `_` are ILIKE
 * wildcards) before a free-text search term is interpolated into a query
 * filter. Prevents a crafted search string from altering the intended
 * filter structure ("filter injection").
 */
export function sanitizeSearchQuery(raw: string): string {
  return raw
    .replace(/[,()%_]/g, "")
    .trim()
    .slice(0, 60);
}

