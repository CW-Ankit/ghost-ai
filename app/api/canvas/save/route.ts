import { NextRequest, NextResponse } from 'next/server'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  getAuthenticatedConvex,
  getOptionalConvex,
  handleApiError,
  parseJsonBody,
  readVerifiedArtifact,
  uploadArtifactToBlob,
} from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId query parameter' }, { status: 400 })
    }

    const { userId, convex } = await getOptionalConvex()
    const canvasUrl = await convex.query(api.projects.getCanvasUrl, {
      projectId: projectId as Id<'projects'>,
    })

    if (!canvasUrl) {
      return NextResponse.json(
        { error: userId ? 'Canvas not found or unauthorized' : 'Unauthorized' },
        { status: userId ? 404 : 401 }
      )
    }

    const artifact = await readVerifiedArtifact(canvasUrl)
    if (!artifact.ok) {
      return NextResponse.json({ error: artifact.error }, { status: artifact.status })
    }

    let parsedCanvas: unknown
    try {
      parsedCanvas = JSON.parse(artifact.content)
    } catch {
      return NextResponse.json({ error: 'Stored canvas JSON is corrupted' }, { status: 500 })
    }

    return NextResponse.json({
      projectId,
      canvasJsonPath: canvasUrl,
      canvas: parsedCanvas,
    })
  } catch (error) {
    return handleApiError(error, 'Failed to load canvas')
  }
}

export async function POST(req: NextRequest) {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  const bodyResult = await parseJsonBody<{
    projectId?: unknown
    roomId?: unknown
    nodes?: unknown
    edges?: unknown
    persistToConvex?: unknown
  }>(req)
  if (!bodyResult.ok) return bodyResult.response

  const { projectId, roomId, nodes, edges, persistToConvex } = bodyResult.data

  if (typeof projectId !== 'string' || !projectId.trim()) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }
  if (nodes !== undefined && !Array.isArray(nodes)) {
    return NextResponse.json({ error: 'nodes must be an array' }, { status: 400 })
  }
  if (edges !== undefined && !Array.isArray(edges)) {
    return NextResponse.json({ error: 'edges must be an array' }, { status: 400 })
  }

  try {
    const typedId = projectId as Id<'projects'>
    const project = await authResult.ctx.convex.query(api.projects.getById, {
      projectId: typedId,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }
    if (project.isReadOnly) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have edit permission for this project' },
        { status: 403 }
      )
    }

    const nodeList = Array.isArray(nodes) ? nodes : []
    const edgeList = Array.isArray(edges) ? edges : []

    const canvasPayload = {
      projectId,
      roomId: typeof roomId === 'string' && roomId ? roomId : project.roomId,
      nodes: nodeList,
      edges: edgeList,
      version: 1,
      savedAt: new Date().toISOString(),
    }

    const jsonContent = JSON.stringify(canvasPayload, null, 2)
    const filename = `canvas/${projectId}.json`

    const { blobUrl, fallback } = await uploadArtifactToBlob(
      filename,
      jsonContent,
      'application/json;charset=utf-8'
    )

    // Optionally sync metadata directly to Convex (useful for direct API / Postman clients)
    if (persistToConvex === true) {
      interface RawNode {
        id?: unknown
        position?: { x?: number; y?: number }
        data?: { shape?: unknown; color?: unknown; label?: unknown }
      }
      interface RawEdge {
        source?: unknown
        target?: unknown
        data?: { label?: unknown }
      }
      const snapshot = {
        nodes: (nodeList as RawNode[]).map((n) => ({
          id: n.id,
          x: n.position?.x ?? 0,
          y: n.position?.y ?? 0,
          shape: n.data?.shape,
          color: n.data?.color,
          label: n.data?.label,
        })),
        edges: (edgeList as RawEdge[]).map((e) => ({
          source: e.source,
          target: e.target,
          label: e.data?.label,
        })),
      }

      await authResult.ctx.convex.mutation(api.projects.saveCanvas, {
        projectId: typedId,
        canvasJsonPath: blobUrl,
        nodeCount: nodeList.length,
        edgeCount: edgeList.length,
        snapshot,
      })
    }

    return NextResponse.json({
      success: true,
      blobUrl,
      ...(fallback ? { fallback: true } : {}),
    })
  } catch (error) {
    return handleApiError(error, 'Failed to save canvas')
  }
}
