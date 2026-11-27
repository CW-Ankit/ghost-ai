'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import PillNav, { type PillNavItem } from '@/components/pill-nav'
import { Logo } from '@/components/ui/logo'

const NAV_ITEMS: PillNavItem[] = [
  { label: 'Overview', href: '#overview' },
  { label: 'Canvas', href: '#canvas' },
  { label: 'Specs', href: '#specs' },
  { label: 'Pricing', href: '#pricing' },
]

interface LandingNavProps {
  initialSignedIn?: boolean
}

export function LandingNav({ initialSignedIn = false }: LandingNavProps) {
  const [activeHref, setActiveHref] = useState('#hero')
  const clickLockRef = useRef<{ href: string; expiresAt: number } | null>(null)
  const { isLoaded, isSignedIn } = useAuth()
  const showOpenStudio = isLoaded ? Boolean(isSignedIn) : initialSignedIn

  useEffect(() => {
    const resolveActiveHref = () => {
      const vh = window.innerHeight || 900
      const scrollBottom = window.scrollY + vh
      const docHeight = document.documentElement.scrollHeight

      if (
        docHeight > vh + 24 &&
        scrollBottom >= docHeight - 24 &&
        document.getElementById('pricing')
      ) {
        return '#pricing'
      }

      const hero = document.getElementById('hero')
      if (hero && hero.getBoundingClientRect().bottom > vh * 0.45) {
        return '#hero'
      }

      const overview = document.getElementById('overview')
      if (overview && overview.getBoundingClientRect().bottom > 72) {
        return '#overview'
      }

      const threshold = vh * 0.42
      for (const id of ['pricing', 'specs', 'canvas'] as const) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= threshold) {
          return `#${id}`
        }
      }

      return '#canvas'
    }

    let raf = 0
    const sync = () => {
      raf = 0
      const lock = clickLockRef.current
      if (lock && performance.now() < lock.expiresAt) {
        setActiveHref(lock.href)
        return
      }
      clickLockRef.current = null
      setActiveHref(resolveActiveHref())
    }

    const scheduleSync = () => {
      if (!raf) raf = requestAnimationFrame(sync)
    }

    const releaseLock = () => {
      if (clickLockRef.current) {
        clickLockRef.current = null
        scheduleSync()
      }
    }

    sync()
    window.addEventListener('scroll', scheduleSync, { passive: true })
    window.addEventListener('resize', scheduleSync, { passive: true })
    window.addEventListener('wheel', releaseLock, { passive: true })
    window.addEventListener('touchstart', releaseLock, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', scheduleSync)
      window.removeEventListener('resize', scheduleSync)
      window.removeEventListener('wheel', releaseLock)
      window.removeEventListener('touchstart', releaseLock)
    }
  }, [])

  const lockActiveHref = (href: string) => {
    clickLockRef.current = { href, expiresAt: performance.now() + 900 }
    setActiveHref(href)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-full items-center justify-center sm:w-auto">
        <PillNav
          logo={<Logo size={20} className="text-accent-primary" />}
          logoAlt="Ghost AI"
          logoHref="#hero"
          onLogoClick={() => lockActiveHref('#hero')}
          items={NAV_ITEMS}
          activeHref={activeHref}
          onItemClick={(item) => {
            if (item.href) lockActiveHref(item.href)
          }}
          action={
            <Link
              href={showOpenStudio ? '/editor' : '/sign-up'}
              className="inline-flex h-full items-center justify-center rounded-full bg-accent-primary px-5 text-[14px] leading-none font-medium tracking-[-0.005em] whitespace-nowrap text-bg-base shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_22px_44px_-20px_rgba(0,0,0,0.8),0_6px_16px_-8px_rgba(0,0,0,0.5)] transition-[background-color,transform] duration-200 hover:bg-accent-primary/90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
            >
              {showOpenStudio ? 'Open Studio' : 'Get Started'}
            </Link>
          }
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
    </div>
  )
}
