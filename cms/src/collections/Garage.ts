import type { CollectionConfig } from 'payload'
import { anyone, writeAccess } from '../access'
import { imageField, orderField } from '../fields'

export const Garage: CollectionConfig = {
  slug: 'garage',
  labels: { singular: 'Auto', plural: 'Garaža' },
  admin: {
    group: 'Sadržaj',
    useAsTitle: 'car',
    defaultColumns: ['car', 'instagram', 'image', 'order'],
    description:
      'Auti ekipe na stranici /garaza. Svaki auto dobije svoj boks s garažnim vratima. Najbolje izgleda PNG auta bez pozadine (npr. preko remove.bg), ali radi i obična fotka. Klik na boks otvara Instagram vlasnika.',
  },
  access: { read: anyone, ...writeAccess },
  defaultSort: 'order',
  fields: [
    { name: 'car', label: 'Auto (marka i model)', type: 'text', required: true, admin: { description: 'Npr. "BMW E46 330d". Prikazuje se ispod boksa.' } },
    {
      name: 'instagram',
      label: 'Instagram (bez @)',
      type: 'text',
      admin: { description: 'Samo korisničko ime, npr. midnight_crew_livno. Prazno = "Bez Instagrama".' },
    },
    imageField('image', 'Slika auta', 'Najbolje PNG bez pozadine, auto sa strane ili sprijeda.'),
    orderField('Broj boksa: manji broj = raniji boks.'),
    {
      type: 'collapsible',
      label: 'Detalji (nije obavezno)',
      admin: { initCollapsed: true },
      fields: [
        { name: 'owner', label: 'Vlasnik', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'year', label: 'Godina', type: 'number', min: 1950, max: 2030 },
            { name: 'hp', label: 'Snaga (KS)', type: 'number', min: 0 },
            { name: 'torque', label: 'Moment (Nm)', type: 'number', min: 0 },
            {
              name: 'drivetrain',
              label: 'Pogon',
              type: 'select',
              defaultValue: 'rwd',
              options: [
                { label: 'Zadnji', value: 'rwd' },
                { label: 'Prednji', value: 'fwd' },
                { label: '4x4', value: 'awd' },
              ],
            },
          ],
        },
        { name: 'note', label: 'Kratak opis', type: 'textarea' },
      ],
    },
  ],
}
