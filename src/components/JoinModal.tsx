import { useState } from 'react'
import { Modal } from './overlay/Modal'
import { PadPrompt } from './ui'
import { sendJoin } from '~/lib/contact'

const inp = 'w-full bg-ink/70 px-3.5 py-2.5 text-lg text-white outline-none border-b-[3px] border-white/15 transition-colors focus:border-lime'

/** "Tvoj auto? Javi se": a short form that goes to the crew's mail. */
export function JoinModal({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({ name: '', instagram: '', car: '', message: '', website: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }))

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (f.name.trim().length < 2 || f.car.trim().length < 2) return setErr('Upiši ime i auto.')
    setBusy(true)
    setErr('')
    try {
      const r = await sendJoin({ data: f })
      if (r.ok) setDone(true)
      else setErr(('error' in r && r.error) || 'Nešto je pošlo po zlu.')
    } catch {
      setErr('Poruka nije poslana. Provjeri vezu i pokušaj ponovo.')
    }
    setBusy(false)
  }

  return (
    <Modal
      label="Javi se"
      accent="var(--color-pink)"
      onClose={onClose}
      footer={
        <>
          <span />
          <PadPrompt pad="b" onClick={onClose}>
            {done ? 'Zatvori' : 'Natrag'}
          </PadPrompt>
        </>
      }
    >
      {done ? (
        <div className="px-6 py-10 md:px-10">
          <div className="text-sm font-bold tracking-[.14em] text-lime">POSLANO</div>
          <h2 className="mt-2 text-[48px] leading-[.9] font-extrabold uppercase italic md:text-[60px]">Hvala!</h2>
          <p className="mt-4 max-w-[48ch] text-xl text-soft">Javit ćemo ti se, najčešće preko Instagrama.</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4 px-5 pt-6 pb-7 md:px-8 md:pt-8">
          <div className="pr-10">
            <div className="text-sm font-bold tracking-[.14em] text-pink">GARAŽA</div>
            <h2 className="mt-1 text-[44px] leading-[.9] font-extrabold uppercase italic md:text-[56px]">Tvoj auto?</h2>
            <p className="mt-2 text-lg text-soft">Javi se i uđi u garažu ekipe.</p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold tracking-[.14em] text-muted uppercase">Ime</span>
            <input autoComplete="name" value={f.name} onChange={set('name')} className={inp} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold tracking-[.14em] text-muted uppercase">Instagram</span>
            <input placeholder="@tvoj_profil" value={f.instagram} onChange={set('instagram')} className={inp} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold tracking-[.14em] text-muted uppercase">Auto (marka, model, godina)</span>
            <input value={f.car} onChange={set('car')} className={inp} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold tracking-[.14em] text-muted uppercase">Poruka (nije obavezno)</span>
            <textarea rows={3} maxLength={600} value={f.message} onChange={set('message')} className={inp} />
          </label>
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} className="absolute -left-[9999px] size-px opacity-0" name="website" />
          {err && <p role="alert" className="text-base font-semibold text-stop">{err}</p>}
          <button disabled={busy} className="w-full cursor-pointer bg-pink py-3.5 text-2xl font-extrabold text-white uppercase italic transition hover:brightness-110 active:scale-95 disabled:opacity-50">
            {busy ? 'Šaljem…' : 'Pošalji'}
          </button>
        </form>
      )}
    </Modal>
  )
}
