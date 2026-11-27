'use client'

import React from 'react'
import Link from 'next/link'
import { GhostOrgSwitcher } from '@/components/clerk/ghost-org-switcher'
import {
  Plus,
  X,
  MoreVertical,
  Pencil,
  Trash2,
  Folder,
  Users,
  FileText,
  Pin,
  PinOff,
  Share2,
} from 'lucide-react'
import { EditorButton } from './editor-button'
import { AnchoredPopup } from './anchored-popup'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ClientOnly } from '@/components/ui/client-only'
import { cn } from '@/lib/utils'
import { useProjectActions } from '../../hooks/use-project-actions'
import { Doc } from '@/convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

interface ProjectWithMeta extends Doc<'projects'> {
  isPinned?: boolean
  activeUsers?: number
  canManage?: boolean
}

interface ProjectSidebarProps {
  id?: string
  isDesktopOpen: boolean
  isMobileOpen: boolean
  onCloseDesktop: () => void
  onCloseMobile: () => void
  actions: ReturnType<typeof useProjectActions>
  activeProjectId?: string
  searchQuery?: string
  sortBy?: 'name-asc' | 'name-desc' | 'recent' | 'oldest' | string
}

export function ProjectSidebar({
  id = 'editor-sidebar',
  isDesktopOpen,
  isMobileOpen,
  onCloseDesktop,
  onCloseMobile,
  actions,
  activeProjectId,
  searchQuery = '',
  sortBy = 'recent',
}: ProjectSidebarProps) {
  const [menuState, setMenuState] = React.useState<{
    project: ProjectWithMeta
    canManage: boolean
  } | null>(null)
  const menuAnchorRef = React.useRef<HTMLElement | null>(null)
  const [activeTab, setActiveTab] = React.useState<'primary' | 'shared'>('primary')

  React.useEffect(() => {
    if (!isMobileOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseMobile()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMobileOpen, onCloseMobile])

  const projects = useQuery(api.projects.list)

  const filterAndSortProjects = (projectList: ProjectWithMeta[]) => {
    const filtered = projectList.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'recent':
          return (b.updatedAt || 0) - (a.updatedAt || 0)
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0)
        default:
          return 0
      }
    })
  }

  const allProjects = projects
    ? ([...projects.owned, ...projects.shared] as ProjectWithMeta[])
    : []
  const pinnedProjects = filterAndSortProjects(allProjects).filter((p) => p.isPinned)
  const primaryProjects = projects
    ? filterAndSortProjects(projects.owned as ProjectWithMeta[]).filter((p) => !p.isPinned)
    : []
  const sharedProjects = projects
    ? filterAndSortProjects(projects.shared as ProjectWithMeta[]).filter((p) => !p.isPinned)
    : []

  const isOrgMode = Boolean(projects?.activeOrgId)
  const visibleList = activeTab === 'primary' ? primaryProjects : sharedProjects

  const renderProjectRow = (project: ProjectWithMeta, allowManageActions: boolean) => {
    const canManage = allowManageActions && (project.canManage ?? true)
    const isActive = activeProjectId === project._id

    return (
      <Link
        key={project._id}
        href={`/editor/${project.roomId}`}
        onClick={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            onCloseMobile()
          }
        }}
        className={cn(
          'group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl transition-colors text-xs',
          isActive
            ? 'bg-white/[0.09] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
            : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.05]'
        )}
      >
        <span className="font-medium truncate flex items-center gap-2 min-w-0">
          <FileText
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              isActive ? 'text-[#7ecbd4]' : 'text-text-muted'
            )}
          />
          <span className="truncate">{project.name}</span>
          {(project.activeUsers ?? 0) > 0 && (
            <span
              className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-state-success animate-pulse"
              title={`${project.activeUsers} active`}
            />
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {project.isPinned && (
            <EditorButton
              tone="ghost3d"
              size="icon-sm"
              aria-label="Unpin project"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-text-muted hover:text-accent-primary"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                actions.handleTogglePin(project._id)
              }}
            >
              <PinOff className="h-3 w-3" />
            </EditorButton>
          )}

          <EditorButton
            tone="ghost3d"
            size="icon-sm"
            aria-label="More project actions"
            aria-expanded={menuState?.project._id === project._id}
            className={cn(
              'h-6 w-6 text-text-muted hover:text-text-primary transition-opacity',
              menuState?.project._id === project._id
                ? 'opacity-100 text-text-primary'
                : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (menuState?.project._id === project._id) {
                setMenuState(null)
              } else {
                menuAnchorRef.current = e.currentTarget
                setMenuState({ project, canManage })
              }
            }}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </EditorButton>
        </div>
      </Link>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full w-[264px] select-none">
      {/* Top: Organization Switcher + Mobile Close */}
      <div className="px-2.5 pt-1 pb-3 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between lg:hidden px-1 pb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Workspace
          </span>
          <EditorButton
            tone="socket"
            size="icon-sm"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <X className="h-3.5 w-3.5" />
          </EditorButton>
        </div>

        <div className="rounded-2xl bg-black/25 p-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.04)]">
          <ClientOnly>
            <GhostOrgSwitcher />
          </ClientOnly>
        </div>
      </div>

      {/* Projects Region (fills space cleanly below Organization Switcher) */}
      <div className="flex-1 min-h-0 flex flex-col px-2.5 pb-1 gap-3">
        {pinnedProjects.length > 0 && (
          <div className="space-y-1.5 shrink-0">
            <div className="px-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              <Pin className="h-3 w-3 text-[#7ecbd4]" />
              <span>Pinned</span>
            </div>
            <div className="flex flex-col gap-0.5 max-h-36 overflow-y-auto pr-0.5">
              {pinnedProjects.map((p) => renderProjectRow(p, true))}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-1 px-1 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted px-1">
              Projects
            </span>
            <div className="flex items-center gap-1 bg-black/25 p-0.5 rounded-xl">
              <EditorButton
                tone={activeTab === 'primary' ? 'surface' : 'ghost3d'}
                size="xs"
                onClick={() => setActiveTab('primary')}
                className="h-6 px-2 text-[11px] rounded-lg"
              >
                <Folder className="h-3 w-3" />
                <span>{isOrgMode ? 'Team' : 'Mine'}</span>
              </EditorButton>
              <EditorButton
                tone={activeTab === 'shared' ? 'surface' : 'ghost3d'}
                size="xs"
                onClick={() => setActiveTab('shared')}
                className="h-6 px-2 text-[11px] rounded-lg"
              >
                <Users className="h-3 w-3" />
                <span>Shared</span>
              </EditorButton>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0 pr-1">
            <div className="flex flex-col gap-0.5 pb-1">
              {visibleList.length > 0 ? (
                visibleList.map((p) => renderProjectRow(p, activeTab === 'primary'))
              ) : (
                <div className="py-6 px-3 text-center text-xs text-text-muted rounded-xl bg-white/[0.02]">
                  {activeTab === 'primary'
                    ? isOrgMode
                      ? 'Pretty quiet in this org. Start something new below.'
                      : 'Nothing on the shelf yet. Start something below.'
                    : 'No shared rooms yet.'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer CTA */}
        <div className="pt-1 shrink-0">
          <EditorButton
            tone="surface"
            size="md"
            onClick={actions.openCreateDialog}
            className="w-full"
          >
            <Plus className="h-4 w-4 text-[#7ecbd4]" />
            New Project
          </EditorButton>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile / Tablet Backdrop (stays mounted for smooth close fade) */}
      <div
        aria-hidden={!isMobileOpen}
        onClick={onCloseMobile}
        className={cn(
          'fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:hidden',
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Mobile / Tablet Slide Drawer */}
      <aside
        id={`${id}-mobile`}
        aria-label="Workspace navigation"
        aria-hidden={!isMobileOpen}
        inert={!isMobileOpen ? true : undefined}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[276px] p-3 bg-[linear-gradient(180deg,var(--bg-shell)_0%,var(--bg-shell-deep)_100%)] border-r border-border-shell shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Inline Collapsible Sidebar inside the Dark Navy Shell */}
      <aside
        id={id}
        aria-label="Workspace navigation"
        aria-hidden={!isDesktopOpen}
        inert={!isDesktopOpen ? true : undefined}
        className={cn(
          'hidden lg:block shrink-0 h-full overflow-hidden transition-[width,opacity,transform,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          isDesktopOpen
            ? 'w-[264px] mr-3 opacity-100 translate-x-0'
            : 'w-0 mr-0 opacity-0 -translate-x-4 pointer-events-none'
        )}
      >
        {sidebarContent}
      </aside>

      <AnchoredPopup
        open={Boolean(menuState)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setMenuState(null)
        }}
        anchorRef={menuAnchorRef}
        align="end"
        minWidth={184}
        maxWidth={216}
        enableArrowNavigation
        className="p-1.5"
      >
        {menuState && (
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => {
                actions.openShareDialog(menuState.project)
                setMenuState(null)
              }}
              className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-white/[0.07] hover:text-text-primary focus-visible:bg-white/[0.09] focus-visible:text-text-primary focus-visible:outline-none transition-colors cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5 text-[#7ecbd4] shrink-0" />
              <span>Share</span>
            </button>
            <button
              type="button"
              onClick={() => {
                actions.handleTogglePin(menuState.project._id)
                setMenuState(null)
              }}
              className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-white/[0.07] hover:text-text-primary focus-visible:bg-white/[0.09] focus-visible:text-text-primary focus-visible:outline-none transition-colors cursor-pointer"
            >
              {menuState.project.isPinned ? (
                <PinOff className="h-3.5 w-3.5 text-text-muted shrink-0" />
              ) : (
                <Pin className="h-3.5 w-3.5 text-text-muted shrink-0" />
              )}
              <span>{menuState.project.isPinned ? 'Unpin' : 'Pin to top'}</span>
            </button>
            {menuState.canManage && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    actions.openRenameDialog(menuState.project)
                    setMenuState(null)
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-white/[0.07] hover:text-text-primary focus-visible:bg-white/[0.09] focus-visible:text-text-primary focus-visible:outline-none transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5 text-text-muted shrink-0" />
                  <span>Rename</span>
                </button>
                <hr className="my-1 border-white/[0.06]" />
                <button
                  type="button"
                  onClick={() => {
                    actions.openDeleteDialog(menuState.project)
                    setMenuState(null)
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-state-error/90 hover:bg-state-error/10 hover:text-state-error focus-visible:bg-state-error/10 focus-visible:outline-none transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        )}
      </AnchoredPopup>
    </>
  )
}
