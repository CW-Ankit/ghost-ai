import { NextResponse } from 'next/server'
import { api } from '@/convex/_generated/api'
import { getAuthenticatedConvex, handleApiError, parseJsonBody } from '@/lib/api-auth'

export async function GET() {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  try {
    const projects = await authResult.ctx.convex.query(api.projects.list, {})
    return NextResponse.json(projects)
  } catch (error) {
    return handleApiError(error, 'Failed to list projects')
  }
}

export async function POST(request: Request) {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  const bodyResult = await parseJsonBody<{
    name?: unknown
    description?: unknown
    roomId?: unknown
  }>(request)
  if (!bodyResult.ok) return bodyResult.response

  const { name, description, roomId } = bodyResult.data

  if (name !== undefined && typeof name !== 'string') {
    return NextResponse.json({ error: 'name must be a string' }, { status: 400 })
  }
  if (description !== undefined && typeof description !== 'string') {
    return NextResponse.json({ error: 'description must be a string' }, { status: 400 })
  }
  if (roomId !== undefined && typeof roomId !== 'string') {
    return NextResponse.json({ error: 'roomId must be a string' }, { status: 400 })
  }

  const resolvedRoomId =
    typeof roomId === 'string' && roomId.trim().length > 0 ? roomId.trim() : `room-${crypto.randomUUID()}`

  try {
    const projectId = await authResult.ctx.convex.mutation(api.projects.create, {
      name: typeof name === 'string' ? name : undefined,
      description: typeof description === 'string' ? description : undefined,
      roomId: resolvedRoomId,
    })

    return NextResponse.json(
      { projectId, roomId: resolvedRoomId, orgId: authResult.ctx.orgId },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, 'Failed to create project')
  }
}
