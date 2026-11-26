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
    prompt?: unknown
    currentNodes?: unknown
    currentEdges?: unknown
    history?: unknown
  }>(req)
  if (!bodyResult.ok) return bodyResult.response

  const { projectId, roomId, prompt, currentNodes, currentEdges, history } = bodyResult.data

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: 'prompt is required and must be a non-empty string' }, { status: 400 })
  }
  if (currentNodes !== undefined && !Array.isArray(currentNodes)) {
    return NextResponse.json({ error: 'currentNodes must be an array' }, { status: 400 })
  }
  if (currentEdges !== undefined && !Array.isArray(currentEdges)) {
    return NextResponse.json({ error: 'currentEdges must be an array' }, { status: 400 })
  }
  if (history !== undefined && !Array.isArray(history)) {
    return NextResponse.json({ error: 'history must be an array' }, { status: 400 })
  }

  try {
    const { convex } = authResult.ctx

    let resolvedProjectId = typeof projectId === 'string' && projectId.trim() ? projectId.trim() : null
    if (!resolvedProjectId && typeof roomId === 'string' && roomId.trim()) {
      const project = await convex.query(api.projects.getByRoomId, { roomId: roomId.trim() })
      if (!project) {
        return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 })
      }
      resolvedProjectId = project._id
    }

    if (!resolvedProjectId) {
      return NextResponse.json({ error: 'projectId or roomId is required' }, { status: 400 })
    }

    const result = await convex.action(api.ai.generateDesign, {
      projectId: resolvedProjectId as Id<'projects'>,
      prompt: prompt.trim(),
      currentNodes: currentNodes as Record<string, unknown>[] | undefined,
      currentEdges: currentEdges as Record<string, unknown>[] | undefined,
      history: history as Array<{ role: 'user' | 'assistant'; content: string }> | undefined,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleApiError(error, 'Failed to generate architecture design')
  }
}
