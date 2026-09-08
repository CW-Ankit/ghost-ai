'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import { useProjectActions } from '../../hooks/use-project-actions'
import { Doc } from '@/convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  actions: ReturnType<typeof useProjectActions>
  activeProjectId?: string
  searchQuery?: string
  setSearchQuery?: (val: string) => void
  sortBy?: string
  setSortBy?: (val: any) => void
}

export function ProjectSidebar({
  isOpen,
  onClose,
  actions,
  activeProjectId,
  searchQuery = '',
  setSearchQuery,
  sortBy = 'recent',
  setSortBy,
}: ProjectSidebarProps) {
  const [showingActions, setShowingActions] = React.useState<string | null>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showingActions && !(event.target as HTMLElement).closest('.project-action-menu')) {
        setShowingActions(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showingActions])

  const projects = useQuery(api.projects.list)

  const handleOpenActions = (id: string) => {
    setShowingActions(showingActions === id ? null : id)
  }

  const filterAndSortProjects = (projectList: Doc<'projects'>[]) => {
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

  const allProjects = projects ? [...projects.owned, ...projects.shared] : []
  const filteredAll = filterAndSortProjects(allProjects)
  const pinnedProjects = filteredAll.filter((p: any) => p.isPinned)

  const myProjects = projects
    ? filterAndSortProjects(projects.owned).filter((p: any) => !p.isPinned)
    : []
  const sharedProjects = projects
    ? filterAndSortProjects(projects.shared).filter((p: any) => !p.isPinned)
    : []

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          role="button"
          tabIndex={0}
          aria-label="Close overlay"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.keyCode === 27 || e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClose()
            }
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-80 bg-bg-surface border-r border-border-default z-50 transition-transform duration-300 ease-in-out',
          'before:absolute before:inset-0 before:opacity-[0.03] before:pointer-events-none before:[background-image:radial-gradient(var(--text-muted)_1px,transparent_1px)] before:[background-size:20px_20px]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-subtle">
            <Link
              href="/editor"
              onClick={onClose}
              className="flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-accent-primary transition-colors cursor-pointer group"
              title="Go to Dashboard"
            >
              <Logo
                className="text-accent-primary group-hover:scale-105 transition-transform"
                size={20}
              />
              <span>Ghost AI</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close sidebar"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Pinned Projects */}
          {pinnedProjects.length > 0 && (
            <div className="px-4 py-3 border-b border-border-subtle">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                <Pin className="h-3 w-3" />
                Pinned
              </h3>
              <div className="flex flex-col gap-1">
                {pinnedProjects.map((project: any) => (
                  <Link
                    key={project._id}
                    href={`/editor/${project.roomId}`}
                    onClick={onClose}
                    className={cn(
                      'group flex items-center justify-between p-2 rounded-md transition-colors',
                      activeProjectId === project._id
                        ? 'bg-bg-subtle text-text-primary'
                        : 'text-text-secondary hover:bg-bg-subtle'
                    )}
                  >
                    <span className="text-sm font-medium truncate flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-text-muted" />
                      {project.name}
                      {project.activeUsers > 0 && (
                        <span
                          className="flex h-2 w-2 rounded-full bg-state-success animate-pulse"
                          title={`${project.activeUsers} active`}
                        />
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-primary"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        actions.handleTogglePin(project._id)
                      }}
                    >
                      <PinOff className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
            <Tabs defaultValue="my-projects" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 bg-bg-subtle">
                <TabsTrigger value="my-projects" className="gap-2">
                  <Folder className="h-3.5 w-3.5" />
                  My Projects
                </TabsTrigger>
                <TabsTrigger value="shared" className="gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Shared
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-projects" className="flex-1 mt-4">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="flex flex-col gap-1">
                    {myProjects.map((project: Doc<'projects'>) => (
                      <Link
                        key={project._id}
                        href={`/editor/${project.roomId}`}
                        onClick={onClose}
                        className={cn(
                          'group flex items-center justify-between p-2 rounded-md transition-colors',
                          activeProjectId === project._id
                            ? 'bg-bg-subtle text-text-primary'
                            : 'text-text-secondary hover:bg-bg-subtle'
                        )}
                      >
                        <span className="text-sm font-medium truncate flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-text-muted" />
                          {project.name}
                          {(project as any).activeUsers > 0 && (
                            <span
                              className="flex h-2 w-2 rounded-full bg-state-success animate-pulse"
                              title={`${(project as any).activeUsers} active`}
                            />
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          {showingActions === project._id ? (
                            <div className="project-action-menu flex items-center gap-1 bg-bg-surface border border-border-subtle rounded-md p-1 shadow-sm">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Share project"
                                className="h-7 w-7 text-text-secondary hover:text-text-primary"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  actions.openShareDialog(project)
                                  setShowingActions(null)
                                }}
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Rename project"
                                className="h-7 w-7 text-text-secondary hover:text-text-primary"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  actions.openRenameDialog(project)
                                  setShowingActions(null)
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Delete project"
                                className="h-7 w-7 text-text-secondary hover:text-destructive"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  actions.openDeleteDialog(project)
                                  setShowingActions(null)
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="More project actions"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleOpenActions(project._id)
                              }}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </Link>
                    ))}
                    {myProjects.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted">
                        <p className="text-sm">No projects yet.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="shared" className="flex-1 mt-4">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="flex flex-col gap-1">
                    {sharedProjects.map((project) => (
                      <Link
                        key={project._id}
                        href={`/editor/${project.roomId}`}
                        onClick={onClose}
                        className={cn(
                          'group flex items-center justify-between p-2 rounded-md transition-colors',
                          activeProjectId === project._id
                            ? 'bg-bg-subtle text-text-primary'
                            : 'text-text-secondary hover:bg-bg-subtle'
                        )}
                      >
                        <span className="text-sm font-medium truncate flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-text-muted" />
                          {project.name}
                          {(project as any).activeUsers > 0 && (
                            <span
                              className="flex h-2 w-2 rounded-full bg-state-success animate-pulse"
                              title={`${(project as any).activeUsers} active`}
                            />
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          {showingActions === project._id ? (
                            <div className="flex items-center gap-1 bg-bg-surface border border-border-subtle rounded-md p-1 shadow-sm">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Share project"
                                className="h-7 w-7 text-text-secondary hover:text-text-primary"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  actions.openShareDialog(project)
                                  setShowingActions(null)
                                }}
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="More project actions"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleOpenActions(project._id)
                              }}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </Link>
                    ))}
                    {sharedProjects.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted">
                        <p className="text-sm">No shared projects yet.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border-subtle">
            <Button
              onClick={actions.openCreateDialog}
              className="w-full gap-2 bg-accent-primary text-bg-base hover:bg-accent-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
