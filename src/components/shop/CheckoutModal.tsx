import { useState, type ReactNode } from 'react'
import { Modal } from '../overlay/Modal'
import { PadPrompt } from '../ui'
import { COUNTRIES, validateOrder, type OrderErrors, type OrderInput } from '~/lib/checkout'
import { PRODUCTS, SETTINGS } from '~/lib/data'
import { useCart } from '~/lib/cart'
import { placeOrder } from '~/lib/orders'

const EMPTY = { firstName: '', lastName: '', phone: '', street: '', city: '', postal: '', country: 'BA', note: '', website: '' }

/** Order form: name, phone, delivery address (Bosnia and Herzegovina only), pay on delivery. */
export function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { lines, total, clear } = useCart()
  const [f, setF] = useState(EMPTY)
  const [errors, setErrors] = useState<OrderErrors>({})
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState('')
  const [done, setDone] = useState<number | null>(null)

  const set = (k: keyof typeof EMPTY) => (v: string) => {
    setF((s) => ({ ...s, [k]: v }))
    if (errors[k as keyof OrderErrors]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const input: OrderInput = { ...f, items: lines.map((l) => ({ id: l.productId, size: l.size, qty: l.qty })) }
    const errs = validateOrder(input)
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setBusy(true)
    setFailed('')
    try {
      const r = await placeOrder({ data: input })
      if ('errors' in r && r.errors) setErrors(r.errors as OrderErrors)
      else if ('id' in r) {
        setDone(r.id)
        clear()
      }
    } catch {
      setFailed('Narudžba nije poslana. Provjeri vezu i pokušaj ponovo.')
    }
    setBusy(false)
  }

  if (done !== null)
    return (
      <Modal label="Narudžba poslana" accent="var(--color-lime)" onClose={onClose} footer={<span />}>
        <div className="px-6 py-10 md:px-10">
          <div className="text-sm font-bold tracking-[.14em] text-lime">NARUDŽBA {done ? `#${done}` : ''} PRIMLJENA</div>
          <h2 className="mt-2 text-[48px] leading-[.9] font-extrabold uppercase italic md:text-[64px]">Hvala!</h2>
          <p className="mt-4 max-w-[48ch] text-xl text-soft">Javit ćemo ti se na {f.phone} oko dostave. Plaćaš pouzećem kad paket stigne.</p>
          <div className="mt-6 flex">
            <PadPrompt pad="a" onClick={onClose}>
              Super
            </PadPrompt>
          </div>
        </div>
      </Modal>
    )

  return (
    <Modal
      label="Narudžba"
      accent="var(--color-lime)"
      onClose={onClose}
      footer={
        <>
          <span className="font-mono text-lg">{total} KM · pouzećem</span>
          <PadPrompt pad="b" onClick={onClose}>
            Natrag
          </PadPrompt>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5 px-5 pt-6 pb-7 md:px-8 md:pt-8">
        <div className="pr-10">
          <div className="text-sm font-bold tracking-[.14em] text-lime">NARUDŽBA</div>
          <h2 className="mt-1 text-[44px] leading-[.9] font-extrabold uppercase italic md:text-[56px]">Tvoji podaci</h2>
        </div>

        <ul className="bg-ink/60 px-4 py-3 text-base text-soft">
          {lines.map((l) => {
            const p = PRODUCTS.find((x) => x.id === l.productId)!
            return (
              <li key={l.productId + l.size} className="flex justify-between gap-3">
                <span>{l.qty}× {p.name}{l.size ? ` (${l.size})` : ''}</span>
                <span className="font-mono">{l.qty * p.price} KM</span>
              </li>
            )
          })}
        </ul>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Ime" error={errors.firstName}>
            <input autoComplete="given-name" value={f.firstName} onChange={(e) => set('firstName')(e.target.value)} className={inp(errors.firstName)} aria-invalid={!!errors.firstName} />
          </Field>
          <Field label="Prezime" error={errors.lastName}>
            <input autoComplete="family-name" value={f.lastName} onChange={(e) => set('lastName')(e.target.value)} className={inp(errors.lastName)} aria-invalid={!!errors.lastName} />
          </Field>
          <Field label="Broj telefona" error={errors.phone} wide>
            <input type="tel" inputMode="tel" autoComplete="tel" placeholder="061 234 567" value={f.phone} onChange={(e) => set('phone')(e.target.value)} className={inp(errors.phone)} aria-invalid={!!errors.phone} />
          </Field>
          <Field label="Ulica i kućni broj" error={errors.street} wide>
            <input autoComplete="street-address" value={f.street} onChange={(e) => set('street')(e.target.value)} className={inp(errors.street)} aria-invalid={!!errors.street} />
          </Field>
          <Field label="Poštanski broj" error={errors.postal}>
            <input inputMode="numeric" autoComplete="postal-code" maxLength={5} placeholder="80101" value={f.postal} onChange={(e) => set('postal')(e.target.value)} className={inp(errors.postal)} aria-invalid={!!errors.postal} />
          </Field>
          <Field label="Mjesto" error={errors.city}>
            <input autoComplete="address-level2" value={f.city} onChange={(e) => set('city')(e.target.value)} className={inp(errors.city)} aria-invalid={!!errors.city} />
          </Field>
          <Field label="Država" error={errors.country} wide>
            <select autoComplete="country" value={f.country} onChange={(e) => set('country')(e.target.value)} className={inp(errors.country)} aria-invalid={!!errors.country}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Napomena (nije obavezno)" wide>
            <textarea rows={2} maxLength={300} value={f.note} onChange={(e) => set('note')(e.target.value)} className={inp()} />
          </Field>
          {/* Honeypot for bots */}
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={(e) => set('website')(e.target.value)} className="absolute -left-[9999px] size-px opacity-0" name="website" />
        </div>

        <p className="text-[15px] leading-snug text-muted">
          {SETTINGS.shipping_note || 'Plaćanje pouzećem. Dostava samo u Bosnu i Hercegovinu.'}
        </p>
        {errors.items && <p role="alert" className="text-base font-semibold text-stop">{errors.items}</p>}
        {failed && <p role="alert" className="text-base font-semibold text-stop">{failed}</p>}

        <button
          type="submit"
          disabled={busy || lines.length === 0}
          className="w-full cursor-pointer bg-lime py-3.5 text-2xl font-extrabold text-ink uppercase italic transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Šaljem…' : `Naruči · ${total} KM`}
        </button>
      </form>
    </Modal>
  )
}

const inp = (err?: string) =>
  `w-full bg-ink/70 px-3.5 py-2.5 text-lg text-white outline-none border-b-[3px] transition-colors focus:border-lime ${err ? 'border-stop' : 'border-white/15'}`

function Field({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? 'md:col-span-2' : ''}`}>
      <span className="text-xs font-bold tracking-[.14em] text-muted uppercase">{label}</span>
      {children}
      {error && <span className="text-sm font-semibold text-stop">{error}</span>}
    </label>
  )
}
