import React, { useState } from 'react'
import { NODE_COLORS } from '@/types/canvas'
import { cn } from '@/lib/utils'

interface Snapshot {
  nodes: Array<{ id: string; x: number; y: number; shape: string; color: string }>
  edges: Array<{ source: string; target: string }>
}

interface CanvasPreviewProps {
  snapshot: Snapshot
}

export function CanvasPreview({ snapshot }: CanvasPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (!snapshot || !snapshot.nodes || snapshot.nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-bg-subtle rounded-xl border border-border-subtle text-text-muted">
        <div className="text-[10px] font-mono opacity-50">Empty Canvas</div>
      </div>
    )
  }

  const xCoords = snapshot.nodes.map((n) => n.x)
  const yCoords = snapshot.nodes.map((n) => n.y)
  const minX = Math.min(...xCoords)
  const maxX = Math.max(...xCoords)
  const minY = Math.min(...yCoords)
  const maxY = Math.max(...yCoords)

  const width = maxX - minX || 100
  const height = maxY - minY || 100

  const scaleX = 100 / width
  const scaleY = 100 / height

  return (
    <div
      className="w-full h-full bg-bg-subtle rounded-xl border border-border-subtle overflow-hidden relative transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        viewBox="0 0 100 100"
        className={cn(
          'w-full h-full transition-transform duration-300 origin-center',
          isHovered ? 'scale-125' : 'scale-100'
        )}
      >
        {snapshot.edges.map((edge, i) => {
          const start = snapshot.nodes.find((n) => n.id === edge.source)
          const end = snapshot.nodes.find((n) => n.id === edge.target)
          if (!start || !end) return null

          return (
            <line
              key={i}
              x1={(start.x - minX) * scaleX}
              y1={(start.y - minY) * scaleY}
              x2={(end.x - minX) * scaleX}
              y2={(end.y - minY) * scaleY}
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
          )
        })}

        {snapshot.nodes.map((node, i) => {
          const cx = (node.x - minX) * scaleX
          const cy = (node.y - minY) * scaleY
          const color =
            NODE_COLORS[node.color as keyof typeof NODE_COLORS]?.fill || NODE_COLORS.default.fill

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={isHovered ? '3' : '2'}
              fill={color}
              stroke="var(--border-default)"
              strokeWidth="0.5"
              className="transition-all duration-300"
            />
          )
        })}
      </svg>
    </div>
  )
}
