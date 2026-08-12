import { Badge } from "@/components/ui/badge";
import {
  getCategoryClassName,
  getCategoryLabel,
  type PlayerCategory,
} from "@/lib/categories";
import { cn } from "@/lib/utils";

/** Small colored badge showing a player's category (Oro / Argento / Bronzo). */
export function CategoryBadge({
  category,
  className,
}: {
  category: PlayerCategory;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("shrink-0", getCategoryClassName(category), className)}
    >
      {getCategoryLabel(category)}
    </Badge>
  );
}
