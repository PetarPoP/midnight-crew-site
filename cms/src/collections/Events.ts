import type { CollectionConfig } from 'payload'
import { anyone, writeAccess } from '../access'
import { imageField, slugField } from '../fields'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Događaj', plural: 'Događaji' },
  admin: {
    group: 'Sadržaj',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'place', 'kind'],
    description: 'Meetovi i vožnje. Prošli događaji se sami sakriju 6 sati nakon početka.',
  },
  access: { read: anyone, ...writeAccess },
  defaultSort: '-date',
  fields: [
    { name: 'title', label: 'Naziv', type: 'text', required: true },
    {
      name: 'date',
      label: 'Datum i vrijeme',
      type: 'date',
      required: true,
      index: true,
      timezone: true,
      admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy. HH:mm', timeFormat: 'HH:mm', timeIntervals: 15 } },
    },
    {
      name: 'place',
      label: 'Mjesto',
      type: 'text',
      required: true,
      admin: { description: 'Npr. "Livno" ili "Livno → Buško jezero". Događaj se prikazuje i na karti kod mjesta istog imena.' },
    },
    {
      name: 'kind',
      label: 'Vrsta',
      type: 'select',
      required: true,
      defaultValue: 'nas',
      options: [
        { label: 'Naš meet', value: 'nas' },
        { label: 'Idemo na', value: 'idemo' },
      ],
    },
    { name: 'description', label: 'Opis', type: 'textarea' },
    imageField('image', 'Slika'),
    slugField('title'),
  ],
}
