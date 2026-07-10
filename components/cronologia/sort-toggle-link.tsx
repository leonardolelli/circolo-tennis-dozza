import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

interface SortToggleLinkProps {
  label: string;
  href: string;
  direction: "asc" | "desc";
  className?: string;
}

/** Column header that links to the same page with the sort order flipped. */
export function SortToggleLink({
  label,
  href,
  direction,
  className,
}: SortToggleLinkProps) {
  const Icon = direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 hover:text-foreground",
        className,
      )}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </Link>
  );
}
