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
- **Classifica**: elenco soci ordinato per punti, sfida via WhatsApp protetta da PIN, form
  "Aggiungi risultato" a step (identità + PIN → avversario → esito e punteggio).
- **Cronologia match**: storico paginato (10 per pagina), filtrabile per nome/esito e
  ordinabile per data.
- **Admin** (`/admin`, protetto da middleware + Supabase Auth): statistiche del circolo,
  gestione soci, aggiunta nuovi soci con PIN a 8 cifre.

## Configurazione

1. Crea un progetto su [Supabase](https://supabase.com) ed esegui lo script
   [supabase/schema.sql](supabase/schema.sql) nel SQL Editor: crea le tabelle
   `soci`, `partite`, `sponsor`, le policy di Row Level Security e la funzione
   `apply_match_result` usata per registrare i risultati in modo atomico.
2. Copia `.env.example` in `.env.local` e compila le variabili con i valori del
   tuo progetto Supabase (Project Settings → API).
3. Crea il primo account amministratore da **Supabase Dashboard → Authentication
   → Users → Add user** (email + password): non esiste una pagina di
   registrazione pubblica, per design.
4. Installa le dipendenze e avvia il progetto:

   ```bash
   npm install
   npm run dev
   ```

5. Accedi come admin da `/login` e aggiungi i soci da `/admin/soci`.

## Modello di sicurezza (riassunto)

- Le chiavi pubbliche (`anon`) possono solo leggere; per `soci` vedono unicamente
  le colonne pubbliche (mai `pin`, e `telefono` solo per sessioni admin autenticate).
- Ogni scrittura passa da una Server Action che verifica prima l'autorizzazione
  (sessione admin per la gestione soci, PIN con bcrypt per le partite e le sfide)
  e solo dopo usa la chiave `service_role` (segreta, solo server) per bypassare la RLS.
- Il calcolo del punteggio (stile Elo, vedi [lib/elo.ts](lib/elo.ts)) vive in
  TypeScript; la scrittura atomica (aggiornamento punti + storico) è isolata in
  un'unica funzione SQL (`apply_match_result`) con row locking, per evitare
  aggiornamenti persi in caso di invii concorrenti.

## Struttura del progetto

```
app/
  (main)/             Home, Classifica, Cronologia (con Sidebar/Bottom Nav)
  admin/               Dashboard e gestione soci, protetti da proxy.ts
  login/               Accesso amministratore (Supabase Auth)
  auth/                Flussi di recupero password
  actions/             Server Actions (soci, partite, sfide WhatsApp, PIN)
components/
  classifica/          Ranking, dialog sfida, wizard "aggiungi risultato"
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
