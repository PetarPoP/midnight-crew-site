import type { CollectionConfig } from 'payload'
import { anyone, writeAccess } from '../access'
import { imageField, orderField, slugField } from '../fields'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Artikl', plural: 'Shop' },
  admin: { group: 'Sadržaj', useAsTitle: 'name', defaultColumns: ['name', 'price', 'category', 'order'] },
  access: { read: anyone, ...writeAccess },
  defaultSort: 'order',
  fields: [
    { name: 'name', label: 'Naziv', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'price', label: 'Cijena (KM)', type: 'number', required: true, min: 0 },
        {
          name: 'category',
          label: 'Kategorija',
          type: 'select',
          required: true,
          defaultValue: 'odjeca',
          options: [
            { label: 'Odjeća', value: 'odjeca' },
            { label: 'Dodaci', value: 'dodaci' },
          ],
        },
      ],
    },
    imageField('image', 'Fotka'),
    { name: 'blurb', label: 'Opis', type: 'textarea', required: true },
    { name: 'details', label: 'Detalji', type: 'text', hasMany: true, admin: { description: 'Kratke stavke, npr. "100% pamuk". Enter nakon svake.' } },
    { name: 'sizes', label: 'Veličine', type: 'text', hasMany: true, admin: { description: 'Npr. S, M, L, XL. Prazno ako artikl nema veličine.' } },
    orderField('Manji broj se prikazuje prvi.'),
    slugField('name'),
  ],
}
