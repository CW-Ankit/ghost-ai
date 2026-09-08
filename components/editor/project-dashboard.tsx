'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  MoreVertical,
  Folder,
  Users,
  FileText,
  Pencil,
  Trash2,
  Clock,
  Archive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { CanvasPreview } from './project-dashboard/canvas-preview'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useProjectActions } from '../../hooks/use-project-actions'
import { Doc } from '@/convex/_generated/dataModel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ProjectCardProps {
  project: Doc<'projects'>
  isOwner: boolean
  onAction: (id: string) => void
  onRename: (project: Doc<'projects'>) => void
  onDelete: (project: Doc<'projects'>) => void
  onClick: (roomId: string) => void
}

function ProjectCard({
  project,
  isOwner,
  onAction,
  onRename,
  onDelete,
  onClick,
}: ProjectCardProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = React.useState(false)

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <Card
      className={cn(
        'group relative p-5 bg-bg-surface border-border-default hover:border-accent-primary transition-all duration-200 cursor-pointer overflow-hidden',
        'hover:shadow-[0_0_20px_rgba(0,200,212,0.1)]'
      )}
      onClick={() => onClick(project.roomId)}
      onMouseEnter={() => router.prefetch(`/editor/${project.roomId}`)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-bg-subtle border border-border-subtle overflow-hidden">
          {project.canvasSnapshot ? (
            <CanvasPreview snapshot={project.canvasSnapshot} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-accent-primary">
              <FileText className="h-5 w-5" />
            </div>
          )}
        </div>
        {isOwner && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text-primary"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {showMenu && (
              <div
                className="absolute right-0 top-8 z-20 w-32 bg-bg-elevated border border-border-default rounded-xl shadow-xl p-1 flex flex-col gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 text-xs h-8 text-text-secondary hover:text-text-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRename(project)
                    setShowMenu(false)
                  }}
                >
                  <Pencil className="h-3 w-3" /> Rename
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 text-xs h-8 text-text-secondary hover:text-accent-ai"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAction(project._id) // We'll use onAction for archive
                    setShowMenu(false)
                  }}
                >
                  <Archive className="h-3 w-3" /> Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 text-xs h-8 text-text-secondary hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(project)
                    setShowMenu(false)
                  }}
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-text-primary font-medium truncate">{project.name}</h3>
        <p className="text-xs text-text-muted font-mono truncate">ghost.ai/{project.roomId}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider',
              project.status === 'DRAFT' && 'bg-bg-subtle border-border-subtle text-text-muted',
              project.status === 'REVIEW' &&
                'bg-accent-ai-dim border-accent-ai text-accent-ai-text',
              project.status === 'ARCHIVED' && 'bg-red-900/20 border-red-900/50 text-red-400'
            )}
          >
            {project.status}
          </div>
          {project.nodeCount && (
            <div className="px-2 py-0.5 rounded-full bg-bg-subtle border border-border-subtle text-[10px] text-text-muted">
              {project.nodeCount} nodes
            </div>
          )}
        </div>
        <span className="text-[10px] text-text-faint">{formatDate(project.updatedAt)}</span>
      </div>
    </Card>
  )
}

export function ProjectDashboard({
  onNewProject,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  actions,
}: {
  onNewProject: () => void
  searchQuery: string
  setSearchQuery: (val: string) => void
  sortBy: string
  setSortBy: (val: any) => void
  viewMode: 'grid' | 'list'
  setViewMode: (val: 'grid' | 'list') => void
  actions: ReturnType<typeof useProjectActions>
}) {
  const router = useRouter()
  const projects = useQuery(api.projects.list)
  const [selectedProjects, setSelectedProjects] = React.useState<string[]>([])
  const [activeTag, setActiveTag] = React.useState<string | null>(null)

  const handleProjectClick = (roomId: string) => {
    router.push(`/editor/${roomId}`)
  }

  if (projects === undefined) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Loading your projects...</p>
        </div>
      </div>
    )
  }

  const allProjects = projects ? [...projects.owned, ...projects.shared] : []

  // Extract all unique tags
  const allTags = Array.from(new Set(allProjects.flatMap((p) => p.tags || []))).sort()

  const filteredProjects = allProjects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !activeTag || (p.tags && p.tags.includes(activeTag))
    return matchesSearch && matchesTag
  })

  const recentProjects = [...filteredProjects]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 4)

  const myProjects = projects?.owned ?? []
  const sharedProjects = projects?.shared ?? []

  const filteredMyProjects = myProjects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !activeTag || (p.tags && p.tags.includes(activeTag))
    return matchesSearch && matchesTag
  })
  const filteredSharedProjects = sharedProjects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !activeTag || (p.tags && p.tags.includes(activeTag))
    return matchesSearch && matchesTag
  })

  return (
    <div className="h-full w-full flex flex-col p-8 overflow-y-auto">
      {recentProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Recent Projects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentProjects.map((project) => (
              <Link
                key={project._id}
                href={`/editor/${project.roomId}`}
                prefetch={true}
                className="p-3 bg-bg-surface border border-border-default rounded-2xl flex items-center gap-3 hover:border-accent-primary transition-colors group"
              >
                <div className="p-2 rounded-lg bg-bg-subtle text-accent-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{project.name}</p>
                  <p className="text-[10px] text-text-muted truncate">
                    Edited {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="h-3 w-3 text-text-muted" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {selectedProjects.length > 0 && (
        <div className="mb-6 p-3 bg-accent-primary-dim border border-accent-primary rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-accent-ai-text">
              {selectedProjects.length} projects selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProjects([])}
              className="h-8 text-xs text-text-secondary hover:text-text-primary"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                actions.handleBulkUpdateStatus(selectedProjects, 'ARCHIVED')
                setSelectedProjects([])
              }}
              className="h-8 text-xs text-text-secondary hover:text-accent-ai"
            >
              <Archive className="h-3 w-3 mr-1" /> Archive
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                actions.handleBulkDelete(selectedProjects)
                setSelectedProjects([])
              }}
              className="h-8 text-xs text-text-secondary hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      {allTags.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <span className="text-xs text-text-muted font-medium mr-1">Tags:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTag(null)}
            className={cn(
              'h-7 px-2.5 rounded-full text-xs transition-all',
              activeTag === null
                ? 'bg-accent-primary text-bg-base font-medium hover:bg-accent-primary/90'
                : 'bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary hover:border-border-subtle'
            )}
          >
            All
          </Button>
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={cn(
                'h-7 px-2.5 rounded-full text-xs transition-all',
                activeTag === tag
                  ? 'bg-accent-primary text-bg-base font-medium hover:bg-accent-primary/90'
                  : 'bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary hover:border-border-subtle'
              )}
            >
              #{tag}
            </Button>
          ))}
        </div>
      )}

      <Tabs defaultValue="my-projects" className="flex-1 flex flex-col">
        <TabsList className="grid w-[400px] grid-cols-2 bg-bg-subtle">
          <TabsTrigger value="my-projects" className="gap-2">
            <Folder className="h-3.5 w-3.5" />
            My Projects
          </TabsTrigger>
          <TabsTrigger value="shared" className="gap-2">
            <Users className="h-3.5 w-3.5" />
            Shared
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-projects" className="mt-6">
          {filteredMyProjects.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMyProjects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    isOwner={true}
                    onAction={(id) => actions.handleUpdateStatus(id, 'ARCHIVED')}
                    onRename={(p) => actions.openRenameDialog(p)}
                    onDelete={(p) => actions.openDeleteDialog(p)}
                    onClick={handleProjectClick}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-12 px-5 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border-subtle">
                  <div className="col-span-1"></div>
                  <div className="col-span-5">Project Name</div>
                  <div className="col-span-3">Status</div>
                  <div className="col-span-3 text-right">Modified</div>
                </div>
                {filteredMyProjects.map((project) => (
                  <div
                    key={project._id}
                    className="grid grid-cols-12 px-5 py-3 bg-bg-surface border-b border-border-default hover:bg-bg-subtle transition-colors cursor-pointer group items-center"
                  >
                    <div className="col-span-1">
                      <Checkbox
                        checked={selectedProjects.includes(project._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProjects([...selectedProjects, project._id])
                          } else {
                            setSelectedProjects(selectedProjects.filter((id) => id !== project._id))
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div
                      className="col-span-5 flex items-center gap-3"
                      onClick={() => handleProjectClick(project.roomId)}
                    >
                      <FileText className="h-4 w-4 text-text-muted" />
                      <span className="text-sm text-text-primary truncate">{project.name}</span>
                    </div>
                    <div className="col-span-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider',
                          project.status === 'DRAFT' &&
                            'bg-bg-subtle border-border-subtle text-text-muted',
                          project.status === 'REVIEW' &&
                            'bg-accent-ai-dim border-accent-ai text-accent-ai-text',
                          project.status === 'ARCHIVED' &&
                            'bg-red-900/20 border-red-900/50 text-red-400'
                        )}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="col-span-3 text-right text-xs text-text-muted">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-text-muted bg-bg-surface border border-dashed border-border-subtle rounded-3xl">
              <Folder className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">No projects found.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          {filteredSharedProjects.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSharedProjects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    isOwner={false}
                    onAction={() => {}}
                    onRename={() => {}}
                    onDelete={() => {}}
                    onClick={handleProjectClick}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-12 px-5 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border-subtle">
                  <div className="col-span-1"></div>
                  <div className="col-span-5">Project Name</div>
                  <div className="col-span-3">Status</div>
                  <div className="col-span-3 text-right">Modified</div>
                </div>
                {filteredSharedProjects.map((project) => (
                  <div
                    key={project._id}
                    className="grid grid-cols-12 px-5 py-3 bg-bg-surface border-b border-border-default hover:bg-bg-subtle transition-colors cursor-pointer group items-center"
                  >
                    <div className="col-span-1">
                      <Checkbox
                        checked={selectedProjects.includes(project._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProjects([...selectedProjects, project._id])
                          } else {
                            setSelectedProjects(selectedProjects.filter((id) => id !== project._id))
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div
                      className="col-span-5 flex items-center gap-3"
                      onClick={() => handleProjectClick(project.roomId)}
                    >
                      <FileText className="h-4 w-4 text-text-muted" />
                      <span className="text-sm text-text-primary truncate">{project.name}</span>
                    </div>
                    <div className="col-span-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider',
                          project.status === 'DRAFT' &&
                            'bg-bg-subtle border-border-subtle text-text-muted',
                          project.status === 'REVIEW' &&
                            'bg-accent-ai-dim border-accent-ai text-accent-ai-text',
                          project.status === 'ARCHIVED' &&
                            'bg-red-900/20 border-red-900/50 text-red-400'
                        )}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="col-span-3 text-right text-xs text-text-muted">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-text-muted bg-bg-surface border border-dashed border-border-subtle rounded-3xl">
              <Users className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">No shared projects found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
