import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

export async function getCurrentUserIdentity() {
  try {
    const { userId, getToken } = await auth()
    if (!userId) return null

    let token: string | null = null
    try {
      token = await getToken({ template: 'convex' })
    } catch {
      token = await getToken().catch(() => null)
    }

    return { userId, token }
  } catch (error) {
    console.error('Error getting user identity:', error)
    return null
  }
}

export async function checkProjectAccess(roomId: string) {
  try {
    const identity = await getCurrentUserIdentity()

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) return null

    const convexHttpClient = new ConvexHttpClient(convexUrl)
    if (identity?.token) {
      convexHttpClient.setAuth(identity.token)
    }

    const project = await (convexHttpClient.query as any)(api.projects.getByRoomId, {
      roomId,
    })
    return project
  } catch (error) {
    console.error('Error checking project access:', error)
    return null
  }
}
