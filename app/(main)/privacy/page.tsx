import type { Metadata } from "next";

import { CLUB_LEGAL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Informativa sul trattamento dei dati personali ai sensi del GDPR e normativa italiana.",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-10">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>

      <div className="mt-6 space-y-6 text-sm leading-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Titolare del trattamento</h2>
          <p className="mt-2">
            Il Titolare del trattamento è {CLUB_LEGAL.legalName}, con sede in
            {" "}{CLUB_LEGAL.registeredOffice}. Per informazioni privacy:
            {" "}
            <a
              href={`mailto:${CLUB_LEGAL.privacyEmail}`}
              className="underline underline-offset-2"
            >
              {CLUB_LEGAL.privacyEmail}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Dati trattati</h2>
          <p className="mt-2">Attraverso il sito possono essere trattati:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Dati identificativi dei soci (es. nome visualizzato in classifica).</li>
            <li>Dati di contatto dei soci gestiti nell&apos;area amministrativa (es. telefono).</li>
            <li>Dati sportivi interni (partite, punteggi, storico risultati).</li>
            <li>Dati di accesso degli amministratori autenticati.</li>
            <li>Dati comunicati spontaneamente via email, telefono o WhatsApp alla segreteria.</li>
            <li>Dati tecnici necessari al funzionamento e alla sicurezza del sito.</li>
            <li>
              Dati di navigazione e log tecnici raccolti dall&apos;infrastruttura
              (es. indirizzo IP, user-agent/browser, tipologia di dispositivo,
              data/ora della richiesta, pagine richieste, metriche di traffico).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Finalità e basi giuridiche</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Gestione dell&apos;attività associativa e classifica interna dei soci.</li>
            <li>Gestione operativa delle sfide e registrazione dei risultati.</li>
            <li>Gestione accessi amministrativi e sicurezza applicativa.</li>
            <li>Riscontro alle richieste inviate alla segreteria.</li>
            <li>Monitoraggio tecnico del traffico, prevenzione abusi e sicurezza del servizio.</li>
          </ul>
          <p className="mt-2">
            Le basi giuridiche includono l&apos;esecuzione di attività preordinate alla
            vita associativa, l&apos;adempimento di obblighi di legge e il legittimo
            interesse alla sicurezza del servizio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Pubblicazione sul sito</h2>
          <p className="mt-2">
            Il sito rende pubblicamente visibili la classifica interna, i nominativi
            dei soci partecipanti, i punteggi e la cronologia delle partite inserite.
            Tale pubblicazione costituisce parte del servizio associativo offerto dal
            circolo ai partecipanti alla classifica interna.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Modalità del trattamento</h2>
          <p className="mt-2">
            I dati sono trattati con strumenti elettronici e misure tecniche e
            organizzative adeguate, con accesso limitato ai soggetti autorizzati.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Destinatari e fornitori</h2>
          <p className="mt-2">
            Possono accedere ai dati, nei limiti delle rispettive competenze,
            i soggetti autorizzati dall&apos;associazione e i fornitori tecnici del sito
            e dell&apos;infrastruttura applicativa/database (es. Vercel e Supabase),
            ove nominati responsabili del trattamento.
          </p>
          <p className="mt-2">
            I fornitori possono mettere a disposizione del titolare pannelli di
            monitoraggio tecnico con informazioni su accessi e performance del sito,
            anche in forma aggregata.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Trasferimenti verso paesi terzi</h2>
          <p className="mt-2">
            Alcuni fornitori tecnici possono trattare dati anche al di fuori dello
            Spazio Economico Europeo. In tali casi il trattamento avviene secondo
            le garanzie previste dalla normativa applicabile, incluse decisioni di
            adeguatezza o clausole contrattuali standard, se necessarie.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Conservazione</h2>
          <p className="mt-2">
            I dati sono conservati secondo criteri coerenti con le finalità del
            trattamento. In particolare: i dati della classifica e dello storico
            partite sono mantenuti per la durata dell&apos;iniziativa sportiva e per le
            esigenze organizzative del circolo; i dati di accesso admin per la durata
            dell&apos;abilitazione; le richieste inviate alla segreteria per il tempo
            necessario a gestirle; i log tecnici e i dati di traffico secondo le
            policy di conservazione del provider infrastrutturale e le esigenze di
            sicurezza del servizio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Natura del conferimento</h2>
          <p className="mt-2">
            Il conferimento dei dati necessari alla gestione dei soci, delle sfide,
            dei PIN e dei risultati è necessario per fruire delle relative funzioni.
            L&apos;eventuale mancato conferimento può impedire la partecipazione alla
            classifica o l&apos;uso delle funzionalità riservate.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">10. Diritti degli interessati</h2>
          <p className="mt-2">
            Gli interessati possono esercitare i diritti previsti dagli artt.
            15-22 GDPR (accesso, rettifica, cancellazione, limitazione,
            opposizione, portabilità), nei limiti applicabili.
          </p>
          <p className="mt-2">
            È possibile presentare reclamo al Garante per la protezione dei dati
            personali.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">11. Decisioni automatizzate</h2>
          <p className="mt-2">
            Non risultano processi decisionali automatizzati aventi effetti giuridici
            o analogamente significativi ai sensi dell&apos;art. 22 GDPR. Il calcolo del
            punteggio interno serve unicamente alla classifica sportiva del circolo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">12. Servizi esterni</h2>
          <p className="mt-2">
            Il sito contiene link esterni verso servizi come WhatsApp e Instagram.
            L&apos;apertura di tali servizi comporta l&apos;uscita dal presente sito e
            l&apos;applicazione delle rispettive informative privacy e cookie dei terzi.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">13. Aggiornamenti</h2>
          <p className="mt-2">
            La presente informativa può essere aggiornata nel tempo in funzione
            di modifiche normative o organizzative.
          </p>
        </section>
      </div>
    </section>
  );
}
