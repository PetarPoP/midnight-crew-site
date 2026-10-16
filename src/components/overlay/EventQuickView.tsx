import { CalendarPlus, Check, MapPin, Plus } from 'lucide-react'
import { KIND_COLOR, INSTAGRAM_URL, type CrewEvent } from '~/lib/data'
import { useEffect, useState } from 'react'
import { downloadIcs } from '~/lib/ics'
import { loadRsvps, rsvpOpen, toggleRsvp, useRsvp } from '~/lib/rsvp'
import { useCountdown } from '~/lib/useCountdown'
import { PadPrompt, Place } from '../ui'
import { MENU_ITEM, Modal, MoreMenu, ShareButton, openOnDesktop } from './Modal'

/** Event details in a centred dialog, opened from an event card or ?e=<id>. */
export function EventQuickView({ event: e, onClose }: { event: CrewEvent; onClose: () => void }) {
  const cd = useCountdown(e.iso)
  const past = cd.d === '00' && cd.h === '00' && cd.m === '00' && cd.s === '00'
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.place.split('→').pop()!.trim())}`
  const accent = KIND_COLOR[e.k]
  const { count, going } = useRsvp(e.id)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    loadRsvps([e.id])
  }, [e.id])
  const open = rsvpOpen(e)
  const rsvp = async () => {
    setBusy(true)
    setErr((await toggleRsvp(e.id)) ?? '')
    setBusy(false)
  }

  return (
    <Modal
      label={e.title}
      accent={accent}
      onClose={onClose}
      footer={
        <>
          <MoreMenu>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={MENU_ITEM}>
              <MapPin size={20} strokeWidth={2.5} aria-hidden="true" className="shrink-0" />
              Karta
            </a>
            <button type="button" onClick={() => downloadIcs(e)} className={MENU_ITEM}>
              <CalendarPlus size={20} strokeWidth={2.5} aria-hidden="true" className="shrink-0" />
              U kalendar
            </button>
            <ShareButton path={`/?e=${e.id}`} title={`${e.title} · Midnight Crew`} className={MENU_ITEM} />
          </MoreMenu>
          <PadPrompt pad="b" onClick={onClose}>
            Zatvori
          </PadPrompt>
        </>
      }
    >
      {e.image && <img src={e.image} alt="" className="aspect-[16/7] w-full object-cover" />}
      <div className="flex flex-col gap-4 px-5 pt-5 pb-5 md:px-8 md:pt-7">
        <div className="pr-10">
          <div className="text-sm font-bold tracking-[.14em] uppercase" style={{ color: accent }}>
            {e.tag}
          </div>
          <h2 className="mt-1 text-[40px] leading-[.88] font-extrabold uppercase italic md:text-[52px]">{e.title}</h2>
        </div>

        {/* When, where and how long until it starts, in one row */}
        <div className="flex flex-wrap items-stretch gap-2">
          <Fact label={e.weekday} value={`${e.date} · ${e.time}`} accent={accent} />
          <Fact label="Mjesto" value={<Place name={e.place} />} wide />
          <Fact label={past ? 'U tijeku' : 'Krećemo za'} value={`${cd.d}d ${cd.h}:${cd.m}:${cd.s}`} mono />
        </div>

        {open && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              disabled={busy}
              aria-pressed={going}
              onClick={rsvp}
              className={`flex cursor-pointer items-center gap-3 px-5 py-2.5 text-xl font-extrabold uppercase italic transition active:scale-95 disabled:opacity-60 ${going ? 'bg-lime text-ink' : 'bg-go text-ink hover:brightness-110'}`}
            >
              <span aria-hidden="true" className="pad-glyph flex size-[28px] items-center justify-center rounded-full bg-ink text-base text-white not-italic">
                {going ? <Check size={18} strokeWidth={3.5} /> : 'A'}
              </span>
              {going ? 'Dolaziš' : 'Dolazim'}
            </button>
            <span className="text-base font-bold text-soft">
              {count === 0 ? 'Budi prvi koji dolazi' : `${count} ${count === 1 ? 'osoba dolazi' : 'ljudi dolazi'}`}
            </span>
            {err && <span role="alert" className="w-full text-base font-semibold text-stop">{err}</span>}
          </div>
        )}

        <details ref={openOnDesktop} className="group border-t border-white/10 pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold tracking-[.12em] text-muted uppercase hover:text-white">
            Više o događaju
            <Plus size={20} strokeWidth={3} aria-hidden="true" className="transition-transform group-open:rotate-45" />
          </summary>
          <div className="mt-3 flex flex-col gap-2 text-lg leading-snug text-soft">
            {e.description && <p className="max-w-[60ch]">{e.description}</p>}
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-muted underline-offset-4 hover:text-white hover:underline">
              Točna lokacija na Instagramu 2h prije
            </a>
          </div>
        </details>
      </div>
    </Modal>
  )
}

function Fact({ label, value, accent, wide = false, mono = false }: { label: string; value: React.ReactNode; accent?: string; wide?: boolean; mono?: boolean }) {
  return (
    <div className={`-skew-x-6 bg-panel-2 px-3.5 py-2 ${wide ? 'min-w-0 flex-1 basis-40' : ''}`}>
      <div className="skew-x-6">
        <div className="text-[11px] font-bold tracking-[.14em] text-muted uppercase">{label}</div>
        <div
          className={`truncate leading-none font-extrabold ${mono ? 'font-mono text-[22px] tabular-nums' : 'text-[22px] uppercase italic'}`}
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </div>
      </div>
    </div>
  )
}
