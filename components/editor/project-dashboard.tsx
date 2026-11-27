'use client'

import React, { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Archive,
  ArrowUpRight,
  Clock,
  Folder,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { EditorButton } from './editor-button'
import { AnchoredPopup } from './anchored-popup'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { CanvasPreview } from './project-dashboard/canvas-preview'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useProjectActions } from '../../hooks/use-project-actions'
import { Doc } from '@/convex/_generated/dataModel'
import { parseSearchQuery, searchProjects, type SearchableProject } from '@/lib/search-engine'

type ProjectWithMeta = Doc<'projects'> & {
  isPinned?: boolean
  canManage?: boolean
  activeUsers?: number
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const mins = Math.max(0, Math.floor(diffMs / 60000))
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border',
        status === 'DRAFT' && 'bg-white/[0.04] border-white/[0.08] text-text-muted',
        status === 'REVIEW' && 'bg-[#12303b] border-[#7ecbd4]/30 text-[#8ee0ea]',
        status === 'ARCHIVED' && 'bg-state-error/10 border-state-error/25 text-state-error'
      )}
    >
      {status === 'REVIEW' ? 'In Review' : status === 'ARCHIVED' ? 'Archived' : 'Draft'}
    </span>
  )
}

interface ProjectMenuContentProps {
  project: ProjectWithMeta
  onTogglePin: (id: string) => void
  onRename: (project: Doc<'projects'>) => void
  onArchive: (id: string) => void
  onDelete: (project: Doc<'projects'>) => void
  onClose: () => void
}

function ProjectMenuContent({
  project,
  onTogglePin,
  onRename,
  onArchive,
  onDelete,
  onClose,
}: ProjectMenuContentProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onTogglePin(project._id)
          onClose()
        }}
        className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-white/[0.07] hover:text-text-primary focus-visible:bg-white/[0.09] focus-visible:text-text-primary focus-visible:outline-none transition-colors cursor-pointer"
      >
        {project.isPinned ? (
          <PinOff className="h-3.5 w-3.5 text-text-muted shrink-0" />
        ) : (
          <Pin className="h-3.5 w-3.5 text-[#7ecbd4] shrink-0" />
        )}
        <span>{project.isPinned ? 'Unpin' : 'Pin to top'}</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRename(project)
          onClose()
        }}
        className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-white/[0.07] hover:text-text-primary focus-visible:bg-white/[0.09] focus-visible:text-text-primary focus-visible:outline-none transition-colors cursor-pointer"
      >
        <Pencil className="h-3.5 w-3.5 text-text-muted shrink-0" />
        <span>Rename</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onArchive(project._id)
          onClose()
        }}
        className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-white/[0.07] hover:text-text-primary focus-visible:bg-white/[0.09] focus-visible:text-text-primary focus-visible:outline-none transition-colors cursor-pointer"
      >
        <Archive className="h-3.5 w-3.5 text-text-muted shrink-0" />
        <span>Archive</span>
      </button>
      <hr className="my-1 border-white/[0.06]" />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(project)
          onClose()
        }}
        className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-state-error/90 hover:bg-state-error/10 hover:text-state-error focus-visible:bg-state-error/10 focus-visible:outline-none transition-colors cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        <span>Delete</span>
      </button>
    </div>
  )
}

interface ProjectCardProps {
  project: ProjectWithMeta
  isOwner: boolean
  onTogglePin: (id: string) => void
  onArchive: (id: string) => void
  onRename: (project: Doc<'projects'>) => void
  onDelete: (project: Doc<'projects'>) => void
  onClick: (roomId: string) => void
}

function ProjectCard({
  project,
  isOwner,
  onTogglePin,
  onArchive,
  onRename,
  onDelete,
  onClick,
}: ProjectCardProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(project.roomId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(project.roomId)
        }
      }}
      onMouseEnter={() => router.prefetch(`/editor/${project.roomId}`)}
      className={cn(
        'group relative flex flex-col rounded-2xl p-3.5 cursor-pointer transition-all duration-200 outline-none',
        'bg-[#0e141c]/90 border border-white/[0.07] shadow-[0_14px_34px_-16px_rgba(0,0,0,0.85)]',
        'hover:border-[#7ecbd4]/35 hover:bg-[#121a24] focus-visible:ring-2 focus-visible:ring-accent-primary/60'
      )}
    >
      {/* Visual Preview Banner */}
      <div className="relative h-32 w-full mb-3.5">
        <CanvasPreview snapshot={project.canvasSnapshot} />

        {/* Top-left Status & Live Presence */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
          <StatusBadge status={project.status} />
          {(project.activeUsers ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-bg-base/85 border border-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-state-success">
              <span className="h-1.5 w-1.5 rounded-full bg-state-success animate-pulse" />
              {project.activeUsers} live
            </span>
          )}
        </div>

        {/* Top-right Pin Indicator + Actions */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          {project.isPinned && (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-base/80 border border-white/[0.08] text-[#7ecbd4]"
              title="Pinned"
            >
              <Pin className="h-3 w-3" />
            </span>
          )}

          {isOwner && (
            <>
              <EditorButton
                ref={menuTriggerRef}
                tone="socket"
                size="icon-sm"
                aria-label="Project options"
                aria-expanded={showMenu}
                className={cn(
                  'h-7 w-7 transition-opacity',
                  showMenu
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu((prev) => !prev)
                }}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </EditorButton>
              <AnchoredPopup
                open={showMenu}
                onOpenChange={setShowMenu}
                anchorRef={menuTriggerRef}
                align="end"
                minWidth={184}
                maxWidth={212}
                enableArrowNavigation
                className="p-1.5"
              >
                <ProjectMenuContent
                  project={project}
                  onTogglePin={onTogglePin}
                  onRename={onRename}
                  onArchive={onArchive}
                  onDelete={onDelete}
                  onClose={() => setShowMenu(false)}
                />
              </AnchoredPopup>
            </>
          )}
        </div>
      </div>

      {/* Title + Room Slug */}
      <div className="space-y-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-white transition-colors">
            {project.name}
          </h3>
          <ArrowUpRight className="h-3.5 w-3.5 text-text-faint opacity-0 group-hover:opacity-100 group-hover:text-[#7ecbd4] transition-all shrink-0" />
        </div>
        <p className="text-[11px] text-text-faint font-mono truncate">ghost.ai/{project.roomId}</p>
      </div>

      {/* Footer Meta */}
      <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-text-muted">
        <span>
          {project.nodeCount
            ? `${project.nodeCount} node${project.nodeCount === 1 ? '' : 's'}`
            : 'Blank board'}
        </span>
        <span className="text-text-faint">{formatRelativeTime(project.updatedAt)}</span>
      </div>
    </div>
  )
}

interface ProjectListViewProps {
  projects: ProjectWithMeta[]
  selectedProjects: string[]
  setSelectedProjects: React.Dispatch<React.SetStateAction<string[]>>
  canManageRows: boolean
  onOpen: (roomId: string) => void
  onTogglePin: (id: string) => void
  onArchive: (id: string) => void
  onRename: (project: Doc<'projects'>) => void
  onDelete: (project: Doc<'projects'>) => void
}

function ProjectListView({
  projects,
  selectedProjects,
  setSelectedProjects,
  canManageRows,
  onOpen,
  onTogglePin,
  onArchive,
  onRename,
  onDelete,
}: ProjectListViewProps) {
  const [menuProject, setMenuProject] = useState<ProjectWithMeta | null>(null)
  const menuAnchorRef = useRef<HTMLElement | null>(null)

  return (
    <div className="rounded-2xl bg-[#0e141c]/90 border border-white/[0.07] overflow-hidden shadow-[0_14px_34px_-16px_rgba(0,0,0,0.85)]">
      <div className="grid grid-cols-12 px-4 sm:px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.06] text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em]">
        <div className="col-span-1 flex items-center" />
        <div className="col-span-6 sm:col-span-5">Blueprint</div>
        <div className="hidden sm:block sm:col-span-2">Status</div>
        <div className="col-span-2 hidden md:block">Nodes</div>
        <div className="col-span-4 sm:col-span-3 md:col-span-1 text-right">Edited</div>
        <div className="col-span-1" />
      </div>

      <div>
        {projects.map((project) => {
          const isRowOwner = canManageRows && (project.canManage ?? true)
          const checked = selectedProjects.includes(project._id)
          return (
            <div
              key={project._id}
              onClick={() => onOpen(project.roomId)}
              className="grid grid-cols-12 px-4 sm:px-5 py-3 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.04] transition-colors cursor-pointer group items-center"
            >
              <div
                className="col-span-1 flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) => {
                    if (next) {
                      setSelectedProjects((prev) => [...prev, project._id])
                    } else {
                      setSelectedProjects((prev) => prev.filter((id) => id !== project._id))
                    }
                  }}
                />
              </div>

              <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden">
                  <CanvasPreview snapshot={project.canvasSnapshot} compact />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-medium text-text-primary truncate group-hover:text-white">
                      {project.name}
                    </span>
                    {project.isPinned && <Pin className="h-3 w-3 text-[#7ecbd4] shrink-0" />}
                  </div>
                  <div className="text-[10px] font-mono text-text-faint truncate">
                    ghost.ai/{project.roomId}
                  </div>
                </div>
              </div>

              <div className="hidden sm:block sm:col-span-2">
                <StatusBadge status={project.status} />
              </div>

              <div className="col-span-2 hidden md:block text-xs text-text-muted">
                {project.nodeCount ? `${project.nodeCount} nodes` : '—'}
              </div>

              <div className="col-span-4 sm:col-span-3 md:col-span-1 text-right text-xs text-text-muted">
                {formatRelativeTime(project.updatedAt)}
              </div>

              <div
                className="col-span-1 flex justify-end"
                onClick={(e) => e.stopPropagation()}
              >
                {isRowOwner && (
                  <EditorButton
                    tone="ghost3d"
                    size="icon-sm"
                    aria-label="Project options"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-text-muted hover:text-text-primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (menuProject?._id === project._id) {
                        setMenuProject(null)
                      } else {
                        menuAnchorRef.current = e.currentTarget
                        setMenuProject(project)
                      }
                    }}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </EditorButton>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AnchoredPopup
        open={Boolean(menuProject)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setMenuProject(null)
        }}
        anchorRef={menuAnchorRef}
        align="end"
        minWidth={184}
        maxWidth={212}
        enableArrowNavigation
        className="p-1.5"
      >
        {menuProject && (
          <ProjectMenuContent
            project={menuProject}
            onTogglePin={onTogglePin}
            onRename={onRename}
            onArchive={onArchive}
            onDelete={onDelete}
            onClose={() => setMenuProject(null)}
          />
        )}
      </AnchoredPopup>
    </div>
  )
}

export function ProjectDashboard({
  onNewProject,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy: _setSortBy,
  viewMode,
  setViewMode: _setViewMode,
  actions,
}: {
  onNewProject: () => void
  searchQuery: string
  setSearchQuery: (val: string) => void
  sortBy: string
  setSortBy: React.Dispatch<React.SetStateAction<'recent' | 'oldest' | 'name-asc' | 'name-desc'>>
  viewMode: 'grid' | 'list'
  setViewMode: (val: 'grid' | 'list') => void
  actions: ReturnType<typeof useProjectActions>
}) {
  const router = useRouter()
  const projects = useQuery(api.projects.list)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'my-projects' | 'shared'>('my-projects')
  const parsedSearch = useMemo(() => parseSearchQuery(searchQuery), [searchQuery])

  const handleProjectClick = (roomId: string) => {
    router.push(`/editor/${roomId}`)
  }

  if (projects === undefined) {
    return (
      <div className="h-full w-full p-5 sm:p-8 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-44 rounded-lg bg-white/[0.06] animate-pulse" />
            <div className="h-3.5 w-32 rounded-md bg-white/[0.04] animate-pulse" />
          </div>
          <div className="h-9 w-48 rounded-xl bg-white/[0.05] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#0e141c]/80 border border-white/[0.06] p-3.5 space-y-3"
            >
              <div className="h-32 w-full rounded-xl bg-white/[0.04] animate-pulse" />
              <div className="h-4 w-2/3 rounded-md bg-white/[0.06] animate-pulse" />
              <div className="h-3 w-1/2 rounded-md bg-white/[0.04] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const myProjects = (projects?.owned ?? []) as ProjectWithMeta[]
  const sharedProjects = (projects?.shared ?? []) as ProjectWithMeta[]
  const allProjects = [...myProjects, ...sharedProjects]
  const allTags = Array.from(new Set(allProjects.flatMap((p) => p.tags || []))).sort()

  const sortProjects = (list: ProjectWithMeta[]) => {
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0)
        case 'recent':
        default:
          return (b.updatedAt || 0) - (a.updatedAt || 0)
      }
    })
  }

  const filterList = (list: ProjectWithMeta[]) => {
    const byTag = activeTag
      ? list.filter((p) => p.tags && p.tags.includes(activeTag))
      : list
    if (!searchQuery.trim()) return sortProjects(byTag)
    return searchProjects(byTag as SearchableProject[], parsedSearch).map(
      (r) => r.project as ProjectWithMeta
    )
  }

  const filteredProjects = filterList(allProjects)
  const recentProjects = [...filteredProjects]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 4)

  const filteredMyProjects = filterList(myProjects)
  const filteredSharedProjects = filterList(sharedProjects)

  const isFiltered = Boolean(searchQuery.trim() || activeTag)
  const currentList = activeTab === 'my-projects' ? filteredMyProjects : filteredSharedProjects
  const isOrgMode = Boolean(projects?.activeOrgId)

  const clearFilters = () => {
    setSearchQuery('')
    setActiveTag(null)
  }

  return (
    <div className="h-full w-full flex flex-col px-5 py-6 sm:px-8 sm:py-7 overflow-y-auto space-y-7">
      {/* Workspace Header & Segmented Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-lg sm:text-xl font-semibold tracking-tight text-text-primary">
            {isOrgMode ? 'Team Workspace' : 'Personal Studio'}
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            {myProjects.length} {isOrgMode ? 'team' : 'owned'} blueprint
            {myProjects.length === 1 ? '' : 's'}
            {sharedProjects.length > 0 ? ` · ${sharedProjects.length} shared` : ''}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Project collections"
          className="inline-flex items-center gap-1 rounded-2xl bg-[#0e141c] border border-white/[0.07] p-1 w-full sm:w-fit"
        >
          <EditorButton
            type="button"
            role="tab"
            aria-selected={activeTab === 'my-projects'}
            tone={activeTab === 'my-projects' ? 'surface' : 'ghost3d'}
            size="sm"
            onClick={() => setActiveTab('my-projects')}
            className="flex-1 sm:flex-initial px-3.5 text-xs"
          >
            <Folder
              className={cn(
                'h-3.5 w-3.5',
                activeTab === 'my-projects' ? 'text-[#7ecbd4]' : 'text-text-muted'
              )}
            />
            <span>{isOrgMode ? 'Team Projects' : 'My Projects'}</span>
            <span className="ml-0.5 text-[11px] text-text-muted">{filteredMyProjects.length}</span>
          </EditorButton>
          <EditorButton
            type="button"
            role="tab"
            aria-selected={activeTab === 'shared'}
            tone={activeTab === 'shared' ? 'surface' : 'ghost3d'}
            size="sm"
            onClick={() => setActiveTab('shared')}
            className="flex-1 sm:flex-initial px-3.5 text-xs"
          >
            <Users
              className={cn(
                'h-3.5 w-3.5',
                activeTab === 'shared' ? 'text-[#7ecbd4]' : 'text-text-muted'
              )}
            />
            <span>Shared</span>
            <span className="ml-0.5 text-[11px] text-text-muted">
              {filteredSharedProjects.length}
            </span>
          </EditorButton>
        </div>
      </div>

      {/* Recent Quick-Jump Strip */}
      {recentProjects.length > 0 && !isFiltered && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em] flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#7ecbd4]" />
            <span>Fresh off the canvas</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {recentProjects.map((project) => (
              <Link
                key={project._id}
                href={`/editor/${project.roomId}`}
                prefetch={true}
                className="p-3 rounded-2xl bg-[#0e141c]/90 border border-white/[0.07] hover:border-[#7ecbd4]/35 hover:bg-[#131b26] flex items-center gap-3 shadow-[0_10px_28px_-14px_rgba(0,0,0,0.85)] transition-all group"
              >
                <div className="h-11 w-11 shrink-0 rounded-xl overflow-hidden">
                  <CanvasPreview snapshot={project.canvasSnapshot} compact />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs sm:text-sm font-medium text-text-primary truncate group-hover:text-white">
                      {project.name}
                    </p>
                    {(project.activeUsers ?? 0) > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-state-success shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted truncate mt-0.5">
                    Edited {formatRelativeTime(project.updatedAt)}
                  </p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-text-faint opacity-0 group-hover:opacity-100 group-hover:text-[#7ecbd4] transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] uppercase tracking-wider text-text-muted font-medium mr-1 shrink-0">
            Tags
          </span>
          <EditorButton
            tone={activeTag === null ? 'primarySoft' : 'socket'}
            size="xs"
            onClick={() => setActiveTag(null)}
          >
            All
          </EditorButton>
          {allTags.map((tag) => (
            <EditorButton
              key={tag}
              tone={activeTag === tag ? 'primarySoft' : 'socket'}
              size="xs"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              #{tag}
            </EditorButton>
          ))}
        </div>
      )}

      {/* Bulk Action Floating Bar */}
      {selectedProjects.length > 0 && (
        <div className="p-3.5 bg-[#0e141c]/95 border border-[#7ecbd4]/25 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9)] flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="text-xs sm:text-sm font-medium text-[#8ee0ea]">
            {selectedProjects.length} picked — what&apos;s the move?
          </span>
          <div className="flex items-center gap-2">
            <EditorButton
              tone="socket"
              size="sm"
              onClick={() => setSelectedProjects([])}
              className="text-xs"
            >
              Cancel
            </EditorButton>
            <EditorButton
              tone="aiSoft"
              size="sm"
              onClick={() => {
                actions.handleBulkUpdateStatus(selectedProjects, 'ARCHIVED')
                setSelectedProjects([])
              }}
              className="text-xs"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archive</span>
            </EditorButton>
            <EditorButton
              tone="destructive"
              size="sm"
              onClick={() => {
                actions.handleBulkDelete(selectedProjects)
                setSelectedProjects([])
              }}
              className="text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </EditorButton>
          </div>
        </div>
      )}

      {/* Main Projects Content */}
      <section className="flex-1 min-h-0">
        {currentList.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentList.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  isOwner={activeTab === 'my-projects' && (project.canManage ?? true)}
                  onTogglePin={(id) => actions.handleTogglePin(id)}
                  onArchive={(id) => actions.handleUpdateStatus(id, 'ARCHIVED')}
                  onRename={(p) => actions.openRenameDialog(p)}
                  onDelete={(p) => actions.openDeleteDialog(p)}
                  onClick={handleProjectClick}
                />
              ))}
            </div>
          ) : (
            <ProjectListView
              projects={currentList}
              selectedProjects={selectedProjects}
              setSelectedProjects={setSelectedProjects}
              canManageRows={activeTab === 'my-projects'}
              onOpen={handleProjectClick}
              onTogglePin={(id) => actions.handleTogglePin(id)}
              onArchive={(id) => actions.handleUpdateStatus(id, 'ARCHIVED')}
              onRename={(p) => actions.openRenameDialog(p)}
              onDelete={(p) => actions.openDeleteDialog(p)}
            />
          )
        ) : (
          <div className="relative min-h-[300px] flex flex-col items-center justify-center text-center rounded-2xl bg-[#0e141c]/65 border border-white/[0.07] px-6 py-12 overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-48 w-48 rounded-full bg-[#00c8d4]/[0.06] blur-3xl"
            />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#152834_0%,#0c171f_100%)] border border-white/[0.08] shadow-[0_12px_28px_-8px_rgba(0,0,0,0.85)] text-[#7ecbd4] mb-4">
              {isFiltered ? (
                <Search className="h-5 w-5" />
              ) : activeTab === 'shared' ? (
                <Users className="h-5 w-5" />
              ) : (
                <Folder className="h-5 w-5" />
              )}
            </div>

            {isFiltered ? (
              <>
                <p className="text-sm font-semibold text-text-primary">
                  No blueprints matched that filter.
                </p>
                <p className="text-xs text-text-muted mt-1.5 max-w-sm">
                  Try another keyword, layer swatch, or reset active filters to see everything.
                </p>
                <EditorButton
                  tone="socket"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-5"
                >
                  Clear filters
                </EditorButton>
              </>
            ) : activeTab === 'shared' ? (
              <>
                <p className="text-sm font-semibold text-text-primary">
                  No invites in your inbox yet.
                </p>
                <p className="text-xs text-text-muted mt-1.5 max-w-sm">
                  When someone shares a blueprint with you, it&apos;ll show up right here.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-text-primary">
                  Spooky quiet in here.
                </p>
                <p className="text-xs text-text-muted mt-1.5 max-w-sm">
                  Summon your first architecture diagram and let Ghost AI help wire the stack.
                </p>
                <EditorButton
                  tone="primary"
                  size="md"
                  onClick={onNewProject}
                  className="mt-5"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Project</span>
                </EditorButton>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
