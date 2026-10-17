'use client'
import React from 'react'
import { usePathname } from 'next/navigation'

/** "Narudžbe" link at the end of the admin menu. */
export default function OrdersNavLink() {
  const active = usePathname()?.startsWith('/admin/narudzbe')
  return (
    <div className="mc-navlinks">
      <a href="/admin/narudzbe" className={`nav__link${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
        <span className="nav__link-label">Narudžbe i poruke</span>
      </a>
    </div>
  )
}
