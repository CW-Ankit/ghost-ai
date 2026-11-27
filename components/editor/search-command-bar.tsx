'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import {
  Command,
  FileText,
  LayoutTemplate,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { api } from '@/convex/_generated/api'
import { CANVAS_TEMPLATES, type CanvasTemplate } from '@/components/editor/starter-templates'
import { CanvasPreview } from '@/components/editor/project-dashboard/canvas-preview'
import { NODE_COLORS, type CanvasEdge, type CanvasNode } from '@/types/canvas'
import {
  extractTopTags,
  getRecentSearches,
  hasActiveSearchFilters,
  parseSearchQuery,
  pushRecentSearch,
  searchCanvasNodes,
  searchProjects,
  searchQuickActions,
  searchTemplates,
  type MatchRange,
  type QuickActionItem,
  type SearchableProject,
} from '@/lib/search-engine'
import { cn } from '@/lib/utils'

interface SearchCommandBarProps {
  value?: string
  onValueChange?: (next: string) => void
  activeProjectId?: string
  canvasNodes?: CanvasNode[]
  canvasEdges?: CanvasEdge[]
  onJumpToNode?: (nodeId: string) => void
  onSelectTemplate?: (template: CanvasTemplate) => void
  quickActions?: QuickActionItem[]
  onRunQuickAction?: (actionId: string) => void
  placeholder?: string
}

const FALLBACK_TRENDING = ['microservices', 'kafka', 'status:review', 'color:purple']

function HighlightedText({ text, ranges }: { text: string; ranges: MatchRange[] }) {
  if (!ranges || ranges.length === 0) {
    return <>{text}</>
  }

  const parts: React.ReactNode[] = []
  let cursor = 0

  for (let i = 0; i < ranges.length; i++) {
    const [start, end] = ranges[i]
    if (start > cursor) {
      parts.push(<span key={`plain-${i}`}>{text.slice(cursor, start)}</span>)
    }
    parts.push(
      <mark
        key={`hit-${i}`}
        className="bg-white/15 text-text-primary rounded-[3px] px-0.5 font-semibold"
      >
        {text.slice(start, end)}
      </mark>
    )
    cursor = end
  }

  if (cursor < text.length) {
    parts.push(<span key="tail">{text.slice(cursor)}</span>)
  }

  return <>{parts}</>
}

type SelectableOption =
  | { kind: 'node'; id: string; nodeId: string; label: string }
  | { kind: 'project'; id: string; roomId: string; label: string }
  | { kind: 'template'; id: string; template: CanvasTemplate; label: string }
  | { kind: 'action'; id: string; actionId: string; label: string }

export function SearchCommandBar({
  value,
  onValueChange,
  activeProjectId,
  canvasNodes = [],
  canvasEdges = [],
  onJumpToNode,
  onSelectTemplate,
  quickActions = [],
  onRunQuickAction,
  placeholder = 'Hunt down a project, node, or blueprint...',
}: SearchCommandBarProps) {
  const router = useRouter()
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [internalQuery, setInternalQuery] = useState('')
  const query = value !== undefined ? value : internalQuery
  const setQuery = (next: string) => {
    if (value === undefined) setInternalQuery(next)
    onValueChange?.(next)
  }

  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const projectsData = useQuery(api.projects.list)

  const allProjects = useMemo(() => {
    if (!projectsData) return [] as SearchableProject[]
    return [...projectsData.owned, ...projectsData.shared] as SearchableProject[]
  }, [projectsData])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setRecentSearches(getRecentSearches())
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const handleGlobalKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen(true)
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  const parsed = useMemo(() => parseSearchQuery(query), [query])
  const isFiltering = hasActiveSearchFilters(parsed)

  const topTags = useMemo(() => extractTopTags(allProjects, 5), [allProjects])

  const trendingChips = useMemo(() => {
    const combined = [...recentSearches, ...topTags.map((t) => `#${t}`)]
    const deduped = Array.from(new Set(combined))
    return deduped.length > 0 ? deduped.slice(0, 6) : FALLBACK_TRENDING
  }, [recentSearches, topTags])

  const nodeResults = useMemo(() => {
    if (!isFiltering || canvasNodes.length === 0) return []
    return searchCanvasNodes(canvasNodes, canvasEdges, parsed).slice(0, 5)
  }, [isFiltering, canvasNodes, canvasEdges, parsed])

  const projectResults = useMemo(() => {
    if (!isFiltering) return []
    return searchProjects(allProjects, parsed).slice(0, 6)
  }, [isFiltering, allProjects, parsed])

  const templateResults = useMemo(() => {
    if (!isFiltering) return []
    return searchTemplates(CANVAS_TEMPLATES, parsed).slice(0, 3)
  }, [isFiltering, parsed])

  const actionResults = useMemo(() => {
    if (!isFiltering || quickActions.length === 0) return []
    return searchQuickActions(quickActions, parsed).slice(0, 4)
  }, [isFiltering, quickActions, parsed])

  const flatOptions: SelectableOption[] = useMemo(() => {
    const items: SelectableOption[] = []
    for (const r of nodeResults) {
      items.push({
        kind: 'node',
        id: `node-${r.node.id}`,
        nodeId: r.node.id,
        label: String(r.node.data?.label || r.node.id),
      })
    }
    for (const r of projectResults) {
      items.push({
        kind: 'project',
        id: `proj-${r.project._id}`,
        roomId: r.project.roomId,
        label: r.project.name,
      })
    }
    for (const r of templateResults) {
      items.push({
        kind: 'template',
        id: `tpl-${r.template.id}`,
        template: r.template,
        label: r.template.name,
      })
    }
    for (const r of actionResults) {
      items.push({
        kind: 'action',
        id: `act-${r.action.id}`,
        actionId: r.action.id,
        label: r.action.label,
      })
    }
    return items
  }, [nodeResults, projectResults, templateResults, actionResults])

  const clampedActiveIndex =
    flatOptions.length > 0 ? Math.min(activeIndex, flatOptions.length - 1) : -1

  const commitQueryHistory = (term: string) => {
    if (term.trim()) {
      setRecentSearches(pushRecentSearch(term))
    }
  }

  const executeOption = (opt: SelectableOption) => {
    commitQueryHistory(query || opt.label)
    setIsOpen(false)

    if (opt.kind === 'node') {
      onJumpToNode?.(opt.nodeId)
      return
    }
    if (opt.kind === 'project') {
      router.push(`/editor/${opt.roomId}`)
      return
    }
    if (opt.kind === 'template') {
      onSelectTemplate?.(opt.template)
      return
    }
    if (opt.kind === 'action') {
      onRunQuickAction?.(opt.actionId)
    }
  }

  const applyFilterChip = (chip: string) => {
    setQuery(chip)
    setActiveIndex(0)
    inputRef.current?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
      inputRef.current?.blur()
      return
    }

    if (!isOpen) {
      if (event.key === 'ArrowDown') {
        setIsOpen(true)
      }
      return
    }

    if (event.key === 'ArrowDown' && flatOptions.length > 0) {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % flatOptions.length)
      return
    }

    if (event.key === 'ArrowUp' && flatOptions.length > 0) {
      event.preventDefault()
      setActiveIndex((prev) => (prev - 1 + flatOptions.length) % flatOptions.length)
      return
    }

    if (event.key === 'Enter' && clampedActiveIndex >= 0 && flatOptions[clampedActiveIndex]) {
      event.preventDefault()
      executeOption(flatOptions[clampedActiveIndex])
    }
  }

  return (
    <>
      {/* Dimmed Backdrop when Popover is Open */}
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] transition-opacity duration-150"
        />
      )}

      <div ref={containerRef} className="relative z-50 w-full max-w-xl">
        {/* Search Bar Input */}
        <div
          className={cn(
            'relative flex items-center h-10 rounded-2xl transition-all duration-150',
            isOpen
              ? 'bg-[#17171c] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)]'
              : 'bg-black/35 shadow-[inset_0_1px_3px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.05)] hover:bg-black/45'
          )}
        >
          <Search className="pointer-events-none ml-3.5 h-4 w-4 text-text-muted shrink-0" />

          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-activedescendant={
              clampedActiveIndex >= 0 && flatOptions[clampedActiveIndex]
                ? flatOptions[clampedActiveIndex].id
                : undefined
            }
            aria-label="Search Ghost AI"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
              if (!isOpen) setIsOpen(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 min-w-0 h-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-muted outline-none"
          />

          <div className="flex items-center gap-1 pr-2.5 shrink-0">
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setActiveIndex(0)
                  inputRef.current?.focus()
                }}
                aria-label="Clear search"
                className="rounded-lg p-1 text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.06] font-mono text-[10px] text-text-muted">
                Ctrl K
              </kbd>
            )}
          </div>
        </div>

        {/* Cosmos-Style Anchored Search Popover */}
        {isOpen && (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Search suggestions and results"
            className="absolute left-1/2 -translate-x-1/2 w-[max(100%,min(92vw,600px))] max-w-[calc(100vw-1.5rem)] top-[calc(100%+8px)] rounded-2xl bg-[#0e141c]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_28px_70px_-12px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden p-4 space-y-4 max-h-[min(74vh,640px)] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {!isFiltering ? (
              <>
                {/* Recent & Tags */}
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-text-muted">Recent &amp; Tags</div>
                  <div className="flex flex-wrap gap-1.5">
                    {trendingChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => applyFilterChip(chip)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : flatOptions.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <p className="text-xs font-medium text-text-secondary">
                  Nothing popped up for that.
                </p>
                <p className="text-[11px] text-text-muted">
                  Try another keyword, or use filters like{' '}
                  <code className="font-mono text-text-secondary">color:green</code> or{' '}
                  <code className="font-mono text-text-secondary">status:review</code>.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {nodeResults.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                      On This Canvas
                    </div>
                    {nodeResults.map((hit) => {
                      const idx = flatOptions.findIndex((o) => o.id === `node-${hit.node.id}`)
                      const isActive = idx === clampedActiveIndex
                      const palette =
                        NODE_COLORS[String(hit.node.data?.color || 'default')] ||
                        NODE_COLORS.default
                      return (
                        <button
                          key={hit.node.id}
                          id={`node-${hit.node.id}`}
                          role="option"
                          aria-selected={isActive}
                          type="button"
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() =>
                            executeOption({
                              kind: 'node',
                              id: `node-${hit.node.id}`,
                              nodeId: hit.node.id,
                              label: String(hit.node.data?.label || hit.node.id),
                            })
                          }
                          className={cn(
                            'w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer',
                            isActive ? 'bg-white/[0.1]' : 'hover:bg-white/[0.06]'
                          )}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: palette.text }}
                            />
                            <span className="text-xs font-medium text-text-primary truncate">
                              <HighlightedText
                                text={String(hit.node.data?.label || hit.node.id)}
                                ranges={hit.labelMatches}
                              />
                            </span>
                            <span className="text-[10px] font-mono text-text-muted">
                              {hit.node.data?.shape}
                            </span>
                          </span>
                          <span className="text-[11px] text-text-muted shrink-0">
                            Jump to node
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {projectResults.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                      Projects
                    </div>
                    {projectResults.map((hit) => {
                      const idx = flatOptions.findIndex((o) => o.id === `proj-${hit.project._id}`)
                      const isActive = idx === clampedActiveIndex
                      const isCurrent = hit.project._id === activeProjectId
                      return (
                        <button
                          key={hit.project._id}
                          id={`proj-${hit.project._id}`}
                          role="option"
                          aria-selected={isActive}
                          type="button"
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() =>
                            executeOption({
                              kind: 'project',
                              id: `proj-${hit.project._id}`,
                              roomId: hit.project.roomId,
                              label: hit.project.name,
                            })
                          }
                          className={cn(
                            'w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer',
                            isActive ? 'bg-white/[0.1]' : 'hover:bg-white/[0.06]'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-bg-subtle overflow-hidden shrink-0">
                              {hit.project.canvasSnapshot ? (
                                <CanvasPreview snapshot={hit.project.canvasSnapshot} />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-[#7ecbd4]">
                                  <FileText className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-text-primary truncate">
                                <HighlightedText
                                  text={hit.project.name}
                                  ranges={hit.nameMatches}
                                />
                              </div>
                              <div className="text-[10px] text-text-muted truncate">
                                {hit.matchHint || `ghost.ai/${hit.project.roomId}`}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-text-muted shrink-0">
                            {isCurrent ? 'Current' : hit.project.status}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {templateResults.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                      Starter Blueprints
                    </div>
                    {templateResults.map((hit) => {
                      const idx = flatOptions.findIndex((o) => o.id === `tpl-${hit.template.id}`)
                      const isActive = idx === clampedActiveIndex
                      return (
                        <button
                          key={hit.template.id}
                          id={`tpl-${hit.template.id}`}
                          role="option"
                          aria-selected={isActive}
                          type="button"
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() =>
                            executeOption({
                              kind: 'template',
                              id: `tpl-${hit.template.id}`,
                              template: hit.template,
                              label: hit.template.name,
                            })
                          }
                          className={cn(
                            'w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer',
                            isActive ? 'bg-white/[0.1]' : 'hover:bg-white/[0.06]'
                          )}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <LayoutTemplate className="h-4 w-4 text-[#7ecbd4] shrink-0" />
                            <span className="text-xs font-medium text-text-primary truncate">
                              <HighlightedText
                                text={hit.template.name}
                                ranges={hit.nameMatches}
                              />
                            </span>
                            <span className="text-[10px] text-text-muted truncate hidden sm:inline">
                              {hit.template.category}
                            </span>
                          </span>
                          <span className="text-[10px] text-text-muted shrink-0">
                            {hit.template.nodes.length} nodes
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {actionResults.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                      Quick Actions
                    </div>
                    {actionResults.map((hit) => {
                      const idx = flatOptions.findIndex((o) => o.id === `act-${hit.action.id}`)
                      const isActive = idx === clampedActiveIndex
                      return (
                        <button
                          key={hit.action.id}
                          id={`act-${hit.action.id}`}
                          role="option"
                          aria-selected={isActive}
                          type="button"
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() =>
                            executeOption({
                              kind: 'action',
                              id: `act-${hit.action.id}`,
                              actionId: hit.action.id,
                              label: hit.action.label,
                            })
                          }
                          className={cn(
                            'w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer',
                            isActive ? 'bg-white/[0.1]' : 'hover:bg-white/[0.06]'
                          )}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <Sparkles className="h-3.5 w-3.5 text-accent-ai-text shrink-0" />
                            <span className="text-xs font-medium text-text-primary truncate">
                              <HighlightedText
                                text={hit.action.label}
                                ranges={hit.labelMatches}
                              />
                            </span>
                            <span className="text-[11px] text-text-muted truncate hidden sm:inline">
                              {hit.action.description}
                            </span>
                          </span>
                          <Command className="h-3 w-3 text-text-muted shrink-0" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
