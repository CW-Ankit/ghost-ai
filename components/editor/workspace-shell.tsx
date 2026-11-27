'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Share2,
  ChevronLeft,
  LayoutTemplate,
  Bot,
  Check,
  Loader2,
  Save,
  AlertCircle,
  Eye,
} from 'lucide-react'
import { EditorButton, editorButtonClass } from './editor-button'
import { EditorShell } from './editor-shell'
import { SearchCommandBar } from './search-command-bar'
import { useProjectActions } from '../../hooks/use-project-actions'
import { ShareDialog } from './share-dialog'
import { ProjectDialogsComponent } from './project-dialogs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useMutation as useLiveblocksMutation, useStorage } from '@liveblocks/react'
import { LiveObject, LiveMap } from '@liveblocks/client'
import { useEdges, useNodes, useReactFlow } from '@xyflow/react'
import type { CanvasEdge, CanvasNode } from '@/types/canvas'
import type { QuickActionItem } from '@/lib/search-engine'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { StarterTemplatesModal } from './starter-templates-modal'
import { CanvasTemplate } from './starter-templates'
import { AISidebar } from './ai-sidebar'
import { SaveProvider, useSaveContext } from './canvas/save-context'
import { AccessDenied } from './access-denied'

interface WorkspaceShellProps {
  children: React.ReactNode
}

function SaveStatusIndicator({ isReadOnly }: { isReadOnly?: boolean }) {
  const { saveStatus, triggerSave } = useSaveContext()

  if (isReadOnly) {
    return (
      <div
        className="gap-1.5 h-8 px-2.5 rounded-lg border border-border-subtle bg-bg-subtle/50 text-text-muted text-xs font-medium inline-flex items-center select-none"
        title="Project is view-only. Changes cannot be saved."
      >
        <Eye className="h-3.5 w-3.5 text-accent-primary" />
        <span className="hidden sm:inline">View Only</span>
      </div>
    )
  }

  const tone =
    saveStatus === 'saving'
      ? 'primarySoft'
      : saveStatus === 'error'
        ? 'destructive'
        : saveStatus === 'unsaved'
          ? 'surface'
          : 'socket'

  return (
    <EditorButton
      tone={tone}
      size="sm"
      onClick={() => triggerSave()}
      disabled={saveStatus === 'saving'}
      className={cn(
        'px-2.5 text-xs',
        saveStatus === 'unsaved' && 'ring-1 ring-state-warning/50'
      )}
      title="Save Canvas to Blob Storage & Database"
    >
      {saveStatus === 'saving' ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="hidden sm:inline">Saving...</span>
        </>
      ) : saveStatus === 'saved' ? (
        <>
          <Check className="h-3.5 w-3.5 text-state-success" />
          <span className="hidden sm:inline text-text-muted">Saved</span>
        </>
      ) : saveStatus === 'unsaved' ? (
        <>
          <span className="h-2 w-2 rounded-full bg-state-warning animate-pulse" />
          <span className="hidden sm:inline">Save</span>
        </>
      ) : saveStatus === 'error' ? (
        <>
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Retry Save</span>
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Save</span>
        </>
      )}
    </EditorButton>
  )
}

function WorkspaceShellInner({ children }: WorkspaceShellProps) {
  const params = useParams()
  const router = useRouter()
  const roomIdParam = params?.roomId
  const roomId = (Array.isArray(roomIdParam) ? roomIdParam[0] : roomIdParam) as string | undefined
  const project = useQuery(api.projects.getByRoomId, { roomId: roomId ?? '' })

  const setPresence = useMutation(api.presence.setPresence)
  const clearPresence = useMutation(api.presence.clearPresence)

  useEffect(() => {
    const projectId = project?._id
    if (projectId) {
      setPresence({ projectId })
    }
    return () => {
      if (projectId) {
        clearPresence({ projectId })
      }
    }
  }, [project?._id, setPresence, clearPresence])

  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false)
  const actions = useProjectActions()

  const { fitView, setNodes } = useReactFlow()
  const canvasNodes = useNodes<CanvasNode>()
  const canvasEdges = useEdges<CanvasEdge>()

  const nodeCount =
    useStorage((root: any) => {
      const flow = root?.flow
      if (!flow || !flow.nodes) return 0
      return flow.nodes.size !== undefined ? flow.nodes.size : Object.keys(flow.nodes).length
    }) ?? 0

  const loadTemplate = useLiveblocksMutation(({ storage }, template: CanvasTemplate) => {
    const flow = storage.get('flow') as any
    if (!flow) {
      const nodesMap = new LiveMap()
      const edgesMap = new LiveMap()
      template.nodes.forEach((n) => {
        nodesMap.set(
          n.id,
          new LiveObject<any>({
            id: n.id,
            type: n.type || 'canvasNode',
            position: n.position,
            data: new LiveObject(n.data as any),
            ...(n.style ? { style: n.style } : {}),
          })
        )
      })
      template.edges.forEach((e) => {
        edgesMap.set(
          e.id,
          new LiveObject<any>({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            type: e.type || 'canvasEdge',
            markerEnd: e.markerEnd,
            data: new LiveObject((e.data || {}) as any),
          })
        )
      })
      storage.set('flow', new LiveObject({ nodes: nodesMap, edges: edgesMap }))
      return
    }

    const nodesMap = flow.get('nodes')
    const edgesMap = flow.get('edges')

    if (nodesMap) {
      const existingNodeKeys = Array.from(nodesMap.keys())
      for (const key of existingNodeKeys) {
        nodesMap.delete(key)
      }
      for (const node of template.nodes) {
        nodesMap.set(
          node.id,
          new LiveObject<any>({
            id: node.id,
            type: node.type || 'canvasNode',
            position: node.position,
            data: new LiveObject(node.data as any),
            ...(node.style ? { style: node.style } : {}),
          })
        )
      }
    }

    if (edgesMap) {
      const existingEdgeKeys = Array.from(edgesMap.keys())
      for (const key of existingEdgeKeys) {
        edgesMap.delete(key)
      }
      for (const edge of template.edges) {
        edgesMap.set(
          edge.id,
          new LiveObject<any>({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            type: edge.type || 'canvasEdge',
            markerEnd: edge.markerEnd,
            data: new LiveObject((edge.data || {}) as any),
          })
        )
      }
    }
  }, [])

  const handleSelectTemplate = useCallback(
    (template: CanvasTemplate) => {
      try {
        loadTemplate(template)
        toast.success(`Loaded "${template.name}" template`)
        setTimeout(() => {
          fitView({ duration: 400, padding: 0.2 })
        }, 100)
      } catch (err) {
        console.error('Failed to load template', err)
        toast.error('Failed to load template')
      }
    },
    [loadTemplate, fitView]
  )

  const isReadOnly = Boolean((project as { isReadOnly?: boolean } | null | undefined)?.isReadOnly)

  const workspaceQuickActions: QuickActionItem[] = useMemo(
    () => [
      {
        id: 'toggle-ai',
        label: aiSidebarOpen ? 'Close AI Workspace' : 'Open AI Workspace',
        description: 'Switch the Ghost AI panel on or off',
        keywords: ['ai', 'architect', 'spec', 'assistant'],
      },
      ...(!isReadOnly
        ? [
            {
              id: 'open-templates',
              label: 'Browse Starter Blueprints',
              description: 'Drop in a prebuilt architecture template',
              keywords: ['templates', 'blueprints', 'starter'],
            },
          ]
        : []),
      {
        id: 'open-share',
        label: 'Invite Crew & Share Link',
        description: 'Manage collaborators or public view link',
        keywords: ['share', 'invite', 'collaborators', 'link'],
      },
      {
        id: 'new-project',
        label: 'Start a New Blueprint',
        description: 'Create a fresh architecture canvas',
        keywords: ['new', 'create', 'project'],
      },
      {
        id: 'go-projects',
        label: 'Back to Projects Dashboard',
        description: 'Return to all workspace projects',
        keywords: ['dashboard', 'home', 'projects'],
      },
    ],
    [aiSidebarOpen, isReadOnly]
  )

  const handleJumpToNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.map((n) => ({ ...n, selected: n.id === nodeId })))
      fitView({ nodes: [{ id: nodeId }], duration: 420, padding: 0.45 })
    },
    [setNodes, fitView]
  )

  const handleQuickAction = useCallback(
    (actionId: string) => {
      if (actionId === 'toggle-ai') setAiSidebarOpen((prev) => !prev)
      if (actionId === 'open-templates' && !isReadOnly) setTemplatesModalOpen(true)
      if (actionId === 'open-share' && project) actions.openShareDialog(project)
      if (actionId === 'new-project') actions.openCreateDialog()
      if (actionId === 'go-projects') router.push('/editor')
    },
    [isReadOnly, project, actions, router]
  )

  if (!roomId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-base text-text-muted">
        <p className="text-sm">Invalid workspace ID</p>
      </div>
    )
  }

  if (project === null) {
    return <AccessDenied />
  }

  if (project === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-base text-text-muted">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-accent-primary animate-spin" />
          <p className="text-sm font-medium text-text-secondary">
            Waking up the ghosts and wiring your canvas...
          </p>
        </div>
      </div>
    )
  }

  return (
    <EditorShell
      defaultDesktopSidebarOpen={false}
      actions={actions}
      activeProjectId={project?._id}
      locationSlot={
        <div className="flex items-center gap-1.5 min-w-0">
          <Link
            href="/editor"
            className={editorButtonClass({
              tone: 'ghost3d',
              size: 'sm',
              className: 'px-2 text-xs group shrink-0',
            })}
            title="Back to Projects"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-text-muted group-hover:text-accent-primary transition-colors" />
            <span>Projects</span>
          </Link>

          <span className="text-text-muted/40 text-xs select-none hidden sm:inline">/</span>

          <h1 className="text-sm font-semibold font-heading text-text-primary truncate max-w-[140px] sm:max-w-[220px] md:max-w-xs">
            {project?.name || 'Loading...'}
          </h1>

          {isReadOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-white/[0.06] text-[#8cd3dc] shrink-0">
              <Eye className="h-3 w-3" />
              <span className="hidden md:inline">View Only</span>
            </span>
          )}
        </div>
      }
      searchSlot={
        <SearchCommandBar
          activeProjectId={project?._id}
          canvasNodes={canvasNodes}
          canvasEdges={canvasEdges}
          onJumpToNode={handleJumpToNode}
          onSelectTemplate={() => {
            if (!isReadOnly) setTemplatesModalOpen(true)
          }}
          quickActions={workspaceQuickActions}
          onRunQuickAction={handleQuickAction}
          placeholder="Search nodes on board, projects, or commands..."
        />
      }
      actionsSlot={
        <div className="flex items-center gap-2">
          <SaveStatusIndicator isReadOnly={isReadOnly} />

          {!isReadOnly && (
            <EditorButton
              tone="surface"
              size="sm"
              onClick={() => setTemplatesModalOpen(true)}
              className="hover:text-accent-primary"
            >
              <LayoutTemplate className="h-4 w-4" />
              <span className="hidden md:inline">Templates</span>
            </EditorButton>
          )}
          <EditorButton
            tone="surface"
            size="sm"
            disabled={!project}
            onClick={() => project && actions.openShareDialog(project)}
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden md:inline">Share</span>
          </EditorButton>
          <EditorButton
            tone={aiSidebarOpen ? 'aiSoft' : 'surface'}
            size="sm"
            onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
            aria-pressed={aiSidebarOpen}
          >
            <Bot className="h-4 w-4 text-accent-ai-text" />
            <span className="hidden sm:inline">AI Workspace</span>
          </EditorButton>
        </div>
      }
    >
      {/* Canvas + Right AI Sidebar inside the Rounded Work Box */}
      <div className="flex-1 flex overflow-hidden relative h-full">
        <div className="flex-1 relative bg-bg-base overflow-hidden">{children}</div>

        <AISidebar
          isOpen={aiSidebarOpen}
          onClose={() => setAiSidebarOpen(false)}
          projectId={project?._id}
          isReadOnly={isReadOnly}
        />
      </div>

      <ShareDialog
        projectId={actions.selectedProject?._id ?? project?._id ?? ''}
        ownerId={project?.ownerId ?? ''}
        canManage={(project as any)?.canManage}
        open={actions.activeDialog === 'share'}
        onOpenChange={(open) => !open && actions.closeDialog()}
        publicAccess={(project as any)?.publicAccess}
        roomId={roomId}
      />
      <ProjectDialogsComponent state={actions} />
      <StarterTemplatesModal
        open={templatesModalOpen}
        onOpenChange={setTemplatesModalOpen}
        onSelectTemplate={handleSelectTemplate}
        hasExistingNodes={nodeCount > 0}
      />
    </EditorShell>
  )
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  return (
    <SaveProvider>
      <WorkspaceShellInner>{children}</WorkspaceShellInner>
    </SaveProvider>
  )
}
