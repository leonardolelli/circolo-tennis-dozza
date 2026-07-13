import it from "@/assets/i18n/it.json";

export const copy = it;

export function getPlayerLabel(
  count: number,
  options?: { capitalized?: boolean },
): string {
  const capitalized = options?.capitalized ?? false;
  if (capitalized) {
    return count === 1
      ? copy.terms.player.singularCapitalized
      : copy.terms.player.pluralCapitalized;
  }

  return count === 1 ? copy.terms.player.singular : copy.terms.player.plural;
}
