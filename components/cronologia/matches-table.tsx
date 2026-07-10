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
import { formatDateTime } from "@/lib/format";
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortToggleLink
                label="Data"
                href={sortHref}
                direction={sortDirection}
              />
            </TableHead>
            <TableHead>Partita</TableHead>
            <TableHead className="hidden sm:table-cell">Punteggio</TableHead>
            <TableHead className="text-right">Variazione punti</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDateTime(match.data)}
              </TableCell>
              <TableCell>
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
              <TableCell className="hidden sm:table-cell">
                {match.risultato}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="border-tennis/40 text-tennis">
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
