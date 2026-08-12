import { z } from "zod";

/** Every member PIN is exactly this many digits (per the admin creation form). */
export const PIN_LENGTH = 8;

const pinSchema = z
  .string()
  .trim()
  .regex(
    new RegExp(`^\\d{${PIN_LENGTH}}$`),
    `Il PIN deve avere esattamente ${PIN_LENGTH} cifre numeriche.`,
  );

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
  .regex(/^[\p{L}0-9\s\-(),.]{1,40}$/u, "Punteggio non valido.");

const uuidSchema = z.string().uuid();

/** Input accepted by the `addMember` Server Action (admin only). */
export const addMemberSchema = z.object({
  nome: nameSchema,
  cognome: nameSchema,
  telefono: phoneSchema,
  puntiIniziali: z.coerce.number().int().min(0).max(5000),
  pin: pinSchema,
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberSchema = z.object({
  id: uuidSchema,
  nome: nameSchema,
  cognome: nameSchema,
  telefono: phoneSchema,
  punti: z.coerce.number().int().min(0),
  pin: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => value === undefined || value.length === 0 || /^\d{8}$/.test(value),
      `Il PIN deve avere esattamente ${PIN_LENGTH} cifre numeriche.`,
    ),
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

/** Input accepted by the `submitMatchResult` Server Action. */
export const submitMatchSchema = z
  .object({
    inseritoreId: uuidSchema,
    inseritorePin: pinSchema,
    avversarioId: uuidSchema,
    esito: z.enum(["win", "loss"]),
    risultato: scoreSchema,
  })
  .refine((data) => data.inseritoreId !== data.avversarioId, {
    message: "Non puoi selezionare te stesso come avversario.",
    path: ["avversarioId"],
  });
export type SubmitMatchInput = z.infer<typeof submitMatchSchema>;

/** Input accepted by the `requestChallenge` Server Action. */
export const challengeSchema = z
  .object({
    requesterId: uuidSchema,
    requesterPin: pinSchema,
    opponentId: uuidSchema,
  })
  .refine((data) => data.requesterId !== data.opponentId, {
    message: "Seleziona un avversario diverso da te stesso.",
    path: ["opponentId"],
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

