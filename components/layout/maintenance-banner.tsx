import { Clock3, Construction, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CLUB_NAME } from "@/lib/constants";

export function MaintenanceNotice({ fullscreen = false }: { fullscreen?: boolean }) {
  return (
    <section
      className={[
        "relative overflow-hidden border-amber-300/60 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.35),_transparent_35%),linear-gradient(135deg,rgba(254,249,195,0.95),rgba(236,252,203,0.92))] text-slate-900 dark:border-amber-800/70 dark:bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.16),_transparent_32%),linear-gradient(135deg,rgba(69,26,3,0.95),rgba(31,41,55,0.98))] dark:text-slate-50",
        fullscreen
          ? "flex min-h-svh items-center justify-center px-4 py-8 sm:px-6"
          : "border-b",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-y-0 right-[-3rem] hidden w-40 rounded-full bg-white/35 blur-3xl sm:block dark:bg-amber-300/10" />
      <div
        className={[
          "relative mx-auto flex w-full max-w-6xl flex-col gap-4",
          fullscreen
            ? "rounded-[2rem] border border-white/45 bg-white/40 p-5 shadow-[0_24px_80px_rgba(120,53,15,0.18)] backdrop-blur sm:p-8 dark:border-white/10 dark:bg-black/10"
            : "px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between",
        ].join(" ")}
      >
        {fullscreen && (
          <div className="flex items-center gap-3 border-b border-slate-900/10 pb-4 dark:border-white/10">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-lime-300 dark:bg-lime-300 dark:text-slate-950">
              CT
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">
                {CLUB_NAME}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Modalità manutenzione attiva
              </p>
            </div>
          </div>
        )}

        <div className={fullscreen ? "grid gap-6 lg:grid-cols-[1.35fr_0.9fr] lg:items-center" : "mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between"}>
          <div className="flex items-start gap-4">
            <div className="relative mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] border border-white/50 bg-white/65 shadow-sm dark:border-white/10 dark:bg-white/5">
              <Construction className="h-7 w-7 text-amber-600 dark:text-amber-300" />
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border border-lime-200 bg-lime-300 shadow-sm dark:border-lime-500/50 dark:bg-lime-400" />
            </div>
            <div className="space-y-3">
              <Badge className="w-fit bg-slate-900 text-white hover:bg-slate-900 dark:bg-amber-300 dark:text-slate-950">
                Lavori in corso
              </Badge>
              <div>
                <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Sito in manutenzione.
                </p>
                <p className="max-w-2xl text-sm text-slate-700 sm:text-base dark:text-slate-300">
                  Torna più tardi.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 text-sm sm:min-w-64">
            <div className="flex items-center gap-2 rounded-xl border border-white/50 bg-white/55 px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <Clock3 className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              Torniamo presto online.
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/50 bg-white/55 px-3 py-3 dark:border-white/10 dark:bg-white/5">
              <Sparkles className="h-4 w-4 text-lime-700 dark:text-lime-300" />
              Grazie per la pazienza.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}