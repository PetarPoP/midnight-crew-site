import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The CMS is a separate project inside the site repository.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  // Next 16.3 writes AGENTS.md and CLAUDE.md in dev by default. Switch it off.
  agentRules: false,
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },
  // Packages with Cloudflare Workers (workerd) specific code.
  // Workaround for payload issue #16470: keep these packages out of the bundle.
  // Read more: https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: [
    '@payloadcms/drizzle/sqlite',
    '@payloadcms/db-d1-sqlite',
    'jose',
    'drizzle-kit',
    'pg-cloudflare',
  ],
  // Build with webpack, not Turbopack. See the "build" script.
  webpack: (webpackConfig: any) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
