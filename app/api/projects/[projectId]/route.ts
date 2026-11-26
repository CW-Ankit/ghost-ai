import { NextResponse } from 'next/server'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getAuthenticatedConvex, handleApiError, parseJsonBody } from '@/lib/api-auth'

const VALID_STATUSES = new Set(['DRAFT', 'ARCHIVED', 'REVIEW'])
const VALID_PUBLIC_ACCESS = new Set(['PRIVATE', 'VIEW_ONLY'])

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  try {
    const { projectId } = await params
    const project = await authResult.ctx.convex.query(api.projects.getById, {
      projectId: projectId as Id<'projects'>,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    return handleApiError(error, 'Failed to load project')
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  const bodyResult = await parseJsonBody<{
    name?: unknown
    status?: unknown
    tags?: unknown
    publicAccess?: unknown
  }>(request)
  if (!bodyResult.ok) return bodyResult.response

  const { name, status, tags, publicAccess } = bodyResult.data
  if (
    name === undefined &&
    status === undefined &&
    tags === undefined &&
    publicAccess === undefined
  ) {
    return NextResponse.json(
      { error: 'At least one field (name, status, tags, publicAccess) must be provided' },
      { status: 400 }
    )
  }

  try {
    const { projectId } = await params
    const typedId = projectId as Id<'projects'>
    const { convex } = authResult.ctx

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 })
      }
      await convex.mutation(api.projects.rename, { projectId: typedId, name: name.trim() })
    }

    if (status !== undefined) {
      if (typeof status !== 'string' || !VALID_STATUSES.has(status)) {
        return NextResponse.json(
          { error: 'status must be one of DRAFT, ARCHIVED, REVIEW' },
          { status: 400 }
        )
      }
      await convex.mutation(api.projects.updateStatus, {
        projectId: typedId,
        status: status as 'DRAFT' | 'ARCHIVED' | 'REVIEW',
      })
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string')) {
        return NextResponse.json({ error: 'tags must be an array of strings' }, { status: 400 })
      }
      await convex.mutation(api.projects.updateTags, { projectId: typedId, tags })
    }

    if (publicAccess !== undefined) {
      if (typeof publicAccess !== 'string' || !VALID_PUBLIC_ACCESS.has(publicAccess)) {
        return NextResponse.json(
          { error: 'publicAccess must be PRIVATE or VIEW_ONLY' },
          { status: 400 }
        )
      }
      await convex.mutation(api.projects.setPublicAccess, {
        projectId: typedId,
        publicAccess: publicAccess as 'PRIVATE' | 'VIEW_ONLY',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Failed to update project')
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  try {
    const { projectId } = await params
    await authResult.ctx.convex.mutation(api.projects.remove, {
      projectId: projectId as Id<'projects'>,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Failed to delete project')
  }
}
