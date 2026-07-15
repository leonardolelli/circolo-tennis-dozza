import type { Metadata } from "next";

import { CLUB_LEGAL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Note legali",
  description:
    "Dati identificativi dell'associazione, contatti e riferimenti legali del sito del circolo.",
};

export default function LegalNoticePage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-10">
      <h1 className="text-3xl font-bold tracking-tight">Note legali</h1>

      <div className="mt-6 space-y-3 text-sm leading-6 text-muted-foreground">
        <p>
          Questo sito web e i relativi contenuti sono gestiti da{" "}
          <span className="font-medium text-foreground">{CLUB_LEGAL.legalName}</span> con denominazione abbreviata{" "}
          {CLUB_LEGAL.displayName}.
        </p>
        <p>
          <span className="font-medium text-foreground">Sede legale:</span>{" "}
          {CLUB_LEGAL.registeredOffice}
        </p>
        <p>
          <span className="font-medium text-foreground">Codice fiscale:</span>{" "}
          {CLUB_LEGAL.taxCode}
        </p>
        <p>
          <span className="font-medium text-foreground">Partita IVA:</span>{" "}
          {CLUB_LEGAL.vatNumber}
        </p>
        {CLUB_LEGAL.rasdNumber ? (
          <p>
            <span className="font-medium text-foreground">Iscrizione RASD:</span>{" "}
            {CLUB_LEGAL.rasdNumber}
          </p>
        ) : null}
        <p>
          <span className="font-medium text-foreground">Contatto:</span>{" "}
          <a
            href={`mailto:${CLUB_LEGAL.privacyEmail}`}
            className="underline underline-offset-2"
          >
            {CLUB_LEGAL.privacyEmail}
          </a>
        </p>
        {CLUB_LEGAL.pecEmail ? (
          <p>
            <span className="font-medium text-foreground">PEC:</span>{" "}
            <a
              href={`mailto:${CLUB_LEGAL.pecEmail}`}
              className="underline underline-offset-2"
            >
              {CLUB_LEGAL.pecEmail}
            </a>
          </p>
        ) : null}
      </div>

      <div className="mt-8 rounded-xl border bg-card p-5 text-sm leading-6 text-muted-foreground">
        <p className="font-medium text-foreground">Servizio offerto dal sito</p>
        <p className="mt-2">
          Il sito pubblica informazioni sul circolo, i contatti della segreteria,
          la classifica interna e la cronologia dei risultati relativi ai soci
          partecipanti all&apos;iniziativa sportiva.
        </p>
      </div>
    </section>
  );
}
