/**
 * Idempotent seed script. Run it with: npm run seed
 * It uses the same local D1 and R2 emulation as "npm run dev" (.wrangler/state).
 * It makes the first admin user and loads the site content (see import-site.ts).
 * Photos come from ../public of the site.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config, { env } from './payload.config'
import { importSite, mimeOf } from './import-site'

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public')
const log = (msg: string) => console.log(`[seed] ${msg}`)

const payload = await getPayload({ config })

const email = env('SEED_ADMIN_EMAIL')
const password = env('SEED_ADMIN_PASSWORD')
if (email && password) {
  const { totalDocs } = await payload.count({ collection: 'users', where: { email: { equals: email } } })
  if (!totalDocs) {
    await payload.create({ collection: 'users', data: { email, password, name: 'Admin', role: 'admin' }, overrideAccess: true })
    log(`user: ${email}`)
  }
} else {
  log('SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD is empty: no user made. Make the first user in /admin.')
}

const done = await importSite(payload, async (p) => {
  const file = path.join(publicDir, p)
  return fs.existsSync(file) ? { data: fs.readFileSync(file), mimetype: mimeOf(p) } : null
})
done.forEach(log)
log(done.length ? 'done' : 'nothing new')
process.exit(0)
