import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { r2Storage } from '@payloadcms/storage-r2'
import { hr } from '@payloadcms/translations/languages/hr'
import { buildConfig } from 'payload'
import { getCloudflareContext, type CloudflareContext } from '@opennextjs/cloudflare'
import type { GetPlatformProxyOptions } from 'wrangler'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Events } from './collections/Events'
import { Products } from './collections/Products'
import { Places } from './collections/Places'
import { Garage } from './collections/Garage'
import { GaragePage, Settings } from './globals'
import { migrations } from './migrations'
import { withRebuildHooks } from './hooks/rebuild'
import { importSite, mimeOf } from './import-site'
import { orderEndpoints, type OrdersDb } from './orders'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

// True for the Payload CLI (migrate, generate:types, run) and for "next build".
const isCLI = process.argv.some((value) => realpath(value)?.endsWith(path.join('payload', 'bin.js')))
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
const isProduction = process.env.NODE_ENV === 'production'

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any // Use PayloadLogger type when it is exported

const cloudflare =
  isCLI || isBuild || !isProduction
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

/** Read a variable from the Cloudflare bindings (.dev.vars locally) or from process.env. */
export const env = (name: string): string | undefined =>
  (cloudflare.env as unknown as Record<string, string | undefined>)[name] ?? process.env[name]

const withHooks = withRebuildHooks(env, [Events, Products, Places, Garage, Media, Users], [Settings, GaragePage])

export const frontendUrl = (env('FRONTEND_URL') || 'https://midnight-crew-site.pop-sites.workers.dev').replace(/\/$/, '')

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    theme: 'dark',
    meta: {
      titleSuffix: ' - Midnight Crew CMS',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }],
    },
    components: {
      graphics: { Logo: '/components/Logo', Icon: '/components/Icon' },
      beforeDashboard: ['/components/Welcome'],
      afterNavLinks: ['/components/OrdersNavLink'],
      views: { orders: { Component: '/components/OrdersView', path: '/narudzbe' } },
    },
    dateFormat: 'dd.MM.yyyy. HH:mm',
    // Event times are always Livno time, whatever the time zone of the computer.
    timezones: {
      supportedTimezones: [{ label: 'Livno (BiH)', value: 'Europe/Sarajevo' }],
      defaultTimezone: 'Europe/Sarajevo',
    },
  },
  i18n: { supportedLanguages: { hr }, fallbackLanguage: 'hr' },
  collections: withHooks.collections,
  globals: withHooks.globals,
  editor: lexicalEditor(),
  secret: env('PAYLOAD_SECRET') || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
    // One migration set for dev and prod. Run "npm run migrate:local" in dev.
    push: false,
    prodMigrations: migrations,
  }),
  logger: isProduction && !isCLI && !isBuild ? cloudflareLogger : undefined,
  plugins: [r2Storage({ bucket: cloudflare.env.R2, collections: { media: true } })],
  endpoints: [
    ...orderEndpoints(() => (cloudflare.env as unknown as { ORDERS?: OrdersDb }).ORDERS),
    {
      // The "Uvezi sadržaj" button on the dashboard. Loads the site content and photos into an empty CMS.
      path: '/import-site',
      method: 'post',
      handler: async (req) => {
        if ((req.user as { role?: string } | null)?.role !== 'admin') {
          return Response.json({ error: 'Samo admin može uvesti sadržaj.' }, { status: 403 })
        }
        const done = await importSite(req.payload, async (p) => {
          const res = await fetch(`${frontendUrl}${p}`)
          if (!res.ok) return null
          return { data: Buffer.from(await res.arrayBuffer()), mimetype: res.headers.get('content-type')?.split(';')[0] || mimeOf(p) }
        })
        return Response.json({ done })
      },
    },
  ],
})

// Adapted from OpenNext cloudflare-context.ts. The "wrangler" library gives the local D1 and R2.
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        // Explicit, so a .wrangler folder of the site build one level up is never used.
        configPath: path.resolve(process.cwd(), 'wrangler.jsonc'),
        // Remote bindings only for CLI work in production (for example the remote migration).
        remoteBindings: isProduction && !isBuild,
      } satisfies GetPlatformProxyOptions),
  )
}
