# Midnight Crew

Web stranica za Midnight Crew iz Livna, u stilu festivalskog menija iz igrica: koso postavljene pločice, kartica s tipkama Q/E, interaktivna karta odredišta, događaji i shop.

Napravljeno s [TanStack Start](https://tanstack.com/start) i [Tailwind CSS](https://tailwindcss.com) v4.

## Pokretanje

```bash
npm install
npm run dev        # http://localhost:3000
```

Produkcija (preview radi u istom Cloudflare Workers okruženju kao live stranica):

```bash
npm run build
npm run preview
```

## Cloudflare

Stranica je na Cloudflare Workers, spojena preko GitHuba: svaki push na `main` (i svako spremanje u CMS-u) automatski se builda i objavi. Postavke Workera su u `wrangler.jsonc`. Ručni deploy: `npm run deploy`.

## Uređivanje sadržaja (CMS)

Otvori `/admin` na live stranici (npr. https://midnight-crew-site.pop-sites.workers.dev/admin). Tamo se uređuju događaji, artikli u shopu, mjesta na karti i postavke (Instagram, pravila, Crew LVL). Fotke se učitavaju izravno u CMS-u.

Prijava: **Sign In Using Access Token** s GitHub tokenom.

1. Na GitHubu: Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Repository access: samo `midnight-crew-site`. Permissions: **Contents: Read and write**.
3. Zalijepi token u CMS (pamti se u tom pregledniku).

Svako spremanje je commit na GitHub, a Cloudflare nakon toga za minutu-dvije objavi promjenu. Lokalno, u Chrome/Edge, može i **Work with Local Repository** (uređuje datoteke na disku, bez tokena).

Sadržaj je u `src/content/` (JSON datoteke), pa se može uređivati i ručno.

## Struktura

- `src/routes/` stranice (`__root.tsx` je HTML okvir, `index.tsx` naslovnica, `shop.tsx` shop s košaricom, `shop_.$productId.tsx` stranica artikla, `garaza.tsx` svi auti, `garaza_.$carId.tsx` stranica auta s fotkama)
- `src/components/` sekcije: `Header`, `Hero`, `MapSection`, `EventsSection`, `ShopSection`, `Footer`
- `src/lib/cart.tsx` košarica (pamti se u pregledniku)
- `src/content/` sadržaj koji se uređuje u CMS-u: `events/`, `products/`, `places/`, `settings.json`
- `src/lib/data.ts` učitava sadržaj i priprema ga za stranicu
- `src/components/overlay/` brzi pregled artikla (`?p=`) i događaja (`?e=`), otvara se na bilo kojoj stranici
- `src/lib/mapStyle.ts` izgled karte (OpenStreetMap, tamna tema), isti za kartu u heroju i sekciju Karta
- `src/lib/routes.json` rute od Livna, puni ih `scripts/fetch-routes.mjs`
- `public/admin/` CMS (Sveltia CMS), `public/images/` fotografije

## Tipkovnica

- `Q` / `E` prebacuju kartice u gornjem izborniku
- `A` / `B` / `X` stišću gumbe koji su trenutno na ekranu (Odaberi, Natrag, Karta; na karti A bira sljedeće odredište, X otvara rutu u Google Mapsu)

## Garaža, Dolazim, kalendar i narudžbe

- **Garaža**: auta ekipe dodaješ u CMS-u (Garaža): ime auta, vlasnik, Instagram, snaga, fotka kao prozirni PNG (auto bez pozadine) i fotke za galeriju. Naslovnica pokazuje prvih 8 auta (po polju Redoslijed); svi auti su na `/garaza` (traženje, pogon, poredak, po 24 auta), a svaki auto ima svoju stranicu `/garaza/<id>` s fotkama.
- **Garažna vrata**: kad se u garažu uđe s druge stranice (izbornik, podnožje, gumb na naslovnici), vrata se spuste, garaža se učita iza njih i vrata se dignu (`src/lib/garageDoor.ts`, `src/components/GarageDoor.tsx`). Unutar garaže (popis ↔ auto) nema vrata. Ako korisnik traži manje animacija, vrata se samo pojave i nestanu.
- **Dolazim**: svaki događaj s datumom i mjestom ima gumb "Dolazim"; prijave se spremaju u Cloudflare D1 bazu (`DB` u `wrangler.jsonc`, tablice se same naprave).
- **Javi se (garaža)**: forma sprema poruke u D1 i šalje mail preko [Resenda](https://resend.com) (besplatan račun): secret `RESEND_API_KEY` i varijabla `MAIL_TO` (mail koji prima poruke; s `onboarding@resend.dev` pošiljateljem radi samo na mail kojim si se registrirao). Isto stiže i na Telegram ako je postavljen.
- **Kalendar**: `/calendar.ics` je pretplatni kalendar svih meetova ("Sinkroniziraj kalendar"), a svaki događaj ima i "U kalendar" (.ics datoteka).
- **Narudžbe**: shop ima obrazac (ime, prezime, broj, adresa; samo BiH, plaćanje pouzećem). Narudžbe (i poruke iz garaže) se spremaju u D1 i vidiš ih u CMS-u (`/admin`, gumb "Narudžbe" dolje desno). U Cloudflareu (Settings → Variables and Secrets) postavi secret `ADMIN_KEY`: lozinka za taj panel. Za obavijesti na Telegram postavi `TELEGRAM_BOT_TOKEN` (od @BotFather) i `TELEGRAM_CHAT_ID`; po želji i `NOTIFY_WEBHOOK` (Discord/Slack).

## Karta

Obje karte (kartica "Novo · Otključano" i sekcija Karta) su [OpenStreetMap](https://www.openstreetmap.org/copyright) u tamnoj temi, preko besplatnih [OpenFreeMap](https://openfreemap.org) pločica (bez API ključa), a rute, kilometri i vrijeme vožnje od Livna su prave rute iz [OSRM](https://project-osrm.org). Karta se pomiče povlačenjem, zumira kotačićem, tipkama `+` / `−` ili strelicama, a na mobitelu s dva prsta.

Novo mjesto dodaješ u CMS-u (Gdje smo bili). `npm run build` prvo pokrene `scripts/fetch-routes.mjs`, koji za nova mjesta dohvati rutu iz OSRM-a i spremi je u `src/lib/routes.json`; dok ruta ne stigne, karta crta ravnu liniju.

## Slike i pregled linkova

- `npm run build` pokrene `scripts/optimize-images.mjs`: za svaku sliku u `public/images` (i one uploadane kroz CMS) napravi manje AVIF i WebP verzije, pa mobitel skida samo onoliko koliko treba.
- `scripts/og-images.mjs` napravi kartice za dijeljenje linka (1200×630) za naslovnicu, shop, svaki događaj i svaki artikl. Kad netko pošalje link na WhatsApp, Instagram, Viber ili Facebook, vidi karticu s naslovom, datumom i mjestom. Link na događaj je `/?e=<id događaja>`.

## Fotografije

Pozadina: Samuele Errico Piccarini, galerija: Donny Jiang (obje s Unsplasha).
