import type { Field } from 'payload'
import { slugify } from './lib/slug'

/**
 * Address of a document on the site (event and product links use it).
 * Filled from the given field when empty. Keep it the same after publishing, or old links break.
 */
export const slugField = (from: string): Field => ({
  name: 'slug',
  label: 'Adresa (slug)',
  type: 'text',
  unique: true,
  index: true,
  admin: { position: 'sidebar', description: 'Sama se popuni iz naziva. Ne mijenjaj nakon objave, inače stari linkovi prestanu raditi.' },
  hooks: {
    beforeValidate: [({ value, data }) => slugify(typeof value === 'string' && value ? value : String(data?.[from] ?? ''))],
  },
})

export const imageField = (name: string, label: string, description?: string): Field => ({
  name,
  label,
  type: 'upload',
  relationTo: 'media',
  admin: description ? { description } : undefined,
})

export const orderField = (description: string): Field => ({
  name: 'order',
  label: 'Redoslijed',
  type: 'number',
  defaultValue: 10,
  index: true,
  admin: { position: 'sidebar', description },
})
