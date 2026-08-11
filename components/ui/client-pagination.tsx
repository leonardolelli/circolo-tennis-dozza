"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { getPageNumbers } from "@/lib/pagination";
import { buttonVariants } from "@/components/ui/button";

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
  /** Invoked with the requested page when a page button is clicked. */
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Client-side pagination (buttons, no navigation) for in-memory lists, so
 * page changes never trigger a server round-trip or a new DB fetch.
 */
export function ClientPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: ClientPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav
      aria-label="Paginazione"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      <button
        type="button"
        disabled={isFirstPage}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          isFirstPage && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Pagina precedente</span>
      </button>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              buttonVariants({
                variant: page === currentPage ? "default" : "outline",
                size: "icon",
              }),
            )}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={isLastPage}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          isLastPage && "pointer-events-none opacity-40",
        )}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Pagina successiva</span>
      </button>
    </nav>
  );
}
