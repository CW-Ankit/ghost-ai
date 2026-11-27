import { NextRequest, NextResponse } from 'next/server'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  getAuthenticatedConvex,
  handleApiError,
  parseJsonBody,
  uploadArtifactToBlob,
} from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  try {
    const internalSecret = process.env.CONVEX_INTERNAL_SECRET
    const headerSecret = req.headers.get('x-internal-secret')
    const isInternal = Boolean(internalSecret && headerSecret && headerSecret === internalSecret)

    const bodyResult = await parseJsonBody<{
      projectId?: unknown
      specId?: unknown
      content?: unknown
    }>(req)
    if (!bodyResult.ok) return bodyResult.response

    const { projectId, specId, content } = bodyResult.data

    if (
      typeof projectId !== 'string' ||
      !projectId.trim() ||
      typeof specId !== 'string' ||
      !specId.trim() ||
      typeof content !== 'string' ||
      !content.trim()
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, specId, content' },
        { status: 400 }
      )
    }

    if (!isInternal) {
      const authResult = await getAuthenticatedConvex()
      if (!authResult.ok) return authResult.response

      const project = await authResult.ctx.convex.query(api.projects.getById, {
        projectId: projectId as Id<'projects'>,
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
    }

    const safeSpecId = specId.replace(/[^a-zA-Z0-9_-]/g, '')
    if (!safeSpecId) {
      return NextResponse.json({ error: 'Invalid specId' }, { status: 400 })
    }

    const filename = `specs/${projectId}/${safeSpecId}.md`
    const { blobUrl, fallback } = await uploadArtifactToBlob(
      filename,
      content,
      'text/markdown;charset=utf-8'
    )

    return NextResponse.json({
      success: true,
      blobUrl,
      ...(fallback ? { fallback: true } : {}),
    })
  } catch (error) {
    return handleApiError(error, 'Failed to upload spec')
  }
}
