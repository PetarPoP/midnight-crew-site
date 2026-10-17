import type { CollectionConfig } from 'payload'
import { anyone, writeAccess } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Slika', plural: 'Slike' },
  admin: {
    group: 'Biblioteka',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  access: { read: anyone, ...writeAccess },
  fields: [{ name: 'alt', label: 'Opis slike', type: 'text', admin: { description: 'Za čitače ekrana. Može ostati prazno.' } }],
  upload: {
    // Crop and focal point need sharp. Workers do not support sharp.
    // The site makes the small AVIF/WebP versions itself at build time.
    crop: false,
    focalPoint: false,
    mimeTypes: ['image/*'],
  },
}
