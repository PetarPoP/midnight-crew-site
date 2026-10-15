import { productById } from './data'

export const COUNTRIES = [
  { code: 'BA', label: 'Bosna i Hercegovina' },
  { code: 'HR', label: 'Hrvatska' },
  { code: 'RS', label: 'Srbija' },
  { code: 'ME', label: 'Crna Gora' },
  { code: 'XX', label: 'Druga država' },
] as const

export type OrderInput = {
  firstName: string
  lastName: string
  phone: string
  street: string
  city: string
  postal: string
  country: string
  note: string
  items: { id: string; size: string | null; qty: number }[]
  /** Honeypot: real people leave it empty. */
  website?: string
}

export type OrderErrors = Partial<Record<'firstName' | 'lastName' | 'phone' | 'street' | 'city' | 'postal' | 'country' | 'items', string>>

/** "061 234 567", "+387 61 234 567", "0038761234567" -> "+38761234567". */
export function normalizePhone(raw: string) {
  const s = raw.replace(/[\s\-./()]/g, '')
  if (s.startsWith('+387')) return s
  if (s.startsWith('00387')) return '+' + s.slice(2)
  if (s.startsWith('0')) return '+387' + s.slice(1)
  return s
}

const NAME = /^[\p{L}][\p{L} '’.-]{1,39}$/u

/**
 * Checks an order. Delivery is only to Bosnia and Herzegovina, so the country
 * must be BiH, the postal code a BiH one (5 digits, 7xxxx or 8xxxx) and the
 * phone number a BiH number. Runs in the browser for instant feedback and again
 * on the server, which is the one that counts.
 */
export function validateOrder(o: OrderInput): OrderErrors {
  const e: OrderErrors = {}
  const t = (s: string) => s.trim()
  if (!NAME.test(t(o.firstName))) e.firstName = 'Upiši ime.'
  if (!NAME.test(t(o.lastName))) e.lastName = 'Upiši prezime.'

  const phone = normalizePhone(o.phone)
  if (!/^\+387[3-6]\d{7,8}$/.test(phone)) e.phone = 'Upiši broj iz BiH, npr. 061 234 567 ili +387 61 234 567.'

  if (o.country !== 'BA') e.country = 'Dostava je moguća samo u Bosnu i Hercegovinu.'
  if (!/^[78]\d{4}$/.test(t(o.postal))) e.postal = 'Poštanski broj u BiH ima 5 znamenki i počinje sa 7 ili 8 (npr. 80101).'
  if (t(o.street).length < 4 || t(o.street).length > 80 || !/\d/.test(t(o.street))) e.street = 'Upiši ulicu i kućni broj.'
  if (!/^[\p{L}][\p{L} '’.()-]{1,49}$/u.test(t(o.city))) e.city = 'Upiši mjesto.'

  if (!o.items.length || o.items.length > 20) e.items = 'Košarica je prazna.'
  for (const it of o.items) {
    const p = productById(it.id)
    const okSize = p && (p.sizes.length ? it.size !== null && p.sizes.includes(it.size) : it.size === null)
    if (!p || !okSize || !Number.isInteger(it.qty) || it.qty < 1 || it.qty > 10) e.items = 'Neki artikl u košarici više nije dostupan. Osvježi stranicu.'
  }
  return e
}

export const orderTotal = (items: OrderInput['items']) => items.reduce((a, it) => a + it.qty * (productById(it.id)?.price ?? 0), 0)
