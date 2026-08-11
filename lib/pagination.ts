/**
 * Computes a compact page list with ellipses, e.g. 1 … 4 5 6 … 12.
 * Shared by the server-driven `Pagination` (components/ui/pagination.tsx) and
 * the client-side classifica pagination.
 */
export function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const keepPages = new Set<number>([
    1,
    total,
    current,
    current - 1,
    current + 1,
  ]);
  const sortedPages = [...keepPages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let previousPage = 0;
  for (const page of sortedPages) {
    if (previousPage && page - previousPage > 1) {
      result.push("ellipsis");
    }
    result.push(page);
    previousPage = page;
  }
  return result;
}
