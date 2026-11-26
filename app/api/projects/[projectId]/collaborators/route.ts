import { clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getAuthenticatedConvex, handleApiError, parseJsonBody } from '@/lib/api-auth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  try {
    const { projectId } = await params
    const collaborators = await authResult.ctx.convex.query(api.projects.getCollaborators, {
      projectId: projectId as Id<'projects'>,
    })

    if (!collaborators) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 })
    }

    if (collaborators.length === 0) {
      return NextResponse.json([])
    }

    const emails = collaborators.map((c) => c.email)
    const usersByEmail = new Map<string, { name: string | null; avatarUrl: string | null }>()

    try {
      const client = await clerkClient()
      const users = await client.users.getUserList({
        emailAddress: emails,
        limit: Math.min(emails.length, 100),
      })

      for (const user of users.data) {
        const displayName = user.firstName
          ? `${user.firstName} ${user.lastName || ''}`.trim()
          : user.username || null
        for (const emailObj of user.emailAddresses) {
          usersByEmail.set(emailObj.emailAddress.toLowerCase(), {
            name: displayName,
            avatarUrl: user.imageUrl || null,
          })
        }
      }
    } catch (clerkErr) {
      // Fall back to email-only display if Clerk user lookup is unavailable
      console.warn('Clerk collaborator enrichment failed, returning raw emails:', clerkErr)
    }

    const enrichedCollaborators = collaborators.map((collab) => {
      const profile = usersByEmail.get(collab.email.toLowerCase())
      return {
        email: collab.email,
        name: profile?.name ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
      }
    })

    return NextResponse.json(enrichedCollaborators)
  } catch (error) {
    return handleApiError(error, 'Failed to fetch collaborators')
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  const bodyResult = await parseJsonBody<{ email?: unknown }>(request)
  if (!bodyResult.ok) return bodyResult.response

  const { email } = bodyResult.data
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
  }

  try {
    const { projectId } = await params
    await authResult.ctx.convex.mutation(api.projects.addCollaborator, {
      projectId: projectId as Id<'projects'>,
      email: email.trim().toLowerCase(),
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Failed to invite collaborator')
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 })
    }

    const { projectId } = await params
    await authResult.ctx.convex.mutation(api.projects.removeCollaborator, {
      projectId: projectId as Id<'projects'>,
      email: email.trim().toLowerCase(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Failed to remove collaborator')
  }
}
