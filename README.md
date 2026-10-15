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

- `src/routes/` stranice (`__root.tsx` je HTML okvir, `index.tsx` naslovnica, `shop.tsx` shop s košaricom, `shop_.$productId.tsx` stranica artikla)
- `src/components/` sekcije: `Header`, `Hero`, `MapSection`, `EventsSection`, `ShopSection`, `Footer`
- `src/lib/cart.tsx` košarica (pamti se u pregledniku)
- `src/content/` sadržaj koji se uređuje u CMS-u: `events/`, `products/`, `places/`, `settings.json`
- `src/lib/data.ts` učitava sadržaj i priprema ga za stranicu
- `src/components/overlay/` brzi pregled artikla (`?p=`) i događaja (`?e=`), otvara se na bilo kojoj stranici
- `src/lib/mapData.ts` podloga karte, generirano skriptom `scripts/build-map.py`
- `src/lib/routes.json` rute od Livna, puni ih `scripts/fetch-routes.mjs`
- `public/admin/` CMS (Sveltia CMS), `public/images/` fotografije

## Tipkovnica

- `Q` / `E` prebacuju kartice u gornjem izborniku
- `A` / `B` / `X` stišću gumbe koji su trenutno na ekranu (Odaberi, Natrag, Karta; na karti A bira sljedeće odredište, X otvara rutu u Google Mapsu)

Narudžba iz shopa kopira popis u clipboard i otvara poruku na Instagramu.

## Karta

Karta je napravljena iz pravih podataka: obala, granice, rijeke, jezera i ceste su iz [Natural Earth](https://www.naturalearthdata.com) (1:10m), a rute, kilometri i vrijeme vožnje od Livna su prave rute iz [OSRM](https://project-osrm.org). Karta se pomiče povlačenjem, zumira kotačićem, tipkama `+` / `−` ili strelicama, a na mobitelu s dva prsta.

Novo mjesto dodaješ u CMS-u (Gdje smo bili). `npm run build` prvo pokrene `scripts/fetch-routes.mjs`, koji za nova mjesta dohvati rutu iz OSRM-a i spremi je u `src/lib/routes.json`; dok ruta ne stigne, karta crta ravnu liniju.

Podloga karte se ponovno generira samo ako mijenjaš područje karte:

```bash
pip install shapely
python3 scripts/build-map.py <mapa s Natural Earth geojson datotekama>
```

## Fotografije

Pozadina: Samuele Errico Piccarini, galerija: Donny Jiang (obje s Unsplasha).
