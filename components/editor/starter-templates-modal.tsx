'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EditorButton } from './editor-button'
import { Input } from '@/components/ui/input'
import { CANVAS_TEMPLATES, CanvasTemplate } from '@/components/editor/starter-templates'
import { NODE_COLORS, NodeShape } from '@/types/canvas'
import { Search, Sparkles, LayoutTemplate, AlertTriangle } from 'lucide-react'

interface TemplatePreviewProps {
  template: CanvasTemplate
}

function TemplatePreview({ template }: TemplatePreviewProps) {
  const { nodes, edges } = template

  const { viewBox, nodePositions } = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return { viewBox: '0 0 100 100', nodePositions: new Map() }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    const positions = new Map<
      string,
      { x: number; y: number; w: number; h: number; cx: number; cy: number }
    >()

    nodes.forEach((n) => {
      const w = (n.style?.width as number) || 160
      const h = (n.style?.height as number) || 60
      const x = n.position.x
      const y = n.position.y

      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x + w > maxX) maxX = x + w
      if (y + h > maxY) maxY = y + h

      positions.set(n.id, {
        x,
        y,
        w,
        h,
        cx: x + w / 2,
        cy: y + h / 2,
      })
    })

    const padding = 40
    const boxX = minX - padding
    const boxY = minY - padding
    const boxW = Math.max(maxX - minX + padding * 2, 100)
    const boxH = Math.max(maxY - minY + padding * 2, 100)

    return {
      viewBox: `${boxX} ${boxY} ${boxW} ${boxH}`,
      nodePositions: positions,
    }
  }, [nodes])

  const renderShape = (node: (typeof nodes)[0]) => {
    const pos = nodePositions.get(node.id)
    if (!pos) return null
    const { x, y, w, h, cx, cy } = pos
    const colorKey = node.data?.color || 'default'
    const colors = NODE_COLORS[colorKey] || NODE_COLORS.default
    const shape = (node.data?.shape || 'rectangle') as NodeShape

    switch (shape) {
      case 'circle': {
        const r = Math.min(w, h) / 2
        return (
          <g key={node.id}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={colors.fill}
              stroke="var(--border-default)"
              strokeWidth="2"
            />
            <text
              x={cx}
              y={cy + 4}
              fill={colors.text}
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              className="select-none pointer-events-none font-sans"
            >
              {node.data?.label}
            </text>
          </g>
        )
      }
      case 'pill': {
        return (
          <g key={node.id}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={h / 2}
              ry={h / 2}
              fill={colors.fill}
              stroke="var(--border-default)"
              strokeWidth="2"
            />
            <text
              x={cx}
              y={cy + 4}
              fill={colors.text}
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              className="select-none pointer-events-none font-sans"
            >
              {node.data?.label}
            </text>
          </g>
        )
      }
      case 'diamond': {
        const points = `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`
        return (
          <g key={node.id}>
            <polygon
              points={points}
              fill={colors.fill}
              stroke="var(--border-default)"
              strokeWidth="2"
            />
            <text
              x={cx}
              y={cy + 4}
              fill={colors.text}
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              className="select-none pointer-events-none font-sans"
            >
              {node.data?.label?.split('\n')[0] || ''}
            </text>
          </g>
        )
      }
      case 'cylinder': {
        const ry = 10
        return (
          <g key={node.id}>
            <path
              d={`M ${x} ${y + ry} A ${w / 2} ${ry} 0 0 0 ${x + w} ${y + ry} v ${h - 2 * ry} A ${w / 2} ${ry} 0 0 1 ${x} ${y + h - ry} Z`}
              fill={colors.fill}
              stroke="var(--border-default)"
              strokeWidth="2"
            />
            <ellipse
              cx={cx}
              cy={y + ry}
              rx={w / 2}
              ry={ry}
              fill={colors.fill}
              stroke="var(--border-default)"
              strokeWidth="2"
            />
            <text
              x={cx}
              y={cy + 6}
              fill={colors.text}
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              className="select-none pointer-events-none font-sans"
            >
              {node.data?.label}
            </text>
          </g>
        )
      }
      case 'hexagon': {
        const offset = w * 0.2
        const pts = `${x + offset},${y} ${x + w - offset},${y} ${x + w},${cy} ${x + w - offset},${y + h} ${x + offset},${y + h} ${x},${cy}`
        return (
          <g key={node.id}>
            <polygon
              points={pts}
              fill={colors.fill}
              stroke="var(--border-default)"
              strokeWidth="2"
            />
            <text
              x={cx}
              y={cy + 4}
              fill={colors.text}
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              className="select-none pointer-events-none font-sans"
            >
              {node.data?.label}
            </text>
          </g>
        )
      }
      case 'rectangle':
      default: {
        return (
          <g key={node.id}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="8"
              ry="8"
              fill={colors.fill}
              stroke="var(--border-default)"
              strokeWidth="2"
            />
            <text
              x={cx}
              y={cy + 4}
              fill={colors.text}
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              className="select-none pointer-events-none font-sans"
            >
              {node.data?.label}
            </text>
          </g>
        )
      }
    }
  }

  return (
    <div className="w-full h-44 bg-bg-base/60 rounded-xl border border-border-subtle overflow-hidden flex items-center justify-center p-2">
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker
            id={`arrow-${template.id}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--color-slate-500, #64748b)" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge) => {
          const from = nodePositions.get(edge.source)
          const to = nodePositions.get(edge.target)
          if (!from || !to) return null

          return (
            <line
              key={edge.id}
              x1={from.cx}
              y1={from.cy}
              x2={to.cx}
              y2={to.cy}
              stroke="var(--border-default)"
              strokeWidth="2"
              strokeDasharray="4 4"
              markerEnd={`url(#arrow-${template.id})`}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((node) => renderShape(node))}
      </svg>
    </div>
  )
}

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: CanvasTemplate) => void
  hasExistingNodes?: boolean
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onSelectTemplate,
  hasExistingNodes = false,
}: StarterTemplatesModalProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [pendingTemplate, setPendingTemplate] = useState<CanvasTemplate | null>(null)

  const categories = useMemo(() => {
    const cats = new Set(CANVAS_TEMPLATES.map((t) => t.category))
    return ['All', ...Array.from(cats)]
  }, [])

  const filteredTemplates = useMemo(() => {
    return CANVAS_TEMPLATES.filter((t) => {
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [search, selectedCategory])

  const handleApply = (template: CanvasTemplate) => {
    if (hasExistingNodes) {
      setPendingTemplate(template)
    } else {
      onSelectTemplate(template)
      onOpenChange(false)
    }
  }

  const confirmApply = () => {
    if (pendingTemplate) {
      onSelectTemplate(pendingTemplate)
      setPendingTemplate(null)
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className="sm:max-w-4xl max-w-4xl h-[82vh] max-h-[82vh] overflow-hidden"
        >
          <DialogHeader className="pb-4 border-b border-white/[0.06] pr-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#15303d_0%,#0c1f28_100%)] text-[#8ee0ea] ring-1 ring-white/10">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Starter Blueprints</DialogTitle>
                <DialogDescription className="text-text-muted text-xs mt-0.5">
                  Skip the blank-canvas stare — drop in a ready-made system and make it yours.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-bg-base/85 border-white/[0.09] text-text-primary placeholder:text-text-faint rounded-xl text-sm focus-visible:border-accent-primary/65"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <EditorButton
                  key={cat}
                  tone={selectedCategory === cat ? 'primarySoft' : 'socket'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs px-3"
                >
                  {cat}
                </EditorButton>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="flex flex-col justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-accent-primary/45 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors text-base truncate">
                      {template.name}
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.05] text-text-muted border border-white/[0.08] shrink-0">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  <TemplatePreview template={template} />
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {template.nodes.length} nodes · {template.edges.length} edges
                  </span>
                  <EditorButton
                    tone="primary"
                    size="sm"
                    onClick={() => handleApply(template)}
                    className="px-4"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Use Template
                  </EditorButton>
                </div>
              </div>
            ))}

            {filteredTemplates.length === 0 && (
              <div className="col-span-full py-12 text-center text-text-muted">
                <p className="text-sm">
                  Nothing matched &quot;{search}&quot; — try another keyword or browse all.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Overwriting */}
      <Dialog
        open={Boolean(pendingTemplate)}
        onOpenChange={(isOpen) => !isOpen && setPendingTemplate(null)}
      >
        <DialogContent showCloseButton className="sm:max-w-[440px]">
          <DialogHeader className="flex-row items-center gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Wipe the Current Canvas?</DialogTitle>
              <DialogDescription className="text-text-muted text-xs mt-1">
                Dropping in &quot;{pendingTemplate?.name}&quot; clears whatever&apos;s on the board
                right now. Sure you want a fresh slate?
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter>
            <EditorButton
              tone="socket"
              size="md"
              onClick={() => setPendingTemplate(null)}
            >
              Never Mind
            </EditorButton>
            <EditorButton
              tone="destructive"
              size="md"
              onClick={confirmApply}
            >
              Yep, Replace It
            </EditorButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
