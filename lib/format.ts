/** Shared date/number formatting helpers, all using the Italian locale. */

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formats an ISO timestamp as `gg/mm/aaaa`. */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

/** Formats an ISO timestamp as `gg/mm/aaaa, hh:mm`. */
export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate));
}

/** Formats a win rate (0-1) as a percentage string, e.g. "62%". */
export function formatWinRate(vittorie: number, sconfitte: number): string {
  const totalMatches = vittorie + sconfitte;
  if (totalMatches === 0) return "—";
  return `${Math.round((vittorie / totalMatches) * 100)}%`;
}
