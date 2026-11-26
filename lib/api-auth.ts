import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { NextResponse } from 'next/server'

export interface AuthenticatedConvexContext {
  userId: string
  token: string
  convex: ConvexHttpClient
}

/**
 * Resolves the Clerk session and creates a per-request authenticated ConvexHttpClient.
 * Returns either the authenticated context or a ready-to-return 401/500 NextResponse.
 */
export async function getAuthenticatedConvex(): Promise<
  | { ok: true; ctx: AuthenticatedConvexContext }
  | { ok: false; response: NextResponse }
> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'NEXT_PUBLIC_CONVEX_URL is not configured' },
        { status: 500 }
      ),
    }
  }

  const { userId, getToken } = await auth()
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }),
    }
  }

  let token: string | null = null
  try {
    token = await getToken({ template: 'convex' })
  } catch {
    token = await getToken().catch(() => null)
  }

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }),
    }
  }

  const convex = new ConvexHttpClient(convexUrl)
  convex.setAuth(token)

  return {
    ok: true,
    ctx: { userId, token, convex },
  }
}

/**
 * Creates a ConvexHttpClient optionally authenticated with the current Clerk session.
 * Useful for endpoints that support both authenticated users and public VIEW_ONLY access.
 */
export async function getOptionalConvex(): Promise<{
  userId: string | null
  token: string | null
  convex: ConvexHttpClient
}> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured')
  }

  const { userId, getToken } = await auth()
  let token: string | null = null
  if (userId) {
    try {
      token = await getToken({ template: 'convex' })
    } catch {
      token = await getToken().catch(() => null)
    }
  }

  const convex = new ConvexHttpClient(convexUrl)
  if (token) {
    convex.setAuth(token)
  }

  return { userId: userId ?? null, token, convex }
}

/**
 * Safely parses a JSON request body, returning a 400 NextResponse on invalid JSON.
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  req: Request
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  try {
    const data = (await req.json()) as T
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 }),
      }
    }
    return { ok: true, data }
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 }),
    }
  }
}

/**
 * Validates that a remote artifact URL is safe to fetch server-side (SSRF guard).
 * Allows data:text/markdown or data:application/json URIs and Vercel Blob HTTPS URLs.
 */
export function isAllowedArtifactUrl(rawUrl: string): boolean {
  if (rawUrl.startsWith('data:text/markdown') || rawUrl.startsWith('data:application/json')) {
    return true
  }
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'https:') return false
    const hostname = parsed.hostname.toLowerCase()
    return (
      hostname === 'blob.vercel-storage.com' ||
      hostname.endsWith('.blob.vercel-storage.com') ||
      hostname.endsWith('.public.blob.vercel-storage.com')
    )
  } catch {
    return false
  }
}

/**
 * Safely reads text content from a verified data URI or allowed Vercel Blob HTTPS URL.
 */
export async function readVerifiedArtifact(
  artifactUrl: string
): Promise<{ ok: true; content: string } | { ok: false; status: number; error: string }> {
  if (!isAllowedArtifactUrl(artifactUrl)) {
    return { ok: false, status: 400, error: 'Unsupported or untrusted artifact URL' }
  }

  if (artifactUrl.startsWith('data:')) {
    const commaIndex = artifactUrl.indexOf(',')
    if (commaIndex === -1) {
      return { ok: false, status: 400, error: 'Malformed data URI' }
    }
    return { ok: true, content: decodeURIComponent(artifactUrl.slice(commaIndex + 1)) }
  }

  const response = await fetch(artifactUrl)
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: `Failed to fetch artifact content: ${response.statusText}`,
    }
  }

  return { ok: true, content: await response.text() }
}

/**
 * Maps ConvexError and application errors to predictable HTTP status codes.
 */
export function handleApiError(error: unknown, fallbackMessage = 'Internal server error'): NextResponse {
  const message = error instanceof Error ? error.message : fallbackMessage
  const lower = message.toLowerCase()

  if (lower.includes('unauthenticated')) {
    return NextResponse.json({ error: message }, { status: 401 })
  }
  if (
    lower.includes('unauthorized') ||
    lower.includes('only the project owner') ||
    lower.includes('do not have permission') ||
    lower.includes('do not have edit permission')
  ) {
    return NextResponse.json({ error: message }, { status: 403 })
  }
  if (lower.includes('not found')) {
    return NextResponse.json({ error: message }, { status: 404 })
  }
  if (lower.includes('already invited') || lower.includes('already exists')) {
    return NextResponse.json({ error: message }, { status: 409 })
  }
  if (
    lower.includes('invalid') ||
    lower.includes('required') ||
    lower.includes('cannot be empty') ||
    lower.includes('cannot invite') ||
    lower.includes('must contain') ||
    lower.includes('validator error') ||
    lower.includes('argumentvalidationerror') ||
    lower.includes('expected id') ||
    lower.includes('unable to validate id')
  ) {
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ error: message || fallbackMessage }, { status: 500 })
}
