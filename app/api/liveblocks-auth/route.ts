import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { resolveConvexToken } from '@/lib/api-auth'
import { getLiveblocksClient, getCursorColor } from '@/lib/liveblocks'
import { checkProjectAccess } from '@/lib/project-access'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const url = new URL(req.url)
    const roomId =
      body.room || body.roomId || url.searchParams.get('room') || url.searchParams.get('roomId')

    if (!roomId) {
      return new NextResponse('Room ID is required', { status: 400 })
    }

    // 1. Resolve Clerk session synchronously from request token claims
    const authSession = await auth()
    const userId = authSession.userId
    const token = userId
      ? await resolveConvexToken(
          authSession.sessionClaims as Record<string, unknown> | null | undefined,
          authSession.getToken
        )
      : null

    // 2. Verify project access & permission
    const project = await checkProjectAccess(roomId, { userId, token })
    if (!project) {
      return new NextResponse('Unauthorized access to project', { status: 403 })
    }

    const isReadOnly = Boolean(project.isReadOnly)
    if (!userId && !isReadOnly) {
      return new NextResponse('User not found', { status: 401 })
    }

    // 3. Extract user metadata without blocking on remote user API
    let displayName = isReadOnly ? 'Guest Viewer' : 'Collaborator'
    let avatar = ''
    const effectiveUserId = userId || `guest-${Math.random().toString(36).slice(2, 9)}`
    const cursorColor = userId ? getCursorColor(userId) : '#00c8d4'

    if (userId) {
      const claims = authSession.sessionClaims as Record<string, any> | undefined
      const claimName =
        claims?.full_name ||
        claims?.fullName ||
        claims?.name ||
        claims?.username ||
        (claims?.email ? String(claims.email).split('@')[0] : '')

      if (claimName) {
        displayName = claimName
      } else {
        displayName = `User ${userId.slice(-4)}`
      }
      avatar = (claims?.image_url || claims?.picture || claims?.avatar_url || '') as string

      // If display name or avatar are missing, perform a fast attempt at currentUser with 1200ms timeout
      if (!claimName || !avatar) {
        try {
          const user = await Promise.race([
            currentUser(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
          ])
          if (user) {
            displayName = user.fullName || user.username || displayName
            avatar = user.imageUrl || avatar
          }
        } catch {
          // Graceful fallback to decoded claims
        }
      }
    }

    // 4. Prepare Liveblocks session with user metadata and permissions
    const client = getLiveblocksClient()
    const session = client.prepareSession(effectiveUserId, {
      userInfo: {
        displayName,
        avatar,
        cursorColor,
      },
    })

    // Grant read-only or full access based on permission
    if (isReadOnly) {
      session.allow(roomId, session.READ_ACCESS)
    } else {
      session.allow(roomId, session.FULL_ACCESS)
    }

    // 5. Authorize the session to get the access token
    const { status, body: authBody } = await session.authorize()

    return new Response(authBody, { status })
  } catch (error) {
    console.error('Liveblocks auth error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
