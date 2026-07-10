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
 * Worked examples with the default K factor (32):
 *   - 1000 vs 1500, the 1000-rated player wins (a big upset): swing ≈ +30.
 *   - 1000 vs 1500, the 1500-rated player wins (as expected):  swing ≈ +2.
 * The bigger the rating gap, the bigger the swing for an upset and the
 * smaller the swing for an expected result - exactly the "stronger players
 * shouldn't coast by beating beginners" behaviour requested.
 */

/** Maximum rating points that can change hands after a single match. */
export const ELO_K_FACTOR = 32;

/** Ratings are never allowed to drop below this floor (mirrors the SQL side). */
export const MIN_RATING = 100;

/** A win/loss always moves the rating by at least this many points. */
const MIN_DELTA = 1;

/**
 * Computes how many points move from the loser to the winner.
 *
 * @param winnerRating current rating of the player who won the match.
 * @param loserRating current rating of the player who lost the match.
 * @returns a positive integer point delta to add to the winner and subtract
 *   from the loser.
 */
export function calculateEloDelta(
  winnerRating: number,
  loserRating: number,
): number {
  const expectedWinnerScore =
    1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
  const rawDelta = ELO_K_FACTOR * (1 - expectedWinnerScore);

  return Math.max(MIN_DELTA, Math.round(rawDelta));
}

/**
 * Applies a computed delta to a rating, clamping it at {@link MIN_RATING}.
 */
export function applyRatingFloor(rating: number, delta: number): number {
  return Math.max(MIN_RATING, rating + delta);
}
