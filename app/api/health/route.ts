import { NextResponse } from 'next/server'

export async function GET() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  let convexReachable = false

  if (convexUrl) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 2500)
      const res = await fetch(convexUrl, { method: 'HEAD', signal: controller.signal })
      clearTimeout(timer)
      convexReachable = res.status < 500
    } catch {
      convexReachable = false
    }
  }

  const services = {
    convexConfigured: Boolean(convexUrl),
    convexReachable,
    clerkConfigured: Boolean(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
    ),
    liveblocksConfigured: Boolean(
      process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY && process.env.LIVEBLOCKS_SECRET_KEY
    ),
    vercelBlobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  }

  const healthy = services.convexConfigured && services.clerkConfigured && services.liveblocksConfigured

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
    },
    { status: healthy ? 200 : 503 }
  )
}
