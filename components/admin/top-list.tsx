import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TopListItem {
  id: string;
  label: string;
  value: string;
}

interface TopListProps {
  title: string;
  items: TopListItem[];
  emptyMessage?: string;
  viewAllHref?: string;
}

/** Small ranked list used for the admin dashboard's "top N" widgets. */
export function TopList({
  title,
  items,
  emptyMessage = "Nessun dato disponibile.",
  viewAllHref,
}: TopListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Vedi tutti
          </Link>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent/60"
          >
            <span className="flex items-center gap-2 truncate">
              <span className="w-5 shrink-0 text-xs font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-tennis">
              {item.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
