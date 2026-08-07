/**
 * Elo-style rating system used for the internal club ranking.
 *
 * Standard chess Elo formula: the expected score of a player is a logistic
 * function of the rating gap between the two opponents, and the rating swing
 * after the match is `K * (actual score - expected score)`. Because the
 * winner's actual score is 1 and the loser's is 0, and both expected scores
 * sum to 1, the winner's gain and the loser's loss always have the exact
 * same magnitude - which is also what the product spec asks for ("il
 * perdente ne perde altrettanti").
 *
 * All the knobs below (K factor, minimum delta and rating floor) are
 * configurable by an admin on /admin/punteggi: the persisted values live in
 * the `site_settings` singleton row and are passed in as {@link EloParams}.
 * `calculateEloDelta` and `applyRatingFloor` fall back to the defaults when
 * no params are provided, so existing callers keep working unchanged.
 *
 * Worked examples with the default K factor (32):
 *   - 1000 vs 1500, the 1000-rated player wins (a big upset): swing ≈ +30.
 *   - 1000 vs 1500, the 1500-rated player wins (as expected):  swing ≈ +2.
 * The bigger the rating gap, the bigger the swing for an upset and the
 * smaller the swing for an expected result - exactly the "stronger players
 * shouldn't coast by beating beginners" behaviour requested.
 */

/**
 * Configurable parameters of the Elo-style rating system.
 */
export interface EloParams {
  /** Maximum rating points that can change hands after a single match. */
  kFactor: number;
  /** Ratings are never allowed to drop below this floor (mirrors the SQL side). */
  minRating: number;
  /** A win/loss always moves the rating by at least this many points. */
  minDelta: number;
}

/**
 * Default parameters, used whenever no persisted configuration is available
 * (fresh database, missing `site_settings` row, or callers that opt out of
 * loading the stored values).
 */
export const DEFAULT_ELO_PARAMS: EloParams = {
  kFactor: 32,
  minRating: 100,
  minDelta: 1,
};

/** Backwards-compatible aliases for the default parameters. */
export const ELO_K_FACTOR = DEFAULT_ELO_PARAMS.kFactor;
export const MIN_RATING = DEFAULT_ELO_PARAMS.minRating;
export const MIN_DELTA = DEFAULT_ELO_PARAMS.minDelta;

/**
 * Computes how many points move from the loser to the winner.
 *
 * @param winnerRating current rating of the player who won the match.
 * @param loserRating current rating of the player who lost the match.
 * @param params rating system parameters (defaults to {@link DEFAULT_ELO_PARAMS}).
 * @returns a positive integer point delta to add to the winner and subtract
 *   from the loser.
 */
export function calculateEloDelta(
  winnerRating: number,
  loserRating: number,
  params: EloParams = DEFAULT_ELO_PARAMS,
): number {
  const expectedWinnerScore =
    1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
  const rawDelta = params.kFactor * (1 - expectedWinnerScore);

  return Math.max(params.minDelta, Math.round(rawDelta));
}

/**
 * Applies a computed delta to a rating, clamping it at the given floor
 * (defaults to `DEFAULT_ELO_PARAMS.minRating`).
 */
export function applyRatingFloor(
  rating: number,
  delta: number,
  minRating: number = DEFAULT_ELO_PARAMS.minRating,
): number {
  return Math.max(minRating, rating + delta);
}
