import type { Metadata } from "next";

import { TECHNICAL_COOKIES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Informazioni sui cookie e sulle tecnologie tecniche utilizzate dal sito.",
};

export default function CookiePage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-10">
      <h1 className="text-3xl font-bold tracking-tight">Cookie Policy</h1>

      <div className="mt-6 space-y-6 text-sm leading-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Cosa sono i cookie</h2>
          <p className="mt-2">
            I cookie sono piccoli file di testo che i siti inviano al dispositivo
            dell&apos;utente per garantire il corretto funzionamento dei servizi.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Cookie usati da questo sito</h2>
          <p className="mt-2">
            In base alla configurazione tecnica attuale del progetto, il sito usa
            esclusivamente cookie tecnici necessari al funzionamento dell&apos;area
            amministrativa autenticata e della sessione.
          </p>
          <p className="mt-2">
            Alla data di questa informativa non risultano strumenti di profilazione,
            advertising o analytics terzi attivati nel codice del sito.
          </p>

          <div className="mt-3 overflow-x-auto rounded-xl border">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-muted/40 text-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Nome</th>
                  <th className="px-4 py-2 font-medium">Finalità</th>
                  <th className="px-4 py-2 font-medium">Fornitore</th>
                  <th className="px-4 py-2 font-medium">Durata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TECHNICAL_COOKIES.map((cookie) => (
                  <tr key={cookie.name}>
                    <td className="px-4 py-2">{cookie.name}</td>
                    <td className="px-4 py-2">{cookie.purpose}</td>
                    <td className="px-4 py-2">{cookie.provider}</td>
                    <td className="px-4 py-2">{cookie.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Consenso</h2>
          <p className="mt-2">
            Per i soli cookie tecnici non è richiesto il consenso preventivo.
            Se in futuro verranno introdotti cookie analytics non anonimizzati o
            di profilazione, il sito verrà adeguato con un meccanismo di consenso
            conforme alla normativa applicabile.
          </p>
          <p className="mt-2">
            Per questo motivo il sito, allo stato attuale, non mostra un cookie banner.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Gestione tramite browser</h2>
          <p className="mt-2">
            L&apos;utente può configurare il browser per bloccare o eliminare i cookie.
            La disabilitazione dei cookie tecnici può compromettere alcune
            funzionalità del sito.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Link verso servizi terzi</h2>
          <p className="mt-2">
            Il sito contiene collegamenti esterni, ad esempio verso WhatsApp e
            Instagram. Il semplice link non comporta di per sé l&apos;installazione di
            cookie di terzi da parte di questo sito; eventuali trattamenti ulteriori
            avvengono solo dopo l&apos;apertura del servizio esterno e sono regolati dalle
            relative policy del terzo fornitore.
          </p>
        </section>
      </div>
    </section>
  );
}
