import { NextRequest, NextResponse } from 'next/server'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getAuthenticatedConvex, handleApiError, parseJsonBody } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  const bodyResult = await parseJsonBody<{
    projectId?: unknown
    roomId?: unknown
    nodes?: unknown
    edges?: unknown
    siteUrl?: unknown
  }>(req)
  if (!bodyResult.ok) return bodyResult.response

  const { projectId, roomId, nodes, edges, siteUrl } = bodyResult.data

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return NextResponse.json(
      { error: 'nodes must be a non-empty array' },
      { status: 400 }
    )
  }
  if (edges !== undefined && !Array.isArray(edges)) {
    return NextResponse.json({ error: 'edges must be an array' }, { status: 400 })
  }

  try {
    const { convex } = authResult.ctx

    let resolvedProjectId = typeof projectId === 'string' && projectId.trim() ? projectId.trim() : null
    if (!resolvedProjectId && typeof roomId === 'string' && roomId.trim()) {
      const project = await convex.query(api.projects.getByRoomId, { roomId: roomId.trim() })
      if (!project) {
        return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 })
      }
      if (project.isReadOnly) {
        return NextResponse.json(
          { error: 'Unauthorized: You do not have edit permission for this project' },
          { status: 403 }
        )
      }
      resolvedProjectId = project._id
    }

    if (!resolvedProjectId) {
      return NextResponse.json({ error: 'projectId or roomId is required' }, { status: 400 })
    }

    const origin =
      typeof siteUrl === 'string' && siteUrl.trim() ? siteUrl.trim() : req.nextUrl.origin

    const result = await convex.action(api.ai.generateSpec, {
      projectId: resolvedProjectId as Id<'projects'>,
      nodes,
      edges: Array.isArray(edges) ? edges : [],
      siteUrl: origin,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Failed to generate technical specification')
  }
}
