import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Builds the href for a given page number, e.g. `(p) => `?page=${p}``. */
  buildHref: (page: number) => string;
  className?: string;
}

/** Computes a compact page list with ellipses, e.g. 1 … 4 5 6 … 12. */
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const keepPages = new Set<number>([1, total, current, current - 1, current + 1]);
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

/** Server-driven pagination (plain links) so it works with JS disabled. */
export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav
      aria-label="Paginazione"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={isFirstPage}
        tabIndex={isFirstPage ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          isFirstPage && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Pagina precedente</span>
      </Link>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              buttonVariants({
                variant: page === currentPage ? "default" : "outline",
                size: "icon",
              }),
            )}
          >
            {page}
          </Link>
        ),
      )}

      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={isLastPage}
        tabIndex={isLastPage ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          isLastPage && "pointer-events-none opacity-40",
        )}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Pagina successiva</span>
      </Link>
    </nav>
  );
}
