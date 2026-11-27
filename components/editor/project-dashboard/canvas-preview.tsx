import React, { useState } from 'react'
import { NODE_COLORS } from '@/types/canvas'
import { cn } from '@/lib/utils'

interface Snapshot {
  nodes: Array<{ id: string; x: number; y: number; shape: string; color: string }>
  edges: Array<{ source: string; target: string }>
}

interface CanvasPreviewProps {
  snapshot?: Snapshot | null
  compact?: boolean
  className?: string
}

export function CanvasPreview({ snapshot, compact = false, className }: CanvasPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)

  const gridStyle: React.CSSProperties = {
    backgroundImage:
      'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
    backgroundSize: compact ? '10px 10px' : '14px 14px',
  }

  if (!snapshot || !snapshot.nodes || snapshot.nodes.length === 0) {
    return (
      <div
        style={gridStyle}
        className={cn(
          'w-full h-full flex items-center justify-center bg-[#090d12] rounded-xl border border-white/[0.06] text-text-faint',
          className
        )}
      >
        {!compact && (
          <span className="text-[10px] font-mono tracking-wider uppercase opacity-55">
            Empty Canvas
          </span>
        )}
      </div>
    )
  }

  const xCoords = snapshot.nodes.map((n) => n.x)
  const yCoords = snapshot.nodes.map((n) => n.y)
  const minX = Math.min(...xCoords)
  const maxX = Math.max(...xCoords)
  const minY = Math.min(...yCoords)
  const maxY = Math.max(...yCoords)

  const width = maxX - minX || 120
  const height = maxY - minY || 120

  const scaleX = 100 / width
  const scaleY = 100 / height

  return (
    <div
      style={gridStyle}
      className={cn(
        'w-full h-full bg-[#090d12] rounded-xl border border-white/[0.06] overflow-hidden relative transition-colors duration-200',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        viewBox="-16 -16 132 132"
        preserveAspectRatio="xMidYMid meet"
        className={cn(
          'w-full h-full transition-transform duration-300 origin-center',
          isHovered ? 'scale-110' : 'scale-100'
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
              stroke="rgba(142, 224, 234, 0.32)"
              strokeWidth={compact ? '1.6' : '1.2'}
              strokeLinecap="round"
            />
          )
        })}

        {snapshot.nodes.map((node, i) => {
          const cx = (node.x - minX) * scaleX
          const cy = (node.y - minY) * scaleY
          const palette =
            NODE_COLORS[node.color as keyof typeof NODE_COLORS] || NODE_COLORS.default
          const w = compact ? 10 : 12
          const h = compact ? 6.5 : 7.5

          if (node.shape === 'circle') {
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={compact ? '4.5' : '5'}
                fill={palette.fill}
                stroke={palette.text}
                strokeOpacity={0.7}
                strokeWidth="1"
              />
            )
          }

          return (
            <rect
              key={i}
              x={cx - w / 2}
              y={cy - h / 2}
              width={w}
              height={h}
              rx={node.shape === 'pill' ? h / 2 : 2}
              fill={palette.fill}
              stroke={palette.text}
              strokeOpacity={0.7}
              strokeWidth="0.9"
            />
          )
        })}
      </svg>
    </div>
  )
}
