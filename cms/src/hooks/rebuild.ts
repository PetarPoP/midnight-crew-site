import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  GlobalAfterChangeHook,
  GlobalConfig,
} from 'payload'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// Rebuild hook. A public change in the CMS calls a deploy hook, and the site is built again.
// The call is debounced (trailing) and does not block the admin save.
// If REBUILD_WEBHOOK_URL is not set, the hook does nothing.

/** Wait time after the last change, in ms. Keep it below 30 s: a Worker lets waitUntil run for 30 s only. */
const DEBOUNCE_MS = Number(process.env.REBUILD_DEBOUNCE_MS) || 25_000

/** The collections and globals that the public site shows. */
export const REBUILD_COLLECTIONS = ['events', 'products', 'places', 'garage']
export const REBUILD_GLOBALS = ['settings', 'garagePage']

type EnvReader = (name: string) => string | undefined
type State = { lastChange: number; running: boolean; reasons: Set<string> }
const g = globalThis as { __mcRebuild?: State }
const state = (): State => (g.__mcRebuild ??= { lastChange: 0, running: false, reasons: new Set() })

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Keep the work running after the response. In a Worker use waitUntil. In dev the promise runs alone. */
function keepAlive(work: Promise<unknown>) {
  try {
    getCloudflareContext().ctx.waitUntil(work)
  } catch {
    // No Cloudflare context (local dev): the Node process stays alive.
  }
}

async function run(url: string, env: EnvReader) {
  const s = state()
  // Trailing debounce: wait until no change came for DEBOUNCE_MS.
  while (Date.now() - s.lastChange < DEBOUNCE_MS) await sleep(Math.max(250, DEBOUNCE_MS - (Date.now() - s.lastChange)))
  const reasons = [...s.reasons].join(', ')
  s.reasons.clear()
  s.running = false
  try {
    // A GitHub repository_dispatch URL needs a token and an event type. A deploy hook needs neither.
    const token = env('REBUILD_WEBHOOK_TOKEN')
    const github = url.startsWith('https://api.github.com/')
    const headers: Record<string, string> = { 'content-type': 'application/json', 'user-agent': 'midnight-crew-cms' }
    if (token) headers.authorization = `Bearer ${token}`
    if (github) headers.accept = 'application/vnd.github+json'
    const body = github ? { event_type: 'cms-publish', client_payload: { changed: reasons } } : { source: 'midnight-crew-cms', changed: reasons }
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    if (!res.ok) console.warn(`[rebuild] webhook answered ${res.status}`)
  } catch (error) {
    console.warn('[rebuild] webhook failed', error)
  }
}

/** Ask for a rebuild. Many calls in a short time make one webhook call. */
export function requestRebuild(env: EnvReader, reason: string) {
  const url = env('REBUILD_WEBHOOK_URL')
  if (!url) return
  const s = state()
  s.lastChange = Date.now()
  s.reasons.add(reason)
  if (s.running) return
  s.running = true
  keepAlive(run(url, env))
}

const isPublished = (doc: unknown) => (doc as { _status?: string } | null)?._status === 'published'
const isDraftSave = (req: { query?: Record<string, unknown> }) => Boolean(req.query?.draft || req.query?.autosave)

export function rebuildHooks(env: EnvReader) {
  const afterChange: CollectionAfterChangeHook = ({ collection, doc, previousDoc, req }) => {
    const versioned = Boolean(collection.versions)
    if (versioned) {
      // A draft save does not change the public site. A publish or an unpublish does.
      if (isDraftSave(req)) return doc
      if (!isPublished(doc) && !isPublished(previousDoc)) return doc
    }
    requestRebuild(env, collection.slug)
    return doc
  }
  const afterDelete: CollectionAfterDeleteHook = ({ collection, doc }) => {
    if (collection.versions && !isPublished(doc)) return doc
    requestRebuild(env, collection.slug)
    return doc
  }
  const afterGlobalChange: GlobalAfterChangeHook = ({ global, doc }) => {
    requestRebuild(env, global.slug)
    return doc
  }
  return { afterChange, afterDelete, afterGlobalChange }
}

/** Add the rebuild hooks to the public collections and globals. */
export function withRebuildHooks(
  env: EnvReader,
  collections: CollectionConfig[],
  globals: GlobalConfig[],
): { collections: CollectionConfig[]; globals: GlobalConfig[] } {
  const h = rebuildHooks(env)
  return {
    collections: collections.map((c) =>
      REBUILD_COLLECTIONS.includes(c.slug)
        ? { ...c, hooks: { ...c.hooks, afterChange: [...(c.hooks?.afterChange ?? []), h.afterChange], afterDelete: [...(c.hooks?.afterDelete ?? []), h.afterDelete] } }
        : c,
    ),
    globals: globals.map((gl) =>
      REBUILD_GLOBALS.includes(gl.slug)
        ? { ...gl, hooks: { ...gl.hooks, afterChange: [...(gl.hooks?.afterChange ?? []), h.afterGlobalChange] } }
        : gl,
    ),
  }
}
