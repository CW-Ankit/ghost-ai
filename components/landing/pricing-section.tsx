'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import PixelCard from '@/components/pixel-card'
import { cn } from '@/lib/utils'

interface PricingTier {
  id: string
  name: string
  tagline: string
  monthlyPrice: number
  annualPrice: number
  badge?: string
  featured?: boolean
  ctaLabel: string
  colors: string[]
  glowColor: string
  shape: 'square' | 'circle' | 'diamond'
  opacity: number
  introDelay: number
  features: string[]
}

const TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For solo engineers exploring AI system design.',
    monthlyPrice: 0,
    annualPrice: 0,
    ctaLabel: 'Start Free',
    colors: ['var(--text-primary)', 'var(--text-secondary)', 'var(--border-subtle)'],
    glowColor: 'var(--text-secondary)',
    shape: 'square',
    opacity: 0.25,
    introDelay: 0,
    features: [
      'Up to 3 active architecture projects',
      'Starter system design blueprints',
      'All 6 node shapes & orthogonal edges',
      'Markdown & A4 PDF spec export',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For builders shipping distributed systems fast.',
    monthlyPrice: 19,
    annualPrice: 15,
    badge: 'Most Popular',
    featured: true,
    ctaLabel: 'Go Pro',
    colors: ['var(--text-primary)', 'var(--accent-primary)', 'var(--accent-ai-text)'],
    glowColor: 'var(--accent-primary)',
    shape: 'square',
    opacity: 0.42,
    introDelay: 90,
    features: [
      'Unlimited architecture projects',
      'Real-time multiplayer canvas & live cursors',
      'Mistral AI synthesis & visual node diffs',
      'Public VIEW_ONLY share links & autosave',
      'Priority PNG / SVG export (upcoming)',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    tagline: 'For engineering teams collaborating at scale.',
    monthlyPrice: 49,
    annualPrice: 39,
    ctaLabel: 'Start Team Trial',
    colors: ['var(--text-primary)', 'var(--accent-ai-text)', 'var(--accent-ai)'],
    glowColor: 'var(--accent-ai)',
    shape: 'diamond',
    opacity: 0.34,
    introDelay: 180,
    features: [
      'Everything in Pro, per active seat',
      'Unlimited concurrent room collaborators',
      'Role-based project access controls',
      'Shared team starter blueprints',
      'Priority support & onboarding',
    ],
  },
]

interface PricingSectionProps {
  isSignedIn?: boolean
}

export function PricingSection({ isSignedIn = false }: PricingSectionProps) {
  const [annual, setAnnual] = useState(true)
  const ctaHref = isSignedIn ? '/editor' : '/sign-up'

  return (
    <section
      id="pricing"
      tabIndex={-1}
      className="mx-auto w-full max-w-6xl space-y-10 px-6 pt-12 pb-36 outline-none"
    >
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl space-y-3">
          <p className="font-mono text-xs font-medium tracking-[0.14em] text-accent-primary uppercase">
            Simple, Transparent Pricing
          </p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Start designing for free. Scale with your team.
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
            Every tier includes real-time canvas editing, starter blueprints, and instant spec
            exports.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div
          role="group"
          aria-label="Billing interval"
          className="inline-flex w-fit items-center gap-1 rounded-full border border-border-default bg-bg-surface p-1"
        >
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              !annual
                ? 'bg-bg-elevated text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              annual
                ? 'bg-bg-elevated text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            <span>Annual</span>
            <span className="rounded-full bg-accent-primary-dim px-1.5 py-0.5 font-mono text-[10px] text-accent-primary">
              -20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TIERS.map((tier) => {
          const price = annual ? tier.annualPrice : tier.monthlyPrice

          return (
            <PixelCard
              key={tier.id}
              colors={tier.colors}
              glowColor={tier.glowColor}
              shape={tier.shape}
              origin="pointer"
              gap={10}
              pixelSize={1.8}
              speed={25}
              revealDuration={600}
              spotlight={0.7}
              glow={0.5}
              opacity={tier.opacity}
              fade={0.72}
              trigger="hover"
              radius={24}
              clickPulse
              intro
              introDelay={tier.introDelay}
              theme="dark"
              className={cn(
                'h-full min-h-[420px] w-full',
                tier.featured && 'ring-1 ring-accent-primary/40'
              )}
            >
              <div className="flex h-full w-full flex-col justify-between gap-6 p-6 sm:p-8">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-heading text-lg font-semibold text-text-primary">
                      {tier.name}
                    </h3>
                    {tier.badge && (
                      <span className="rounded-full border border-accent-primary/35 bg-accent-primary-dim px-2.5 py-0.5 font-mono text-[11px] font-medium text-accent-primary">
                        {tier.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-heading text-4xl font-bold tracking-tight text-text-primary">
                        ${price}
                      </span>
                      <span className="font-mono text-xs text-text-muted">
                        {tier.id === 'team' ? '/ seat / mo' : '/ month'}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-text-secondary">{tier.tagline}</p>
                  </div>

                  <div className="h-px w-full bg-border-default/80" />

                  <ul className="space-y-2.5">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-xs leading-relaxed text-text-secondary"
                      >
                        <Check
                          className={cn(
                            'mt-0.5 h-4 w-4 shrink-0',
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
                    'inline-flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
                    tier.featured
                      ? 'bg-accent-primary text-bg-base hover:bg-accent-primary/90'
                      : 'border border-border-default bg-bg-base/80 text-text-primary hover:border-border-subtle hover:bg-bg-elevated'
                  )}
                >
                  {isSignedIn ? 'Open Studio' : tier.ctaLabel}
                </Link>
              </div>
            </PixelCard>
          )
        })}
      </div>
    </section>
  )
}
