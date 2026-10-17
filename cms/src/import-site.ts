import type { Payload } from 'payload'
import content from './seed-data/content.json' with { type: 'json' }
import { localToIso } from './lib/time'

/** Loads a photo of the site by its path ("/images/garage/x.webp"). Null when it is missing. */
export type FileLoader = (path: string) => Promise<{ data: Buffer; mimetype: string } | null>

const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif' }
export const mimeOf = (path: string) => MIME[path.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream'

/**
 * Load the site content (src/seed-data/content.json) into the CMS.
 * Safe to run again: a record with the same natural key (slug, name, car, file name) is skipped.
 */
export async function importSite(payload: Payload, load: FileLoader) {
  const log: string[] = []
  const media = new Map<string, number | string>()

  /** Upload a photo once and return its media id. */
  async function upload(path?: string) {
    if (!path) return undefined
    if (media.has(path)) return media.get(path)
    const name = path.split('/').pop()!
    const found = await payload.find({ collection: 'media', where: { filename: { equals: name } }, limit: 1, depth: 0 })
    let id = found.docs[0]?.id
    if (!id) {
      const file = await load(path)
      if (!file) {
        log.push(`slika nije nađena: ${path}`)
        return undefined
      }
      const doc = await payload.create({
        collection: 'media',
        data: { alt: '' },
        file: { data: file.data, mimetype: file.mimetype, name, size: file.data.length },
        overrideAccess: true,
      })
      id = doc.id
      log.push(`slika: ${name}`)
    }
    media.set(path, id)
    return id
  }

  async function upsert(collection: 'events' | 'products' | 'places' | 'garage', field: string, value: string, data: Record<string, unknown>) {
    const found = await payload.find({ collection, where: { [field]: { equals: value } }, limit: 1, depth: 0 })
    if (found.docs.length) return
    await payload.create({ collection, data: data as never, overrideAccess: true })
    log.push(`${collection}: ${value}`)
  }

  for (const e of content.events) {
    await upsert('events', 'slug', e.id, {
      title: e.title,
      date: localToIso(e.date),
      place: e.place,
      kind: e.kind,
      description: e.description ?? '',
      image: await upload(e.image),
      slug: e.id,
    })
  }
  for (const p of content.products) {
    await upsert('products', 'slug', p.id, {
      name: p.name,
      price: p.price,
      category: p.category,
      image: await upload(p.image),
      blurb: p.blurb,
      details: p.details ?? [],
      sizes: p.sizes ?? [],
      order: p.order ?? 10,
      slug: p.id,
    })
  }
  for (const p of content.places) {
    await upsert('places', 'name', p.name, { name: p.name, lat: p.lat, lon: p.lon, kind: p.kind, photo: await upload(p.photo) })
  }
  for (const c of content.garage) {
    await upsert('garage', 'car', c.car, {
      car: c.car,
      instagram: c.instagram ?? '',
      image: await upload(c.image),
      order: c.order ?? 10,
      owner: c.owner ?? '',
      year: c.year || undefined,
      hp: c.hp || undefined,
      torque: c.torque || undefined,
      drivetrain: c.drivetrain ?? 'rwd',
      note: c.note ?? '',
    })
  }

  // Globals: fill only when they are still empty.
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  if (!settings.site_url) {
    await payload.updateGlobal({ slug: 'settings', data: content.settings, overrideAccess: true })
    log.push('postavke stranice')
  }
  const garagePage = await payload.findGlobal({ slug: 'garagePage', depth: 0 })
  if (!garagePage.title) {
    await payload.updateGlobal({ slug: 'garagePage', data: content.garagePage, overrideAccess: true })
    log.push('stranica garaža')
  }
  return log
}
