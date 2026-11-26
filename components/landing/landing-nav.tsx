'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import PillNav, { type PillNavItem } from '@/components/pill-nav'
import { Logo } from '@/components/ui/logo'

const NAV_ITEMS: PillNavItem[] = [
  { label: 'Overview', href: '#hero' },
  { label: 'Canvas', href: '#canvas' },
  { label: 'Specs', href: '#specs' },
]

export function LandingNav() {
  const [activeHref, setActiveHref] = useState('#hero')

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-full items-center justify-center gap-2">
        <div className="min-w-0 flex-1 sm:flex-initial">
          <PillNav
            logo={<Logo size={20} className="text-accent-primary" />}
            logoAlt="Ghost AI"
            logoHref="#hero"
            items={NAV_ITEMS}
            activeHref={activeHref}
            onItemClick={(item) => {
              if (item.href) setActiveHref(item.href)
            }}
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
            style={
              {
                '--pn-edge': 'var(--border-default)',
                '--pn-rim': 'color-mix(in srgb, var(--text-primary) 8%, transparent)',
                '--pn-ring': 'var(--accent-primary)',
              } as CSSProperties
            }
          />
        </div>

        <Link
          href="/editor"
          className="inline-flex h-[44px] flex-none items-center justify-center rounded-full bg-accent-primary px-5 text-[14px] leading-none font-medium tracking-[-0.005em] whitespace-nowrap text-bg-base shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_22px_44px_-20px_rgba(0,0,0,0.8),0_6px_16px_-8px_rgba(0,0,0,0.5)] transition-[background-color,transform] duration-200 hover:bg-accent-primary/90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          Open Studio
        </Link>
      </div>
    </div>
  )
}
