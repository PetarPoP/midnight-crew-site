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

- `src/routes/` stranice (`__root.tsx` je HTML okvir, `index.tsx` naslovnica)
- `src/components/` sekcije: `Hero`, `MapSection`, `EventsSection`, `ShopSection`, `Footer`
- `src/lib/data.ts` događaji, odredišta, proizvodi i Instagram link, sve na jednom mjestu
- `src/components/mapSvg.ts` podloga karte (obala, teren, ceste)
- `public/images/` fotografije

Događaje, cijene i odredišta mijenjaš u `src/lib/data.ts`. Fotke proizvoda još nedostaju, mjesta za njih su u `ShopSection.tsx`.

## Tipkovnica

`Q` i `E` prebacuju između kartica u gornjem izborniku.

## Fotografije

Pozadina: Samuele Errico Piccarini, galerija: Donny Jiang (obje s Unsplasha).
