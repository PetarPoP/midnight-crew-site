import { INSTAGRAM_URL } from '~/lib/data'

const CREDITS = [
  { name: 'Samuele Errico Piccarini', href: 'https://unsplash.com/@samuele_piccarini' },
  { name: 'Donny Jiang', href: 'https://unsplash.com/@dotnny' },
]

export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-8 text-base font-semibold text-muted md:px-12">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-pink text-base font-extrabold text-white italic">MC</span>
        <span>
          Midnight Crew · Livno ·{' '}
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-white hover:text-lime">
            @midnight_crew_livno
          </a>
        </span>
      </div>
      <div className="font-sans text-xs text-white/40">
        Fotografije:{' '}
        {CREDITS.map((c, i) => (
          <span key={c.name}>
            {i > 0 && ', '}
            <a href={c.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              {c.name}
            </a>
          </span>
        ))}{' '}
        / Unsplash
      </div>
    </footer>
  )
}
