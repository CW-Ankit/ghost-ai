import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId, getToken } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  try {
    const token = await getToken({ template: 'convex' })
    if (!token) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const convexHttpClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
    convexHttpClient.setAuth(token)

    const projects = await (convexHttpClient.query as any)(api.projects.list, {})
    return NextResponse.json(projects)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { userId, getToken } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  try {
    const body = await request.json()
    if (!body.roomId || typeof body.roomId !== 'string') {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
    }
    const token = await getToken({ template: 'convex' })
    if (!token) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const convexHttpClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
    convexHttpClient.setAuth(token)

    const projectId = await (convexHttpClient.mutation as any)(api.projects.create, {
      name: body.name,
      description: body.description,
      roomId: body.roomId,
    })

    return NextResponse.json({ projectId }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
