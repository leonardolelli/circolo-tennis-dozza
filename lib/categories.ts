/**
 * Player categories (gold / silver / bronze) used to limit how far up the
 * ranking a member may challenge an opponent.
 *
 * Every member belongs to exactly one category based on their current
 * points (see {@link getCategory}). Each category also defines the maximum
 * number of ranking positions above themselves that a player may challenge
 * (e.g. a gold player with `goldMaxRankDelta = 4` can challenge anyone up
 * to 4 places above them). Challenging someone lower in the ranking is
 * always allowed.
 *
 * All thresholds are admin-configurable and persisted in the `site_settings`
 * singleton row (see lib/data/site-settings.ts and the "Categorie giocatori"
 * section on /admin/soci).
 */

/** The three player categories, from strongest to weakest. */
export type PlayerCategory = "gold" | "silver" | "bronze";

/**
 * Configurable parameters of the category system.
 */
export interface CategoryConfig {
  /** Points greater than or equal to this value → gold category. */
  goldMin: number;
  /** Points greater than or equal to this value (and below `goldMin`) → silver; below it → bronze. */
  silverMin: number;
  /** Maximum ranking positions above their rank that a gold player may challenge. */
  goldMaxRankDelta: number;
  /** Maximum ranking positions above their rank that a silver player may challenge. */
  silverMaxRankDelta: number;
  /** Maximum ranking positions above their rank that a bronze player may challenge. */
  bronzeMaxRankDelta: number;
}

/**
 * Default category parameters, used whenever no persisted configuration is
 * available (fresh database, missing `site_settings` row, or callers that
 * opt out of loading the stored values).
 */
export const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  goldMin: 2000,
  silverMin: 1000,
  goldMaxRankDelta: 4,
  silverMaxRankDelta: 6,
  bronzeMaxRankDelta: 6,
};

const CATEGORY_LABELS: Record<PlayerCategory, string> = {
  gold: "Oro",
  silver: "Argento",
  bronze: "Bronzo",
};

const CATEGORY_BADGE_CLASSES: Record<PlayerCategory, string> = {
  gold: "border-amber-400/60 bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  silver:
    "border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-400/40 dark:bg-slate-300/20 dark:text-slate-200",
  bronze:
    "border-[#b87333]/40 bg-[#c77b3f]/20 text-[#7c4a1e] dark:bg-[#c77b3f]/15 dark:text-[#d9a066]",
};

/**
 * Resolves the category a player belongs to based on their current points.
 */
export function getCategory(
  points: number,
  config: CategoryConfig = DEFAULT_CATEGORY_CONFIG,
): PlayerCategory {
  if (points >= config.goldMin) return "gold";
  if (points >= config.silverMin) return "silver";
  return "bronze";
}

/** Italian display label for a category ("Oro", "Argento", "Bronzo"). */
export function getCategoryLabel(category: PlayerCategory): string {
  return CATEGORY_LABELS[category];
}

/** Tailwind classes for a category badge, tuned for light and dark themes. */
export function getCategoryClassName(category: PlayerCategory): string {
  return CATEGORY_BADGE_CLASSES[category];
}

/** Max ranking positions above their rank that this category may challenge. */
export function getMaxRankDelta(
  category: PlayerCategory,
  config: CategoryConfig = DEFAULT_CATEGORY_CONFIG,
): number {
  switch (category) {
    case "gold":
      return config.goldMaxRankDelta;
    case "silver":
      return config.silverMaxRankDelta;
    case "bronze":
      return config.bronzeMaxRankDelta;
  }
}
