'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 rounded-3xl bg-bg-surface border-border-default text-text-primary">
          <DialogHeader className="pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Starter Templates</DialogTitle>
                <DialogDescription className="text-text-muted text-sm mt-0.5">
                  Kickstart your system architecture with pre-built, production-grade templates.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-bg-subtle border-border-subtle text-text-primary placeholder:text-text-faint rounded-xl text-sm"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs h-9 rounded-xl px-3 transition-colors ${
                    selectedCategory === cat
                      ? 'bg-accent-primary/15 text-accent-primary font-medium border border-accent-primary/30'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto pr-1 -mr-1 py-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="flex flex-col justify-between p-4 rounded-2xl bg-bg-elevated border border-border-subtle hover:border-accent-primary/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors text-base">
                      {template.name}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-bg-subtle text-text-muted border border-border-subtle">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  <TemplatePreview template={template} />
                </div>

                <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {template.nodes.length} nodes · {template.edges.length} edges
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleApply(template)}
                    className="bg-accent-primary text-bg-base hover:bg-accent-primary/90 rounded-lg text-xs font-medium h-8 px-4"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Use Template
                  </Button>
                </div>
              </div>
            ))}

            {filteredTemplates.length === 0 && (
              <div className="col-span-full py-12 text-center text-text-muted">
                <p className="text-sm">No templates found matching &quot;{search}&quot;</p>
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
        <DialogContent className="max-w-md p-6 rounded-3xl bg-bg-surface border-border-default text-text-primary">
          <DialogHeader className="flex-row items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Replace Current Canvas?</DialogTitle>
              <DialogDescription className="text-text-muted text-sm mt-1">
                Loading &quot;{pendingTemplate?.name}&quot; will clear all existing nodes and edges
                on your canvas. This action cannot be undone.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setPendingTemplate(null)}
              className="text-text-secondary hover:text-text-primary rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmApply}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Replace Canvas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
