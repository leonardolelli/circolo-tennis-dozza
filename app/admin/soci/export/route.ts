import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

function escapeCsvCell(value: string | number | boolean | null): string {
  if (value === null) return "";
  const raw = String(value);
  if (!/[",\n\r]/.test(raw)) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    return NextResponse.json(
      { error: "Devi accedere come amministratore." },
      { status: 401 },
    );
  }

  const serviceClient = createServiceRoleClient();
  const { data, error } = await serviceClient
    .from("soci")
    .select(
      "id, nome, cognome, telefono, punti_iniziali, punti, pin, vittorie, sconfitte, congelato, data_ultima_partita, created_at",
    )
    .order("cognome", { ascending: true })
    .order("nome", { ascending: true });

  if (error) {
    console.error("members csv export failed:", error);
    return NextResponse.json(
      { error: "Impossibile generare il CSV dei giocatori." },
      { status: 500 },
    );
  }

  const headers = [
    "id",
    "nome",
    "cognome",
    "telefono",
    "punti_iniziali",
    "punti",
    "pin_hash",
    "vittorie",
    "sconfitte",
    "congelato",
    "data_ultima_partita",
    "created_at",
  ];

  const lines = [headers.join(",")];

  for (const member of data ?? []) {
    lines.push(
      [
        member.id,
        member.nome,
        member.cognome,
        member.telefono,
        member.punti_iniziali,
        member.punti,
        member.pin,
        member.vittorie,
        member.sconfitte,
        member.congelato,
        member.data_ultima_partita,
        member.created_at,
      ]
        .map((value) => escapeCsvCell(value))
        .join(","),
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const fileName = `giocatori-${today}.csv`;

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
