import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SortToggleLink } from "@/components/cronologia/sort-toggle-link";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Partita } from "@/lib/types";

interface MatchesTableProps {
  matches: Partita[];
  sortHref: string;
  sortDirection: "asc" | "desc";
}

export function MatchesTable({
  matches,
  sortHref,
  sortDirection,
}: MatchesTableProps) {
  if (matches.length === 0) {
    return (
      <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
        Nessuna partita trovata con questi filtri.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="align-bottom">
              <SortToggleLink
                label="Data"
                href={sortHref}
                direction={sortDirection}
              />
            </TableHead>
            <TableHead>Partita</TableHead>
            <TableHead className="hidden sm:table-cell">Punteggio</TableHead>
            <TableHead className="whitespace-normal text-right">
              Variazione punti
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell className="p-2 align-top sm:p-3">
                <div className="flex flex-col whitespace-nowrap text-xs leading-snug text-muted-foreground sm:flex-row sm:items-baseline sm:gap-1 sm:text-sm">
                  <span>{formatDate(match.data)}</span>
                  <span className="text-muted-foreground/70">
                    {formatTime(match.data)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="p-2 sm:p-3">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                  <span
                    className={cn(
                      match.id_vincitore === match.id_inseritore
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {match.nome_completo_inseritore}
                  </span>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <span
                    className={cn(
                      match.id_vincitore === match.id_avversario
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {match.nome_completo_avversario}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                  {match.risultato}
                </div>
              </TableCell>
              <TableCell className="hidden p-2 sm:table-cell sm:p-3">
                {match.risultato}
              </TableCell>
              <TableCell className="p-2 text-right sm:p-3">
                <Badge
                  variant="outline"
                  className="whitespace-nowrap border-tennis/40 px-2 text-tennis"
                >
                  ±{match.punti_vincitore_variazioni}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
