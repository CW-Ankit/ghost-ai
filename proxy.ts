import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/specs/upload(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  if (isPublicRoute(req)) {
    if (userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
      const editorUrl = new URL('/editor', req.url)
      return NextResponse.redirect(editorUrl)
    }
    return // Allow public access to sign-in/up and internal upload API
  }

  if (!userId) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const signInUrl = new URL('/sign-in', req.url)
    return NextResponse.redirect(signInUrl)
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
