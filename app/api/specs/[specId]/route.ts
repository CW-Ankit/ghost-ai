import { NextRequest, NextResponse } from 'next/server'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  getAuthenticatedConvex,
  getOptionalConvex,
  handleApiError,
  readVerifiedArtifact,
} from '@/lib/api-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ specId: string }> }
) {
  try {
    const { specId } = await params
    const { userId, convex } = await getOptionalConvex()

    const spec = await convex.query(api.specs.getById, {
      specId: specId as Id<'specs'>,
    })

    if (!spec) {
      return NextResponse.json(
        { error: userId ? 'Spec not found or unauthorized' : 'Unauthorized' },
        { status: userId ? 404 : 401 }
      )
    }

    // If a client passed ?url=..., enforce it matches the verified Convex record (prevents SSRF)
    const requestedUrl = req.nextUrl.searchParams.get('url')
    if (requestedUrl && requestedUrl !== spec.filePath) {
      return NextResponse.json({ error: 'Spec URL mismatch' }, { status: 403 })
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
    return handleApiError(error, 'Failed to download spec')
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ specId: string }> }
) {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  try {
    const { specId } = await params
    await authResult.ctx.convex.mutation(api.specs.remove, {
      specId: specId as Id<'specs'>,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Failed to delete spec')
  }
}
