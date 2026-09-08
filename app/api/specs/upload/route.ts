import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    // Allow if authenticated or internal call
    const isInternal = req.headers.get('x-internal-secret') === process.env.CONVEX_INTERNAL_SECRET
    if (!userId && !isInternal) {
      // Still allow if siteUrl is local/development, or check auth
      if (process.env.NODE_ENV === 'production' && !isInternal) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await req.json()
    const { projectId, specId, content } = body

    if (!projectId || !specId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, specId, content' },
        { status: 400 }
      )
    }

    const filename = `specs/${projectId}/${specId}.md`

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(filename, content, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'text/markdown; charset=utf-8',
      })

      return NextResponse.json({
        success: true,
        blobUrl: blob.url,
      })
    } else {
      // Local development fallback
      const fallbackUrl = `https://blob.vercel-storage.com/${filename}`
      return NextResponse.json({
        success: true,
        blobUrl: fallbackUrl,
        fallback: true,
      })
    }
  } catch (error: any) {
    console.error('Failed to upload spec:', error)
    return NextResponse.json({ error: error?.message || 'Failed to upload spec' }, { status: 500 })
  }
}
