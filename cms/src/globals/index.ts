import type { GlobalConfig } from 'payload'
import { anyone, isLoggedIn } from '../access'

const access = { read: anyone, update: isLoggedIn }

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Postavke stranice',
  admin: { group: 'Postavke' },
  access,
  fields: [
    {
      name: 'site_url',
      label: 'Adresa stranice',
      type: 'text',
      required: true,
      admin: { description: 'Koristi se za preglede linkova (Instagram, WhatsApp). Promijeni ako spojiš svoju domenu.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'instagram_url', label: 'Instagram link', type: 'text', required: true },
        { name: 'instagram_handle', label: 'Instagram ime (bez @)', type: 'text', required: true },
      ],
    },
    { name: 'rules', label: 'Pravila (naslovnica)', type: 'textarea', required: true },
    { name: 'shipping_note', label: 'Napomena o dostavi (shop)', type: 'textarea', required: true },
  ],
}

export const GaragePage: GlobalConfig = {
  slug: 'garagePage',
  label: 'Stranica Garaža',
  admin: { group: 'Postavke' },
  access,
  fields: [
    { name: 'title', label: 'Naslov', type: 'text', required: true, admin: { description: 'Naslov stranice /garaza i trake na naslovnici.' } },
    { name: 'description', label: 'Opis za Google i dijeljenje linka', type: 'text', required: true },
    { name: 'strip_button', label: 'Gumb na naslovnici', type: 'text', required: true, admin: { description: 'Npr. "Uđi u garažu".' } },
    {
      name: 'door_animation',
      label: 'Animacija garažnih vrata',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Isključi ako želiš da se stranica otvori odmah, bez vrata.' },
    },
    { name: 'door_label', label: 'Natpis iznad naslova na vratima', type: 'text', required: true },
    { name: 'search_placeholder', label: 'Tekst u tražilici', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'no_photo', label: 'Boks bez fotke', type: 'text', required: true },
        { name: 'no_instagram', label: 'Auto bez Instagrama', type: 'text', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'join_title', label: 'Zadnja pločica (naslov)', type: 'text', required: true },
        { name: 'join_text', label: 'Zadnja pločica (tekst)', type: 'text', required: true },
      ],
    },
    { name: 'empty', label: 'Kad pretraga ne nađe ništa', type: 'text', required: true, admin: { description: 'Iza ovoga se doda ono što je upisano u tražilicu.' } },
  ],
}
