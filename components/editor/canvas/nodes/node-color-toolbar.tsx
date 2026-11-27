'use client'

import React from 'react'
import { NODE_COLORS } from '@/types/canvas'
import { cn } from '@/lib/utils'

interface NodeColorToolbarProps {
  currentColor: string
  onColorChange: (color: string) => void
}

export function NodeColorToolbar({ currentColor, onColorChange }: NodeColorToolbarProps) {
  return (
    <div
      className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-[#0e141c]/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(255,255,255,0.06)] z-50 transition-all animate-in fade-in slide-in-from-bottom-1"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={(e) => e.stopPropagation()}
    >
      {Object.entries(NODE_COLORS).map(([key, value]) => (
        <button
          key={key}
          onClick={() => onColorChange(key)}
          className={cn(
            'w-5 h-5 rounded-full border transition-all relative group',
            currentColor === key
              ? 'border-accent-primary scale-110 shadow-[0_0_0_2px_var(--bg-surface),0_0_0_4px_var(--accent-primary)]'
              : 'border-border-default hover:scale-110'
          )}
          style={{ backgroundColor: value.fill }}
          title={key}
        >
          {/* Subtle glow on hover based on text color */}
          <div
            className={cn(
              'absolute inset-0 rounded-full opacity-0 group-hover:opacity-50 transition-opacity blur-[2px]',
              'pointer-events-none'
            )}
            style={{ boxShadow: `0 0 8px ${value.text}` }}
          />
        </button>
      ))}
    </div>
  )
}
