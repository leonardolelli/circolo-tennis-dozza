<h1 align="center">🎾 Circolo Tennis Dozza</h1>

<p align="center">
  Web app del circolo: classifica interna in stile Elo, sfide via WhatsApp,
  cronologia partite e dashboard amministrativa.
  Costruita con Next.js (App Router), TypeScript, Tailwind CSS e Supabase.
</p>

## Stack

- **Next.js 16** (App Router, React Server Components, Server Actions, Cache Components)
- **TypeScript** rigoroso, con i tipi del database generati a mano in [lib/database.types.ts](lib/database.types.ts)
- **Tailwind CSS** + primitivi in stile shadcn/ui (`components/ui`)
- **Supabase** (Postgres, Auth, Row Level Security) tramite `@supabase/ssr`

## Funzionalità

- **Home**: hero, griglia sponsor, contatti rapidi (chiamata / WhatsApp) della segreteria.
- **Classifica** (area riservata ai soci autenticati): elenco soci ordinato per punti,
  sfida via WhatsApp in un tocco (con verifica della regola per categoria), form
  "Aggiungi risultato" a step (avversario → esito e punteggio), registrato a nome
  del socio loggato.
- **Cronologia match**: storico paginato (10 per pagina), filtrabile per nome/esito e
  ordinabile per data.
- **Admin** (`/admin`, accessibile solo agli admin-soci): statistiche del circolo,
  gestione soci e dei relativi account di accesso (username + password).

## Configurazione

1. Crea un progetto su [Supabase](https://supabase.com) ed esegui lo script
   [supabase/schema.sql](supabase/schema.sql) nel SQL Editor: crea le tabelle
   `soci`, `partite`, `sponsor`, le policy di Row Level Security e la funzione
   `apply_match_result` usata per registrare i risultati in modo atomico.
2. Copia `.env.example` in `.env.local` e compila le variabili con i valori del
   tuo progetto Supabase (Project Settings → API).
3. Crea il **primo amministratore** con lo script [supabase/seed-admin.mjs](supabase/seed-admin.mjs)
   (crea l'account Supabase Auth e il socio collegato con `is_admin = true`).
   Tutti gli altri account (soci e admin) vengono creati dall'app in `/admin/soci`
   con username + password; non esiste una pagina di registrazione pubblica.
4. Installa le dipendenze e avvia il progetto:

   ```bash
   npm install
   npm run dev
   ```

5. Accedi da `/login` con lo username del primo amministratore e aggiungi i soci
   da `/admin/soci` (username + password da comunicare a ogni giocatore).

## Modello di sicurezza (riassunto)

- Le chiavi pubbliche (`anon`) possono solo leggere; per `soci` vedono unicamente
  le colonne pubbliche. I dati sensibili (`telefono`, `username`, `user_id`,
  `is_admin`) sono leggibili solo con la chiave `service_role`.
- Tutti gli account (soci e admin) sono collegati a una riga `soci` tramite
  `user_id`; l'identità delle azioni (registrare un risultato, sfidare) viene
  SEMPRE derivata dalla sessione server-side, mai da input del client.
- L'area `/classifica` richiede il login (proxy/middleware); `/admin` richiede un
  socio con `is_admin = true`. Ogni scrittura passa da una Server Action che
  verifica l'autorizzazione e solo dopo usa la chiave `service_role` (segreta,
  solo server) per bypassare la RLS.
- Il calcolo del punteggio (stile Elo, vedi [lib/elo.ts](lib/elo.ts)) vive in
  TypeScript; la scrittura atomica (aggiornamento punti + storico) è isolata in
  un'unica funzione SQL (`apply_match_result`) con row locking, per evitare
  aggiornamenti persi in caso di invii concorrenti.

## Struttura del progetto

```
app/
  (main)/             Home, Classifica, Cronologia (con Sidebar/Bottom Nav)
  admin/               Dashboard e gestione soci, protette a admin-soci
  login/               Accesso soci e amministratori (username + password)
  auth/                Flussi di conferma/reset (non usati per la password)
  actions/             Server Actions (soci, partite, sfide WhatsApp, account)
components/
  classifica/          Ranking, sfida one-tap, wizard "aggiungi risultato"
  cronologia/           Tabella, filtri, ordinamento
  admin/               Nav, statistiche, form soci
  layout/              Sidebar desktop, bottom nav mobile
  ui/                  Primitivi (shadcn/ui style)
lib/
  data/                Query cache()-ate riutilizzabili tra componenti
  supabase/            Client browser/server/service-role
  elo.ts               Algoritmo di calcolo punteggio
  whatsapp.ts          Costruzione link wa.me
  validation.ts        Schemi zod per gli input delle Server Action
supabase/
  schema.sql           Schema completo (tabelle, RLS, funzione SQL)
```


## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app --example with-supabase with-supabase-app
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```

4. Rename `.env.example` to `.env.local` and update the following:

  ```env
  NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[INSERT SUPABASE PROJECT API PUBLISHABLE OR ANON KEY]
  ```
  > [!NOTE]
  > This example uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which refers to Supabase's new **publishable** key format.
  > Both legacy **anon** keys and new **publishable** keys can be used with this variable name during the transition period. Supabase's dashboard may show `NEXT_PUBLIC_SUPABASE_ANON_KEY`; its value can be used in this example.
  > See the [full announcement](https://github.com/orgs/supabase/discussions/29260) for more information.

  Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (free course)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)
