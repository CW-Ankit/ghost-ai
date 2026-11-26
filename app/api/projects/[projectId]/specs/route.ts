import { NextResponse } from 'next/server'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getAuthenticatedConvex, handleApiError } from '@/lib/api-auth'

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

    const specs = await authResult.ctx.convex.query(api.specs.listByProject, {
      projectId: projectId as Id<'projects'>,
    })

    return NextResponse.json(specs)
  } catch (error) {
    return handleApiError(error, 'Failed to list project specs')
  }
}
