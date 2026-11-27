'use client'

import React from 'react'
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react'
import { ReactFlowProvider } from '@xyflow/react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Canvas } from './canvas'
import { AccessDenied } from '../access-denied'

interface CanvasProviderProps {
  roomId: string
  projectId?: string
  children?: React.ReactNode
}

export function CanvasProvider({
  roomId,
  projectId: initialProjectId,
  children,
}: CanvasProviderProps) {
  const project = useQuery(api.projects.getByRoomId, { roomId })
  const projectId = initialProjectId || project?._id

  if (project === null) {
    return <AccessDenied />
  }

  if (project === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-base text-text-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-text-secondary">Opening the studio doors...</p>
        </div>
      </div>
    )
  }

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, thinking: false }}>
        <ReactFlowProvider>
          <React.Suspense
            fallback={
              <div className="h-full w-full flex items-center justify-center bg-base text-text-muted">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Pulling up the whiteboard...</p>
                </div>
              </div>
            }
          >
            {children ||
              (projectId ? (
                <Canvas projectId={projectId} />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-base text-text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">Unrolling the blueprint...</p>
                  </div>
                </div>
              ))}
          </React.Suspense>
        </ReactFlowProvider>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
