# Midnight Crew

Web stranica za Midnight Crew iz Livna, u stilu festivalskog menija iz igrica: koso postavljene pločice, kartica s tipkama Q/E, interaktivna karta odredišta, događaji i shop.

Napravljeno s [TanStack Start](https://tanstack.com/start) i [Tailwind CSS](https://tailwindcss.com) v4.

## Pokretanje

```bash
npm install
npm run dev        # http://localhost:3000
```

Produkcija:

```bash
npm run build
npm run preview
```

## Struktura

- `src/routes/` stranice (`__root.tsx` je HTML okvir, `index.tsx` naslovnica, `shop.tsx` shop s košaricom, `shop_.$productId.tsx` stranica artikla)
- `src/components/` sekcije: `Header`, `Hero`, `MapSection`, `EventsSection`, `ShopSection`, `Footer`
- `src/lib/cart.tsx` košarica (pamti se u pregledniku)
- `src/lib/data.ts` događaji, odredišta, proizvodi i Instagram link, sve na jednom mjestu
- `src/lib/mapData.ts` podloga karte i rute, generirano skriptom `scripts/build-map.py`
- `public/images/` fotografije

Događaje, cijene i odredišta mijenjaš u `src/lib/data.ts`. Fotke proizvoda još nedostaju, mjesta za njih su u `ShopSection.tsx`.

## Tipkovnica

- `Q` / `E` prebacuju kartice u gornjem izborniku
- `A` / `B` / `X` stišću gumbe koji su trenutno na ekranu (Odaberi, Natrag, Karta; na karti A bira sljedeće odredište, X otvara rutu u Google Mapsu)

Narudžba iz shopa kopira popis u clipboard i otvara poruku na Instagramu.

## Karta

Karta je napravljena iz pravih podataka: obala, granice, rijeke, jezera i ceste su iz [Natural Earth](https://www.naturalearthdata.com) (1:10m), a rute, kilometri i vrijeme vožnje od Livna su prave rute iz [OSRM](https://project-osrm.org) (`scripts/routes.json`). Karta se pomiče povlačenjem, zumira kotačićem, tipkama `+` / `−` ili strelicama, a na mobitelu s dva prsta.

Za novo odredište dodaj ga u `PLACE_DATA` u `src/lib/data.ts`, dodaj njegovu rutu u `scripts/routes.json` i ponovno pokreni:

```bash
pip install shapely
python3 scripts/build-map.py <mapa s Natural Earth geojson datotekama>
```

## Fotografije

Pozadina: Samuele Errico Piccarini, galerija: Donny Jiang (obje s Unsplasha).
