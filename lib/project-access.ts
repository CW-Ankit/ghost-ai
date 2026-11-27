import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { resolveConvexToken } from '@/lib/api-auth'

export async function getCurrentUserIdentity() {
  try {
    const { userId, sessionClaims, getToken } = await auth()
    if (!userId) return null

    const token = await resolveConvexToken(
      sessionClaims as Record<string, unknown> | null | undefined,
      getToken
    )

    return { userId, token }
  } catch (error) {
    console.error('Error getting user identity:', error)
    return null
  }
}

export async function checkProjectAccess(
  roomId: string,
  authContext?: { userId: string | null; token: string | null }
) {
  try {
    const identity = authContext !== undefined ? authContext : await getCurrentUserIdentity()

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) return null

    const convexHttpClient = new ConvexHttpClient(convexUrl)
    if (identity?.token) {
      convexHttpClient.setAuth(identity.token)
    }

    const queryPromise = (convexHttpClient.query as any)(api.projects.getByRoomId, {
      roomId,
    })

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn(`[checkProjectAccess] Query timed out after 3500ms for room: ${roomId}`)
        resolve(null)
      }, 3500)
    })

    const project = await Promise.race([queryPromise, timeoutPromise])
    return project
  } catch (error) {
    console.error('Error checking project access:', error)
    return null
  }
}
