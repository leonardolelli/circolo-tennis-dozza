import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

interface AwardLeader {
  id: string;
  name: string;
  value: number;
}

export interface MonthlyAwards {
  monthLabel: string;
  totalMatches: number;
  mostWins: AwardLeader[];
  mostMatches: AwardLeader[];
  mostLosses: AwardLeader[];
}

function monthWindow(referenceDate: Date) {
  const start = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );

  return { start, end };
}

function getTopLeaders(countById: Map<string, number>, namesById: Map<string, string>) {
  const entries = [...countById.entries()]
    .map(([id, value]) => ({ id, value, name: namesById.get(id) ?? "Giocatore sconosciuto" }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "it-IT"));

  if (entries.length === 0) return [];
  const bestValue = entries[0]?.value ?? 0;
  return entries.filter((entry) => entry.value === bestValue);
}

export const getMonthlyAwards = cache(async (): Promise<MonthlyAwards> => {
  const supabase = await createClient();
  const { data: playersData, error: playersError } = await supabase
    .from("soci")
    .select("id, nome, cognome");

  const now = new Date();
  const { start, end } = monthWindow(now);

  const { data: matchesData, error: matchesError } = await supabase
    .from("partite")
    .select(
      "id, id_inseritore, id_avversario, id_vincitore, id_perdente, nome_completo_inseritore, nome_completo_avversario",
    )
    .gte("data", start.toISOString())
    .lt("data", end.toISOString());

  if (playersError) {
    console.error("Failed to load players for monthly awards:", playersError);
  }

  if (matchesError) {
    console.error("Failed to load monthly matches for awards:", matchesError);
  }

  const namesById = new Map<string, string>();
  for (const player of playersData ?? []) {
    namesById.set(player.id, `${player.nome} ${player.cognome}`.trim());
  }

  const winsById = new Map<string, number>();
  const lossesById = new Map<string, number>();
  const matchesById = new Map<string, number>();

  for (const match of matchesData ?? []) {
    if (match.id_inseritore) {
      matchesById.set(
        match.id_inseritore,
        (matchesById.get(match.id_inseritore) ?? 0) + 1,
      );
      if (!namesById.has(match.id_inseritore)) {
        namesById.set(match.id_inseritore, match.nome_completo_inseritore);
      }
    }

    if (match.id_avversario) {
      matchesById.set(
        match.id_avversario,
        (matchesById.get(match.id_avversario) ?? 0) + 1,
      );
      if (!namesById.has(match.id_avversario)) {
        namesById.set(match.id_avversario, match.nome_completo_avversario);
      }
    }

    if (match.id_vincitore) {
      winsById.set(match.id_vincitore, (winsById.get(match.id_vincitore) ?? 0) + 1);
    }

    if (match.id_perdente) {
      lossesById.set(match.id_perdente, (lossesById.get(match.id_perdente) ?? 0) + 1);
    }
  }

  return {
    monthLabel: new Intl.DateTimeFormat("it-IT", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(start),
    totalMatches: (matchesData ?? []).length,
    mostWins: getTopLeaders(winsById, namesById),
    mostMatches: getTopLeaders(matchesById, namesById),
    mostLosses: getTopLeaders(lossesById, namesById),
  };
});
