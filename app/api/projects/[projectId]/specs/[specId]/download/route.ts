import { NextResponse } from 'next/server'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getAuthenticatedConvex, handleApiError, readVerifiedArtifact } from '@/lib/api-auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  try {
    const { projectId, specId } = await params
    const { convex } = authResult.ctx

    const project = await convex.query(api.projects.getById, {
      projectId: projectId as Id<'projects'>,
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 })
    }

    const spec = await convex.query(api.specs.getById, {
      specId: specId as Id<'specs'>,
    })
    if (!spec || spec.projectId !== project._id) {
      return NextResponse.json({ error: 'Spec not found for this project' }, { status: 404 })
    }

    const artifact = await readVerifiedArtifact(spec.filePath)
    if (!artifact.ok) {
      return NextResponse.json({ error: artifact.error }, { status: artifact.status })
    }

    const safeFilename =
      spec.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || specId

    return new NextResponse(artifact.content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeFilename}.md"`,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Failed to download specification')
  }
}
