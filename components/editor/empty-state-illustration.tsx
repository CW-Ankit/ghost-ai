'use client'

import { cn } from '@/lib/utils'

export type EmptyStateType = 'projects' | 'shared' | 'search' | 'specs' | 'generic'

interface EmptyStateIllustrationProps {
  type: EmptyStateType
  className?: string
}

/**
 * Placeholder illustration for empty states.
 * Each `type` renders a unique soft glow + circle so the slot is identifiable.
 * Replace the inner content with a custom animated SVG per type when ready.
 */
export function EmptyStateIllustration({ type, className }: EmptyStateIllustrationProps) {
  const glowColor: Record<EmptyStateType, string> = {
    projects: '#7ecbd4',
    shared: '#8b7ee8',
    search: '#7ecbd4',
    specs: '#4a9e8e',
    generic: '#7ecbd4',
  }

  const glow = glowColor[type]

  return (
    <div className={cn('relative h-24 w-24 mx-auto select-none', className)}>
      {/* Ambient glow — blurred radial behind the circle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-12px] rounded-full blur-2xl opacity-60"
        style={{ background: `radial-gradient(circle, ${glow}22 0%, transparent 70%)` }}
      />

      {/* Illustration circle — swap innards for animated SVG later */}
      <div
        className="relative h-full w-full rounded-full border border-white/[0.08] shadow-[0_12px_28px_-8px_rgba(0,0,0,0.85)] flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #152834 0%, #0c171f 100%)',
        }}
      >
        {/* Inner ring accent */}
        <div
          className="absolute inset-[6px] rounded-full border border-white/[0.05]"
          aria-hidden="true"
        />

        {/* Soft centre dot — animated SVG slot */}
        {/* type={type} → swap this div with <YourAnimatedSVG /> when assets are ready */}
        <div
          className="h-8 w-8 rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          }}
        />
      </div>
    </div>
  )
}
