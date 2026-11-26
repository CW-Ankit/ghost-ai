'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Check, Rocket, Sparkles, Users } from 'lucide-react'
import PixelCard from '@/components/pixel-card'
import { cn } from '@/lib/utils'

interface PricingTier {
  id: string
  name: string
  tagline: string
  price: number
  popular?: boolean
  featured?: boolean
  ctaLabel: string
  icon: ReactNode
  colors: string[]
  glowColor: string
  shape: 'square' | 'circle' | 'diamond'
  trigger: 'hover' | 'always'
  gap: number
  pixelSize: number
  opacity: number
  introDelay: number
  features: string[]
}

const TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For solo projects',
    price: 0,
    ctaLabel: 'Open Studio',
    icon: <Sparkles className="h-5 w-5 text-text-primary" />,
    colors: ['var(--text-primary)', 'var(--text-secondary)', 'var(--border-subtle)'],
    glowColor: 'var(--text-secondary)',
    shape: 'square',
    trigger: 'hover',
    gap: 9,
    pixelSize: 1.6,
    opacity: 0.25,
    introDelay: 0,
    features: ['3 architecture projects', 'Starter system blueprints', 'Markdown & PDF export'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing teams',
    price: 19,
    popular: true,
    featured: true,
    ctaLabel: 'Upgrade to Pro',
    icon: <Rocket className="h-5 w-5 text-text-primary" />,
    colors: ['var(--text-primary)', 'var(--accent-primary)', 'var(--accent-ai-text)'],
    glowColor: 'var(--accent-primary)',
    shape: 'square',
    trigger: 'always',
    gap: 7,
    pixelSize: 1.6,
    opacity: 0.32,
    introDelay: 90,
    features: ['Unlimited projects', 'Live multiplayer & AI diffs', 'Public share links'],
  },
  {
    id: 'team',
    name: 'Team',
    tagline: 'For organizations',
    price: 49,
    ctaLabel: 'Upgrade to Teams',
    icon: <Users className="h-5 w-5 text-text-primary" />,
    colors: ['var(--text-primary)', 'var(--accent-ai-text)', 'var(--accent-ai)'],
    glowColor: 'var(--accent-ai)',
    shape: 'diamond',
    trigger: 'hover',
    gap: 9,
    pixelSize: 1.6,
    opacity: 0.3,
    introDelay: 180,
    features: ['Shared workspaces', 'Team access controls', 'Priority support'],
  },
]

interface PricingSectionProps {
  isSignedIn?: boolean
}

export function PricingSection({ isSignedIn = false }: PricingSectionProps) {
  const ctaHref = isSignedIn ? '/editor' : '/sign-up'

  return (
    <section
      id="pricing"
      tabIndex={-1}
      className="mx-auto w-full max-w-6xl space-y-10 px-6 pt-12 pb-36 outline-none"
    >
      <div className="max-w-2xl space-y-3">
        <p className="font-mono text-xs font-medium tracking-[0.14em] text-accent-primary uppercase">
          Pricing
        </p>
        <h2 className="font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Simple plans for every team.
        </h2>
        <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
          Start free on personal diagrams, and upgrade when your team needs unlimited scale.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TIERS.map((tier) => (
          <PixelCard
            key={tier.id}
            colors={tier.colors}
            glowColor={tier.glowColor}
            shape={tier.shape}
            origin="pointer"
            gap={tier.gap}
            pixelSize={tier.pixelSize}
            speed={22}
            revealDuration={600}
            spotlight={0.65}
            glow={0.45}
            opacity={tier.opacity}
            fade={0.35}
            trigger={tier.trigger}
            radius={24}
            clickPulse
            intro
            introDelay={tier.introDelay}
            theme="dark"
            className="h-full min-h-[380px] w-full"
          >
            <div className="flex h-full w-full flex-col justify-between gap-7 p-6 sm:p-7">
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#2a2a33_0%,#16161c_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_0_0_1px_rgba(255,255,255,0.08),0_6px_14px_-4px_rgba(0,0,0,0.85)]">
                      {tier.icon}
                    </span>
                    <h3 className="font-heading text-base font-semibold text-text-primary">
                      {tier.name}
                    </h3>
                  </div>

                  {tier.popular && (
                    <span className="text-xs font-medium text-text-secondary">Popular</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading text-4xl font-bold tracking-tight text-text-primary">
                      ${tier.price}
                    </span>
                    <span className="text-sm text-text-muted">/month</span>
                  </div>
                  <p className="text-sm text-text-muted">{tier.tagline}</p>
                </div>

                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-text-secondary"
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          tier.featured ? 'text-accent-primary' : 'text-text-muted'
                        )}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={ctaHref}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium transition-[transform,filter,background-color] duration-200 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
                  tier.featured
                    ? 'bg-[linear-gradient(180deg,#33dce6_0%,#00c8d4_100%)] font-semibold text-bg-base shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_24px_-6px_rgba(0,200,212,0.4)] hover:brightness-105'
                    : 'bg-[linear-gradient(180deg,#2d2c36_0%,#1b1a21_100%)] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_0_0_1px_rgba(255,255,255,0.08),0_8px_18px_-6px_rgba(0,0,0,0.85)] hover:bg-[linear-gradient(180deg,#353440_0%,#222129_100%)]'
                )}
              >
                {tier.ctaLabel}
              </Link>
            </div>
          </PixelCard>
        ))}
      </div>
    </section>
  )
}
