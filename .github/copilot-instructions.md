# Copilot Instructions

## Obiettivo
- Mantieni il codice semplice, leggibile e coerente con lo stile esistente. La priorità assoluta è la visione su dispositivi mobile, quindi assicurati che le modifiche siano responsive.

## Regole
- Usa TypeScript stretto, evita `any` salvo casi giustificati.
- Preferisci componenti piccoli e riutilizzabili.
- Non introdurre librerie nuove se il progetto ha già una soluzione equivalente.
- Per le pagine Next.js, rispetta il pattern già usato nel progetto.
- Non modificare file non collegati alla richiesta.
- Dopo modifiche UI, verifica sempre il comportamento in mobile.
- Il codice e i commenti devono essere sempre scritti in inglese.
- Le parti di testo sul sito web sono sempre in italiano, salvo eccezioni specifiche.

## Convenzioni progetto
- Segui lo stile dei componenti in `components/ui`. Lo stile deve essere accattivante e coerente con il design system.
- Usa Tailwind mantenendo classi concise.
- Per azioni server, segui i pattern in `app/actions`.
- Per Supabase, usa i client già presenti in `lib/supabase`.

## Validazione
- Esegui `npm run lint` dopo modifiche rilevanti.