import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Korisnik', plural: 'Korisnici' },
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'updatedAt'],
    group: 'Postavke',
    // Only an admin sees the user list in the menu.
    hidden: ({ user }) => (user as { role?: string } | null)?.role !== 'admin',
  },
  access: {
    // An editor can read only the own user document.
    read: ({ req }) => {
      if (!req.user) return false
      if ((req.user as { role?: string }).role === 'admin') return true
      return { id: { equals: req.user.id } }
    },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    // The first user in an empty database is always an admin.
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) data.role = 'admin'
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', label: 'Ime', type: 'text' },
    {
      name: 'role',
      label: 'Uloga',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Urednik', value: 'editor' },
      ],
      access: { create: isAdminField, update: isAdminField },
    },
  ],
}
