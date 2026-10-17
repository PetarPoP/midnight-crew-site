import React from 'react'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import Orders from './Orders'

/** Admin page /admin/narudzbe: shop orders and garage messages from the site. */
export default function OrdersView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult
  if (!req.user) redirect('/admin/login?redirect=%2Fadmin%2Fnarudzbe')
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <Orders />
      </Gutter>
    </DefaultTemplate>
  )
}
