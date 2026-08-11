import Link from "next/link";
import { Suspense } from "react";
import { Swords, TrendingUp, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/admin/stat-card";
import { TopList } from "@/components/admin/top-list";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SocioPublic } from "@/lib/types";

export const metadata = {
  title: "Dashboard",
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Statistiche generali del circolo.
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const supabase = await createClient();
  const thirtyDaysAgoIso = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  const [
    membersResult,
    totalMatchesResult,
    matchesLast30DaysResult,
    recentMatchesResult,
    recentFormResult,
  ] = await Promise.all([
    supabase
      .from("soci")
      .select(
        "id, nome, cognome, punti, vittorie, sconfitte, congelato, data_ultima_partita, created_at",
      ),
    supabase.from("partite").select("*", { count: "exact", head: true }),
    supabase
      .from("partite")
      .select("*", { count: "exact", head: true })
      .gte("data", thirtyDaysAgoIso),
    supabase
      .from("partite")
      .select(
        "id, nome_completo_inseritore, nome_completo_avversario, risultato, data, id_vincitore, id_inseritore, id_avversario",
      )
      .order("data", { ascending: false })
      .limit(5),
    supabase
      .from("partite")
      .select(
        "id_vincitore, id_perdente, nome_vincitore, nome_perdente, punti_vincitore_variazioni, punti_perdente_variazioni",
      )
      .gte("data", thirtyDaysAgoIso),
  ]);

  const members: SocioPublic[] = membersResult.data ?? [];
  const totalMembers = members.length;
  const totalMatches = totalMatchesResult.count ?? 0;
  const matchesLast30Days = matchesLast30DaysResult.count ?? 0;

  const topByPoints = [...members]
    .sort((a, b) => b.punti - a.punti)
    .slice(0, 5)
    .map((member) => ({
      id: member.id,
      label: `${member.nome} ${member.cognome}`,
      value: String(member.punti),
    }));

  const topByActivity = [...members]
    .sort(
      (a, b) => b.vittorie + b.sconfitte - (a.vittorie + a.sconfitte),
    )
    .filter((member) => member.vittorie + member.sconfitte > 0)
    .slice(0, 5)
    .map((member) => ({
      id: member.id,
      label: `${member.nome} ${member.cognome}`,
      value: String(member.vittorie + member.sconfitte),
    }));

  const formByPlayer = new Map<string, { name: string; delta: number }>();
  for (const match of recentFormResult.data ?? []) {
    if (match.id_vincitore && match.nome_vincitore) {
      const previous = formByPlayer.get(match.id_vincitore)?.delta ?? 0;
      formByPlayer.set(match.id_vincitore, {
        name: match.nome_vincitore,
        delta: previous + match.punti_vincitore_variazioni,
      });
    }
    if (match.id_perdente && match.nome_perdente) {
      const previous = formByPlayer.get(match.id_perdente)?.delta ?? 0;
      formByPlayer.set(match.id_perdente, {
        name: match.nome_perdente,
        delta: previous - match.punti_perdente_variazioni,
      });
    }
  }
  const topForm = [...formByPlayer.entries()]
    .map(([id, entry]) => ({ id, label: entry.name, delta: entry.delta }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5)
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      value: `${entry.delta > 0 ? "+" : ""}${entry.delta}`,
    }));

  const recentMatches = recentMatchesResult.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Giocatori totali" value={totalMembers} icon={Users} />
        <StatCard label="Partite totali" value={totalMatches} icon={Swords} />
        <StatCard
          label="Partite (30 giorni)"
          value={matchesLast30Days}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TopList title="Top 5 classifica" items={topByPoints} viewAllHref="/classifica" />
        <TopList
          title="Più attivi"
          items={topByActivity}
          emptyMessage="Nessuna partita registrata."
        />
        <TopList
          title="Miglior forma (30 giorni)"
          items={topForm}
          emptyMessage="Nessuna partita negli ultimi 30 giorni."
        />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Ultime partite</h2>
          <Link
            href="/classifica/cronologia"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Vedi la cronologia completa
          </Link>
        </div>
        <ul className="divide-y">
          {recentMatches.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nessuna partita registrata.
            </li>
          )}
          {recentMatches.map((match) => (
            <li
              key={match.id}
              className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                <span
                  className={cn(
                    match.id_vincitore === match.id_inseritore
                      ? "font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  {match.nome_completo_inseritore}
                </span>
                <span className="text-muted-foreground"> vs </span>
                <span
                  className={cn(
                    match.id_vincitore === match.id_avversario
                      ? "font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  {match.nome_completo_avversario}
                </span>
                <span className="ml-2 text-muted-foreground">
                  ({match.risultato})
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(match.data)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

