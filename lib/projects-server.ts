import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { Doc } from '@/convex/_generated/dataModel'

/**
 * Server-side helper to fetch projects for the authenticated user.
 * Uses Clerk authentication tokens to call Convex queries.
 *
 * The authentication flow:
 * 1. Get the current user's auth session via Clerk's `auth()`
 * 2. Retrieve the auth token using `getToken()`
 * 3. Pass the token to ConvexHttpClient via Authorization header
 * 4. ConvexHttpClient automatically sends the token, Convex validates it via auth.config.ts
 *
 * Note: ConvexHttpClient.query() takes 2 arguments: (function, args)
 * The token is passed via the Authorization header, not as a 3rd argument.
 * See: convex/_generated/ai/guidelines.md for Convex patterns
 */
const convexHttpClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function getProjects(): Promise<{
  projects: Doc<'projects'>[]
  sharedProjects: Doc<'projects'>[]
}> {
  try {
    const { userId, getToken } = await auth()

    if (!userId) {
      return { projects: [], sharedProjects: [] }
    }

    const token = await getToken()
    if (!token) {
      return { projects: [], sharedProjects: [] }
    }

    // Set authorization header for the request
    convexHttpClient.setAuth(token)

    // Fetch projects (owned and shared)
    const response = await convexHttpClient.query(api.projects.list, {})

    if (!response) {
      return { projects: [], sharedProjects: [] }
    }

    return {
      projects: response.owned,
      sharedProjects: response.shared,
    }
  } catch (error) {
    console.error('Error in getProjects:', error)
    return { projects: [], sharedProjects: [] }
  }
}
