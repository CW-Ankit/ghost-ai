'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import PillNav from '@/components/pill-nav'
import { Logo } from '@/components/ui/logo'

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Workspace', href: '/editor' },
  { label: 'Sign In', href: '/sign-in' },
  { label: 'Get Started', href: '/sign-up' },
]

export function LandingNav() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <PillNav
        logo={<Logo size={20} className="text-accent-primary" />}
        logoAlt="Ghost AI"
        logoHref="/"
        items={NAV_ITEMS}
        activeHref="/"
        linkComponent={Link}
        theme="dark"
        layout="split"
        surface="glass"
        itemStyle="plain"
        hoverEffect="glide"
        indicator="dot"
        bounce={0.43}
        stretch={0.65}
        panelDirection="up"
        barColor="color-mix(in srgb, var(--bg-surface) 84%, transparent)"
        textColor="var(--text-primary)"
        highlightColor="var(--accent-primary)"
        highlightTextColor="var(--bg-base)"
        className="pointer-events-auto"
        style={
          {
            '--pn-edge': 'var(--border-default)',
            '--pn-rim': 'color-mix(in srgb, var(--text-primary) 8%, transparent)',
            '--pn-ring': 'var(--accent-primary)',
          } as CSSProperties
        }
      />
    </div>
  )
}
