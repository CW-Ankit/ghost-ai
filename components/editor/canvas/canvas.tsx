'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useLiveblocksFlow } from '@liveblocks/react-flow'
import {
  useMutation as useLiveblocksMutation,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useUpdateMyPresence,
} from '@liveblocks/react'
import { LiveObject, LiveMap } from '@liveblocks/client'
import { CanvasNode } from './nodes/canvas-node'
import { CanvasEdge } from './edges/canvas-edge'
import { ShapePanel } from './shape-panel'
import { CanvasControlBar } from './canvas-control-bar'
import { DragPreview } from './drag-preview'
import { PresenceAvatars } from './presence-avatars'
import { LiveCursors } from './live-cursors'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useCanvasAutosave } from '@/hooks/use-canvas-autosave'
import { useSaveContext } from './save-context'
import { NodeShape } from '@/types/canvas'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useParams } from 'next/navigation'

const nodeTypes = {
  canvasNode: CanvasNode,
}

const edgeTypes = {
  canvasEdge: CanvasEdge,
}

function CanvasInner({ projectId }: { projectId: string }) {
  const params = useParams()
  const roomId = params?.roomId as string

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useLiveblocksFlow() as any

  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow()
  const [dragPreview, setDragPreview] = useState<{
    shape: NodeShape
    position: { x: number; y: number }
  } | null>(null)

  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const updateMyPresence = useUpdateMyPresence()

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 300 })
  }, [zoomIn])

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 300 })
  }, [zoomOut])

  const handleFitView = useCallback(() => {
    fitView({ duration: 300 })
  }, [fitView])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      updateMyPresence({ cursor: position })
    },
    [screenToFlowPosition, updateMyPresence]
  )

  const handleMouseLeave = useCallback(
    (event: React.MouseEvent) => {
      if (event.currentTarget === event.target) {
        setDragPreview(null)
      }
      updateMyPresence({ cursor: null })
    },
    [updateMyPresence]
  )

  useKeyboardShortcuts({
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    undo,
    redo,
    canUndo,
    canRedo,
  })

  // Hook for debounced autosave to Vercel Blob and Convex
  const { saveStatus, lastSavedAt, saveNow } = useCanvasAutosave({
    projectId,
    roomId,
    nodes,
    edges,
    debounceMs: 2500,
  })

  const { setSaveStatus, setLastSavedAt, registerSaveHandler } = useSaveContext()

  useEffect(() => {
    setSaveStatus(saveStatus)
  }, [saveStatus, setSaveStatus])

  useEffect(() => {
    setLastSavedAt(lastSavedAt)
  }, [lastSavedAt, setLastSavedAt])

  useEffect(() => {
    registerSaveHandler(saveNow)
  }, [registerSaveHandler, saveNow])

  // Liveblocks mutation to load saved canvas state if room is empty
  const loadSavedState = useLiveblocksMutation(({ storage }, savedData: { nodes: any[]; edges: any[] }) => {
    const flow = storage.get('flow') as any
    if (!flow) {
      const nodesMap = new LiveMap()
      const edgesMap = new LiveMap()
      savedData.nodes.forEach((n) => {
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
      savedData.edges.forEach((e) => {
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
      for (const key of Array.from(nodesMap.keys())) {
        nodesMap.delete(key)
      }
      for (const node of savedData.nodes) {
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
      for (const key of Array.from(edgesMap.keys())) {
        edgesMap.delete(key)
      }
      for (const edge of savedData.edges) {
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

  // Retrieve saved canvas URL from Convex
  const canvasBlobUrl = useQuery(
    api.projects.getCanvasUrl,
    projectId ? { projectId: projectId as Id<'projects'> } : 'skip'
  )
  const hasAttemptedHydration = useRef(false)

  // Rehydrate canvas state when room is empty and saved blob URL is available
  useEffect(() => {
    if (!nodes || !edges || hasAttemptedHydration.current) return

    const isRoomEmpty = nodes.length === 0 && edges.length === 0

    if (isRoomEmpty && canvasBlobUrl) {
      hasAttemptedHydration.current = true
      ;(async () => {
        try {
          const res = await fetch(canvasBlobUrl)
          if (res.ok) {
            const data = await res.json()
            if (data.nodes && data.nodes.length > 0) {
              loadSavedState({
                nodes: data.nodes,
                edges: data.edges || [],
              })
              setTimeout(() => {
                fitView({ duration: 400, padding: 0.2 })
              }, 150)
            }
          }
        } catch (err) {
          console.warn('Could not load saved canvas from blob URL', err)
        }
      })()
    } else if (!isRoomEmpty) {
      hasAttemptedHydration.current = true
    }
  }, [nodes, edges, canvasBlobUrl, loadSavedState, fitView])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDragPreview(null)

      const dataString = event.dataTransfer.getData('application/ghost-ai-shape')
      if (!dataString) return

      try {
        const { shape, label, size } = JSON.parse(dataString)
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })

        const newNode = {
          id: `${shape}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: 'canvasNode',
          position,
          data: {
            label: label || '',
            shape,
            color: 'default',
          },
          style: size ? { width: size.width, height: size.height } : undefined,
        }

        onNodesChange([{ type: 'add', item: newNode }])
      } catch (e) {
        console.error('Failed to parse drop data', e)
      }
    },
    [screenToFlowPosition, onNodesChange]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'

    const dataString = event.dataTransfer.getData('application/ghost-ai-shape')
    if (dataString) {
      try {
        const { shape } = JSON.parse(dataString)
        setDragPreview({
          shape,
          position: { x: event.clientX, y: event.clientY },
        })
      } catch {}
    }
  }, [])

  if (!nodes || !edges) {
    return (
      <div className="h-full w-full bg-base flex items-center justify-center text-text-secondary">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading canvas...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-full w-full bg-base relative overflow-hidden"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes as any}
        edgeTypes={edgeTypes as any}
        defaultEdgeOptions={{
          type: 'canvasEdge',
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
        fitView
      >
        <Background color="var(--border-subtle)" gap={20} variant={'dots' as any} />
        <MiniMap
          className="bg-bg-surface border border-border-default rounded-xl"
          nodeColor="var(--accent-primary)"
        />
      </ReactFlow>
      <LiveCursors />
      <PresenceAvatars />
      <CanvasControlBar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <ShapePanel />
      {dragPreview && <DragPreview shape={dragPreview.shape} position={dragPreview.position} />}
    </div>
  )
}

export function Canvas({ projectId: propProjectId }: { projectId?: string }) {
  const params = useParams()
  const roomId = (Array.isArray(params?.roomId) ? params?.roomId[0] : params?.roomId) as string
  const project = useQuery(api.projects.getByRoomId, { roomId: roomId ?? '' })
  const projectId = propProjectId || (project?._id as string)

  return (
    <div className="h-full w-full">
      <CanvasInner projectId={projectId} />
    </div>
  )
}
