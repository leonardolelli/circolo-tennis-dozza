import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatWinRate } from "@/lib/format";
import type { SocioAdmin } from "@/lib/types";

export function MembersTable({ members }: { members: SocioAdmin[] }) {
  if (members.length === 0) {
    return (
      <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
        Nessun socio trovato.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Socio</TableHead>
            <TableHead className="hidden sm:table-cell">Telefono</TableHead>
            <TableHead className="text-right">Punti</TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              V - S
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">
              % Vittorie
            </TableHead>
            <TableHead className="hidden text-right lg:table-cell">
              Ultima partita
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">
                {member.nome} {member.cognome}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {member.telefono}
              </TableCell>
              <TableCell className="text-right font-semibold text-tennis">
                {member.punti}
              </TableCell>
              <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                {member.vittorie} - {member.sconfitte}
              </TableCell>
              <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                {formatWinRate(member.vittorie, member.sconfitte)}
              </TableCell>
              <TableCell className="hidden text-right text-muted-foreground lg:table-cell">
                {member.data_ultima_partita
                  ? formatDate(member.data_ultima_partita)
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
