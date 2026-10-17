import type { CollectionConfig } from 'payload'
import { anyone, writeAccess } from '../access'
import { imageField } from '../fields'

export const Places: CollectionConfig = {
  slug: 'places',
  labels: { singular: 'Mjesto', plural: 'Gdje smo bili' },
  admin: {
    group: 'Sadržaj',
    useAsTitle: 'name',
    defaultColumns: ['name', 'kind', 'lat', 'lon'],
    description:
      'Mjesta na karti. Ruta i kilometri od Livna izračunaju se sami kod sljedećeg builda. Koordinate: desni klik na mjesto u Google Maps i klik na brojeve da ih kopiraš (prvi broj je lat, drugi lon).',
  },
  access: { read: anyone, ...writeAccess },
  defaultSort: 'name',
  fields: [
    { name: 'name', label: 'Naziv', type: 'text', required: true, unique: true },
    {
      type: 'row',
      fields: [
        { name: 'lat', label: 'Geografska širina (lat)', type: 'number', required: true, min: 42.45, max: 46.35, admin: { step: 0.0001, description: 'Npr. 43.508 za Split.' } },
        { name: 'lon', label: 'Geografska dužina (lon)', type: 'number', required: true, min: 14.6, max: 19.7, admin: { step: 0.0001, description: 'Npr. 16.44 za Split.' } },
      ],
    },
    {
      name: 'kind',
      label: 'Vrsta',
      type: 'select',
      required: true,
      defaultValue: 'bili',
      options: [
        { label: 'Bili smo', value: 'bili' },
        { label: 'Naš meet', value: 'nas' },
        { label: 'Idemo na', value: 'idemo' },
      ],
    },
    imageField('photo', 'Glavna slika', 'Prikazuje se na kartici kad se odabere ovo mjesto.'),
  ],
}
