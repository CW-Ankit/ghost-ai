'use client'

import React from 'react'
import { Square, Circle, Diamond, Pill, Database, Hexagon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NodeShape } from '@/types/canvas'
import { useCanvasContext } from './canvas-context'

interface ShapeItemProps {
  shape: NodeShape
  icon: React.ReactNode
  label: string
}

function ShapeItem({ shape, icon, label }: ShapeItemProps) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/ghost-ai-shape',
      JSON.stringify({
        shape,
        label,
        size: shape === 'circle' ? { width: 60, height: 60 } : { width: 140, height: 70 },
      })
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      draggable
      onDragStart={onDragStart}
      className="h-11 w-11 rounded-xl bg-bg-surface border border-border-default text-text-secondary hover:text-accent-primary hover:border-accent-primary transition-all group relative"
      title={label}
    >
      {icon}
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-bg-elevated text-text-primary text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-border-subtle">
        {label}
      </span>
    </Button>
  )
}

export function ShapePanel() {
  const { isReadOnly } = useCanvasContext()

  if (isReadOnly) {
    return null
  }

  const shapes: { shape: NodeShape; icon: React.ReactNode; label: string }[] = [
    { shape: 'rectangle', icon: <Square className="h-5 w-5" />, label: 'Process' },
    { shape: 'diamond', icon: <Diamond className="h-5 w-5" />, label: 'Decision' },
    { shape: 'circle', icon: <Circle className="h-5 w-5" />, label: 'Event' },
    { shape: 'pill', icon: <Pill className="h-5 w-5" />, label: 'Service' },
    { shape: 'cylinder', icon: <Database className="h-5 w-5" />, label: 'Storage' },
    { shape: 'hexagon', icon: <Hexagon className="h-5 w-5" />, label: 'Boundary' },
  ]

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 p-2 bg-bg-surface/80 backdrop-blur-md border border-border-default rounded-2xl shadow-2xl">
        {shapes.map((s) => (
          <ShapeItem key={s.shape} {...s} />
        ))}
      </div>
    </div>
  )
}
