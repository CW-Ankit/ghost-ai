import { createClient } from '@liveblocks/client'
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react'
import { CanvasNode, CanvasEdge } from '@/types/canvas'

type Presence = {
  cursor: { x: number; y: number } | null
  thinking: boolean
}

type UserMeta = {
  id: string
  info: {
    displayName: string
    avatar?: string
    cursorColor: string
  }
}

type Storage = {
  nodes: Record<string, CanvasNode>
  edges: Record<string, CanvasEdge>
}

declare global {
  interface Liveblocks {
    Presence: Presence
    UserMeta: UserMeta
  }
}

export const liveblocks = createClient({
  authEndpoint: '/api/liveblocks-auth',
})

export { LiveblocksProvider, RoomProvider }

export type { Presence, UserMeta, Storage }
