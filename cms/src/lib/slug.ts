import type { FieldHook } from 'payload'

/** Make a URL slug from text. Remove accents and keep only a-z, 0-9 and "-". */
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Fill the slug from the title when the slug is empty. */
export const slugFromTitle: FieldHook = ({ value, data }) => {
  if (typeof value === 'string' && value.length > 0) return slugify(value)
  const title = data?.title
  return typeof title === 'string' ? slugify(title) : value
}
