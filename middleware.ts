import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/**
 * Protect all routes except public ones.
 * `/__clerk/:path*` MUST be in the matcher so Clerk's auto-proxy works on
 * *.vercel.app production deployments (no custom DNS needed).
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/__clerk(.*)', // Clerk auto-proxy — required for vercel.app domains
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    /*
     * Run middleware on all routes except Next.js internals and static files.
     * `/__clerk/:path*` is explicitly included so the Clerk proxy path
     * (https://ghost-ai-zeta.vercel.app/__clerk) is always handled.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/__clerk/:path*',
  ],
}
