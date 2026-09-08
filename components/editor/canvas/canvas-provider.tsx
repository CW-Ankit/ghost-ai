'use client'

import React from 'react'
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react'
import { ReactFlowProvider } from '@xyflow/react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Canvas } from './canvas'

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

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, thinking: false }}>
        <ReactFlowProvider>
          <React.Suspense
            fallback={
              <div className="h-full w-full flex items-center justify-center bg-base text-text-muted">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Connecting to room...</p>
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
                    <p className="text-sm">Loading canvas...</p>
                  </div>
                </div>
              ))}
          </React.Suspense>
        </ReactFlowProvider>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
