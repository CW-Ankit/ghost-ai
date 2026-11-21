import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ specId: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { specId } = await params
    const url = req.nextUrl.searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'Missing spec url parameter' }, { status: 400 })
    }

    // Fetch the markdown from Blob URL or decode from data URI
    let content = ''
    if (url.startsWith('data:')) {
      const commaIndex = url.indexOf(',')
      content = decodeURIComponent(url.slice(commaIndex + 1))
    } else {
      const response = await fetch(url)
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch spec content: ${response.statusText}` },
          { status: response.status }
        )
      }
      content = await response.text()
    }
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${specId}.md"`,
      },
    })
  } catch (error: any) {
    console.error('Error proxying spec content:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to download spec' },
      { status: 500 }
    )
  }
}
