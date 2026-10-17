// Patch for the OpenNext "@next/env" shim.
// payload/dist/bin/loadEnv.js (pulled in by @payloadcms/drizzle) does "import nextEnv from '@next/env'".
// The shim has only a named export, so the esbuild step fails. Add a default export.
// The script is safe to run many times.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = path.join(root, 'node_modules/@opennextjs/cloudflare/dist/cli/templates/shims/env.js')
if (!fs.existsSync(file)) process.exit(0)
const text = fs.readFileSync(file, 'utf8')
if (!text.includes('export default')) {
  fs.writeFileSync(
    file,
    `${text.trimEnd()}\nexport default { loadEnvConfig, loadedEnvFiles: [] };\n`,
  )
  console.log('patched OpenNext @next/env shim')
}
