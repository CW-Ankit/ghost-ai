'use client'

import React from 'react'
import { NodeShape } from '@/types/canvas'
import { cn } from '@/lib/utils'

interface DragPreviewProps {
  shape: NodeShape
  position: { x: number; y: number }
}

const SHAPE_PREVIEWS: Record<NodeShape, React.ReactNode> = {
  rectangle: (
    <div className="w-32 h-16 bg-bg-surface border-2 border-accent-primary rounded-lg opacity-50" />
  ),
  pill: (
    <div className="w-32 h-16 bg-bg-surface border-2 border-accent-primary rounded-full opacity-50" />
  ),
  circle: (
    <div className="w-16 h-16 bg-bg-surface border-2 border-accent-primary rounded-full opacity-50" />
  ),
  diamond: (
    <svg className="w-16 h-16 overflow-visible opacity-50" viewBox="0 0 100 100">
      <polygon
        points="50,0 100,50 50,100 0,50"
        fill="var(--bg-surface)"
        stroke="var(--accent-primary)"
        strokeWidth="4"
      />
    </svg>
  ),
  hexagon: (
    <svg className="w-16 h-16 overflow-visible opacity-50" viewBox="0 0 100 100">
      <polygon
        points="25,0 75,0 100,50 75,100 25,100 0,50"
        fill="var(--bg-surface)"
        stroke="var(--accent-primary)"
        strokeWidth="4"
      />
    </svg>
  ),
  cylinder: (
    <svg className="w-16 h-16 overflow-visible opacity-50" viewBox="0 0 100 100">
      <ellipse
        cx="50"
        cy="20"
        rx="40"
        ry="10"
        fill="var(--bg-surface)"
        stroke="var(--accent-primary)"
        strokeWidth="4"
      />
      <path
        d="M10,20 L10,80 A40,10 0 0,0 90,80 L90,20"
        fill="var(--bg-surface)"
        stroke="var(--accent-primary)"
        strokeWidth="4"
      />
      <ellipse
        cx="50"
        cy="80"
        rx="40"
        ry="10"
        fill="var(--bg-surface)"
        stroke="var(--accent-primary)"
        strokeWidth="4"
      />
    </svg>
  ),
}

export function DragPreview({ shape, position }: DragPreviewProps) {
  return (
    <div
      className="fixed pointer-events-none z-[100] transition-transform duration-75 ease-out"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {SHAPE_PREVIEWS[shape]}
    </div>
  )
}
