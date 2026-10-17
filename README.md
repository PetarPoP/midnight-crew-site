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

Stranica je na Cloudflare Workers, spojena preko GitHuba: svaki push na `main` automatski se builda i objavi. Postavke Workera su u `wrangler.jsonc`. Ručni deploy: `npm run deploy`.

## Uređivanje sadržaja (CMS)

CMS je zasebna aplikacija u mapi `cms/` ([Payload CMS](https://payloadcms.com) na Cloudflare Workers, s D1 bazom i R2 za slike), isto kao fesb-racing-cms. Admin je na https://midnight-crew-cms.pop-sites.workers.dev/admin (i `/admin` na stranici vodi tamo). Prijava je e-mail i lozinka; prvi korisnik koji se registrira postaje admin, a ostale (urednike) dodaje admin pod Postavke → Korisnici.

U CMS-u se uređuju događaji, shop, mjesta na karti, garaža, postavke stranice i tekstovi stranice Garaža. Slike se uploadaju izravno u CMS. Pod "Narudžbe i poruke" su narudžbe iz shopa i poruke "Tvoj auto? Javi se" (čitaju se iz D1 baze stranice, status narudžbe se mijenja tamo).

Kako promjena dođe na stranicu:

1. Spremiš u CMS-u.
2. CMS pozove Deploy Hook stranice (secret `REBUILD_WEBHOOK_URL` na CMS Workeru), 25 s nakon zadnje promjene, pa više promjena zaredom napravi samo jedan build.
3. `npm run build` prvo pokrene `scripts/fetch-cms.mjs`: povuče sav sadržaj iz CMS-a u `src/content/` i slike u `public/images/cms/`, pa se stranica napravi s tim.
4. Za 2 do 4 minute promjena je live.

Ako CMS nije dostupan ili je još prazan, build koristi JSON koji je već u `src/content/` (zadnja kopija), pa stranica nikad ne padne zbog CMS-a. Lokalno: `npm run cms:pull` povuče sadržaj s live CMS-a (`CMS_URL=http://localhost:3100` za lokalni). Postavljanje i lokalni rad s CMS-om: [`cms/README.md`](cms/README.md).

## Struktura

- `src/routes/` stranice (`__root.tsx` je HTML okvir, `index.tsx` naslovnica, `shop.tsx` shop s košaricom, `shop_.$productId.tsx` stranica artikla)
- `src/components/` sekcije: `Header`, `Hero`, `MapSection`, `EventsSection`, `ShopSection`, `Footer`
- `src/lib/cart.tsx` košarica (pamti se u pregledniku)
- `src/content/` zadnja kopija sadržaja iz CMS-a (`events/`, `products/`, `places/`, `garage/`, `settings.json`, `garage-page.json`); build je osvježi iz CMS-a
- `cms/` CMS (Payload, zaseban Cloudflare Worker `midnight-crew-cms`)
- `src/lib/data.ts` učitava sadržaj i priprema ga za stranicu
- `src/components/overlay/` brzi pregled artikla (`?p=`) i događaja (`?e=`), otvara se na bilo kojoj stranici
- `src/lib/mapStyle.ts` izgled karte (OpenStreetMap, tamna tema), isti za kartu u heroju i sekciju Karta
- `src/lib/routes.json` rute od Livna, puni ih `scripts/fetch-routes.mjs`
- `public/images/` fotografije

## Tipkovnica

- `Q` / `E` prebacuju kartice u gornjem izborniku
- `A` / `B` / `X` stišću gumbe koji su trenutno na ekranu (Odaberi, Natrag, Karta; na karti A bira sljedeće odredište, X otvara rutu u Google Mapsu)

## Garaža, Dolazim, kalendar i narudžbe

- **Garaža**: stranica `/garaza` (na naslovnoj je samo traka "Uđi u garažu", ulazi se kroz animaciju garažnih vrata). Auta dodaješ u CMS-u (Garaža): ime auta, Instagram i fotka (najbolje PNG bez pozadine). Svaki auto dobije svoj boks; vrata se dignu mišem ili tapom, a klik vodi na Instagram vlasnika. Tri demo auta ("Demo: ...") obriši u CMS-u kad dodaš prave. Tekstove na stranici (naslov, gumb, tražilica, pločica "Tvoj auto?") i animaciju vrata mijenjaš u CMS-u pod Postavke → Stranica Garaža.
- **Dolazim**: svaki događaj s datumom i mjestom ima gumb "Dolazim"; prijave se spremaju u Cloudflare D1 bazu (`DB` u `wrangler.jsonc`, tablice se same naprave).
- **Javi se (garaža)**: forma sprema poruke u D1 i šalje mail preko [Resenda](https://resend.com) (besplatan račun): secret `RESEND_API_KEY` i varijabla `MAIL_TO` (mail koji prima poruke; s `onboarding@resend.dev` pošiljateljem radi samo na mail kojim si se registrirao). Isto stiže i na Telegram ako je postavljen.
- **Kalendar**: `/calendar.ics` je pretplatni kalendar svih meetova ("Sinkroniziraj kalendar"), a svaki događaj ima i "U kalendar" (.ics datoteka).
- **Narudžbe**: shop ima obrazac (ime, prezime, broj, adresa; samo BiH, plaćanje pouzećem). Narudžbe (i poruke iz garaže) se spremaju u D1 i vidiš ih u CMS-u pod "Narudžbe i poruke". Za obavijesti na Telegram postavi `TELEGRAM_BOT_TOKEN` (od @BotFather) i `TELEGRAM_CHAT_ID`; po želji i `NOTIFY_WEBHOOK` (Discord/Slack).

## Karta

Obje karte (kartica "Novo · Otključano" i sekcija Karta) su [OpenStreetMap](https://www.openstreetmap.org/copyright) u tamnoj temi, preko besplatnih [OpenFreeMap](https://openfreemap.org) pločica (bez API ključa), a rute, kilometri i vrijeme vožnje od Livna su prave rute iz [OSRM](https://project-osrm.org). Karta se pomiče povlačenjem, zumira kotačićem, tipkama `+` / `−` ili strelicama, a na mobitelu s dva prsta.

Novo mjesto dodaješ u CMS-u (Gdje smo bili). `npm run build` prvo pokrene `scripts/fetch-routes.mjs`, koji za nova mjesta dohvati rutu iz OSRM-a i spremi je u `src/lib/routes.json`; dok ruta ne stigne, karta crta ravnu liniju.

## Slike i pregled linkova

- `npm run build` pokrene `scripts/optimize-images.mjs`: za svaku sliku u `public/images` (i one povučene iz CMS-a) napravi manje AVIF i WebP verzije, pa mobitel skida samo onoliko koliko treba.
- `scripts/og-images.mjs` napravi kartice za dijeljenje linka (1200×630) za naslovnicu, shop, svaki događaj i svaki artikl. Kad netko pošalje link na WhatsApp, Instagram, Viber ili Facebook, vidi karticu s naslovom, datumom i mjestom. Link na događaj je `/?e=<id događaja>`.

## Fotografije

Pozadina: Samuele Errico Piccarini, galerija: Donny Jiang (obje s Unsplasha).
