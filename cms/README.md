# Midnight Crew CMS

Admin za Midnight Crew stranicu. Postavljen isto kao fesb-racing-cms: Payload CMS 3.90.2 na Next.js 16,
D1 za bazu, R2 za slike, na Cloudflare Workers preko OpenNext. Stranica (TanStack Start) je u nadređenoj mapi
i čita CMS samo kod builda (`scripts/fetch-cms.mjs`), pa posjetitelji nikad ne opterećuju CMS.

- Live: https://midnight-crew-cms.pop-sites.workers.dev/admin
- Worker: `midnight-crew-cms`, D1: `midnight-crew-cms`, R2: `midnight-crew-media`
- Admin je na hrvatskom. Vrijeme događaja je uvijek po Livnu (Europe/Sarajevo).

## Sadržaj

- Sadržaj: **Događaji**, **Shop**, **Gdje smo bili** (mjesta na karti), **Garaža** (auti ekipe)
- Biblioteka: **Slike** (R2)
- Postavke: **Korisnici**, **Postavke stranice**, **Stranica Garaža**
- **Narudžbe i poruke** (dno menija): narudžbe iz shopa i poruke iz garaže. Čita ih iz D1 baze stranice
  (`midnight-crew`, binding `ORDERS`), status narudžbe se mijenja tu.
- Prvi korisnik u praznoj bazi je uvijek admin. Admin dodaje urednike. Spremanje traži prijavu, čitanje je javno.
- Dok je CMS prazan, na nadzornoj ploči je gumb **Uvezi sadržaj sa stranice**: učita sve iz
  `src/seed-data/content.json` (kopija `../src/content`) i slike s live stranice. Može se pokrenuti opet, ništa se ne duplira.

## Postavljanje na Cloudflare (jednom)

D1 baza i R2 bucket već postoje, a njihovi ID-evi su u `wrangler.jsonc`.

1. Cloudflare → Workers & Pages → Create → Import a repository → `PetarPoP/midnight-crew-site`.
   - Project name: `midnight-crew-cms`
   - Root directory: `cms`
   - Build command: prazno
   - Deploy command: `npm run deploy` (napravi migraciju baze, build i deploy)
   - Build watch paths (Settings → Builds): include `cms/*`
2. Kad prvi deploy prođe: Worker `midnight-crew-cms` → Settings → Variables and Secrets → dodaj **Secret**
   `PAYLOAD_SECRET` s dugim nasumičnim tekstom (npr. iz `openssl rand -hex 32` ili bilo kojeg generatora lozinki).
3. Otvori `/admin`, napravi svoj račun (postaje admin) i klikni **Uvezi sadržaj sa stranice**.
4. Da spremanje u CMS-u samo objavi stranicu: Worker `midnight-crew-site` → Settings → Builds → Deploy Hooks →
   napravi hook za granu `main` i kopiraj URL. Na Workeru `midnight-crew-cms` dodaj Secret `REBUILD_WEBHOOK_URL` s tim URL-om.
5. Po želji, na Workeru `midnight-crew-site` u Build watch paths stavi exclude `cms/*`, da promjena samo u CMS kodu ne builda stranicu.

Nakon toga svaki push u `cms/` sam objavi CMS, a svako spremanje u CMS-u za 2 do 4 minute objavi stranicu.

Ručni deploy s računala (umjesto koraka 1): `npm install`, `npx wrangler login`, `npm run deploy`,
pa `npx wrangler secret put PAYLOAD_SECRET`.

## Lokalno

1. `npm install`
2. Napravi `.dev.vars` po uzoru na `.env.example` (nije u gitu).
3. `npm run migrate:local`
4. `npm run seed` (napravi korisnika iz `SEED_ADMIN_EMAIL` i `SEED_ADMIN_PASSWORD` i učita sadržaj)
5. `npm run dev` → http://localhost:3100/admin

Lokalna D1 i R2 su u `.wrangler/state`. Stranica može čitati lokalni CMS: u korijenu `CMS_URL=http://localhost:3100 npm run cms:pull`.

## Promjena sheme

1. Promijeni kolekcije u `src/`.
2. `npm run migrate:create -- <ime>` (napiše datoteku u `src/migrations`).
3. `npm run generate:types` i `npm run generate:importmap`.
4. `npm run migrate:local`.

Ako dodaš polje koje stranica treba, dodaj ga i u `../scripts/fetch-cms.mjs`.

## Build

- `npm run build:cf` je OpenNext build (`.open-next/worker.js`), bez deploya. Koristi webpack, ne Turbopack (Payload issue #16470).
- `postinstall` popravi OpenNext `@next/env` shim, inače esbuild korak pada.
- Worker je veći od limita besplatnog plana, pa treba Workers Paid (kao fesb-racing-cms).
- Slike se ne smanjuju u CMS-u (Workers nemaju `sharp`). Stranica sama napravi AVIF/WebP verzije kod builda.

## Rebuild hook

`src/hooks/rebuild.ts`: nakon promjene u događajima, shopu, mjestima, garaži ili postavkama čeka 25 s bez nove promjene,
pa pošalje POST na `REBUILD_WEBHOOK_URL`. Spremanje u adminu ne čeka na to. Ako varijabla nije postavljena, ne radi ništa.
