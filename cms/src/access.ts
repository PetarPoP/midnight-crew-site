import type { Access, FieldAccess } from 'payload'

type User = { id?: number | string; role?: 'admin' | 'editor' } | null | undefined

export const isLoggedIn: Access = ({ req }) => Boolean(req.user)
export const isAdmin: Access = ({ req }) => (req.user as User)?.role === 'admin'
export const isAdminField: FieldAccess = ({ req }) => (req.user as User)?.role === 'admin'
export const anyone: Access = () => true

/** A visitor reads only published documents. A logged-in user reads all documents. */
export const publishedOrUser: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}

/** A visitor reads only active documents. A logged-in user reads all documents. */
export const activeOrUser: Access = ({ req }) => {
  if (req.user) return true
  return { active: { equals: true } }
}

/** Standard write access: a logged-in user can create, update and delete. */
export const writeAccess = {
  create: isLoggedIn,
  update: isLoggedIn,
  delete: isLoggedIn,
}
