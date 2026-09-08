import { Liveblocks } from '@liveblocks/node'

// Cache the client to avoid recreating it on every request
let client: Liveblocks | null = null

export const getLiveblocksClient = () => {
  if (!client) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) {
      throw new Error('LIVEBLOCKS_SECRET_KEY is required')
    }
    client = new Liveblocks({
      secret,
    })
  }
  return client
}

export const CURSOR_COLORS = [
  '#00c8d4', // Cyan
  '#6457f9', // Indigo
  '#34d399', // Green
  '#fbbf24', // Yellow
  '#ff4d4f', // Red
  '#bf7af0', // Purple
  '#ff990a', // Orange
  '#f75f8f', // Pink
]

export const getCursorColor = (userId: string) => {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length
  return CURSOR_COLORS[index]
}
