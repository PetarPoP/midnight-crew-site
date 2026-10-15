import { KIND_COLOR, INSTAGRAM_URL, type CrewEvent } from '~/lib/data'
import { useCountdown } from '~/lib/useCountdown'
import { PadPrompt } from '../ui'
import { Modal, ShareButton } from './Modal'

/** Event details in a centred dialog, opened from an event card or ?e=<id>. */
export function EventQuickView({ event: e, onClose }: { event: CrewEvent; onClose: () => void }) {
  const cd = useCountdown(e.iso)
  const past = cd.d === '00' && cd.h === '00' && cd.m === '00' && cd.s === '00'
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.place.split('→').pop()!.trim())}`
  const accent = KIND_COLOR[e.k]

  return (
    <Modal
      label={e.title}
      accent={accent}
      onClose={onClose}
      footer={
        <>
          <div className="flex items-center gap-2">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="fh-wipe px-3 py-1.5 font-extrabold italic">
              Karta →
            </a>
            <ShareButton path={`/?e=${e.id}`} title={`${e.title} · Midnight Crew`} />
          </div>
          <PadPrompt pad="b" onClick={onClose}>
            Zatvori
          </PadPrompt>
        </>
      }
    >
      <div className={e.image ? 'grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]' : ''}>
        {e.image && (
          <div className="bg-panel-2">
            <img src={e.image} alt="" className="aspect-[16/11] size-full object-cover md:aspect-auto" />
          </div>
        )}
        <div className="flex flex-col gap-6 px-5 pt-6 pb-7 md:px-8 md:pt-8">
          <div className="pr-10">
            <div className="text-sm font-bold tracking-[.14em] uppercase" style={{ color: accent }}>
              {e.tag} · Događaj
            </div>
            <h2 className="mt-2 text-[48px] leading-[.88] font-extrabold uppercase italic md:text-[64px]">{e.title}</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Fact label={e.weekday} value={e.date} accent={accent} />
            <Fact label="Početak" value={e.time} />
            <Fact label="Mjesto" value={e.place} wide />
          </div>

          {e.description && <p className="max-w-[60ch] text-xl leading-snug text-soft">{e.description}</p>}

          <div className="-skew-x-6 bg-ink/70 px-5 py-4 shadow-[inset_4px_0_0_var(--color-lime)]">
            <div className="skew-x-6">
              <div className="text-sm font-bold tracking-[.14em] text-lime">{past ? 'U TIJEKU' : 'KREĆEMO ZA'}</div>
              <div className="mt-1 font-mono text-[34px] leading-none tabular-nums md:text-[42px]">
                {cd.d}d {cd.h}:{cd.m}:{cd.s}
              </div>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-base font-semibold text-muted underline-offset-4 hover:text-white hover:underline"
              >
                Točna lokacija na Instagramu 2h prije
              </a>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function Fact({ label, value, accent, wide = false }: { label: string; value: string; accent?: string; wide?: boolean }) {
  return (
    <div className={`-skew-x-6 bg-panel-2 px-4 py-2.5 ${wide ? 'min-w-0 flex-1 basis-56' : ''}`}>
      <div className="skew-x-6">
        <div className="text-xs font-bold tracking-[.14em] text-muted uppercase">{label}</div>
        <div className="text-[28px] leading-none font-extrabold uppercase italic" style={accent ? { color: accent } : undefined}>
          {value}
        </div>
      </div>
    </div>
  )
}
