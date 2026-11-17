import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
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

    // 1. Verify project access & permission
    const project = await checkProjectAccess(roomId)
    if (!project) {
      return new NextResponse('Unauthorized access to project', { status: 403 })
    }

    const isReadOnly = Boolean(project.isReadOnly)

    // 2. Get current user details for metadata (support guest viewer if read-only)
    const user = await currentUser()
    if (!user && !isReadOnly) {
      return new NextResponse('User not found', { status: 401 })
    }

    const client = getLiveblocksClient()

    const userId = user?.id || `guest-${Math.random().toString(36).slice(2, 9)}`
    const displayName = user
      ? user.fullName || user.username || 'Collaborator'
      : 'Guest Viewer'
    const avatar = user?.imageUrl || ''
    const cursorColor = user ? getCursorColor(user.id) : '#00c8d4'

    // 3. Prepare session with user metadata and permissions
    const session = client.prepareSession(userId, {
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

    // 4. Authorize the session to get the access token
    const { status, body: authBody } = await session.authorize()

    return new Response(authBody, { status })
  } catch (error) {
    console.error('Liveblocks auth error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
