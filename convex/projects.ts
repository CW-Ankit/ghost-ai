import { v, ConvexError } from 'convex/values'
import { internalQuery, mutation, query } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import {
  cascadeDeleteProject,
  isValidEmail,
  normalizeEmail,
  requireIdentity,
  requireProjectMember,
  requireProjectOwner,
  resolveProjectAccess,
} from './lib/access'

const ACTIVE_PRESENCE_WINDOW_MS = 60 * 1000

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const userIdentifier = identity.tokenIdentifier
    const rawEmail = identity.email
    const normalizedEmail = rawEmail ? normalizeEmail(rawEmail) : undefined

    // Get user's pinned projects
    const favorites = await ctx.db
      .query('favorites')
      .withIndex('by_userId', (q) => q.eq('userId', userIdentifier))
      .take(200)
    const pinnedProjectIds = new Set(favorites.map((f) => f.projectId))

    // Get owned projects
    const ownedProjects = await ctx.db
      .query('projects')
      .withIndex('by_ownerId', (q) => q.eq('ownerId', userIdentifier))
      .take(200)

    // Get shared projects if email is available
    let sharedProjects: Doc<'projects'>[] = []
    if (normalizedEmail) {
      const collaborations = await ctx.db
        .query('projectCollaborators')
        .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
        .take(200)

      const legacyCollaborations =
        rawEmail && rawEmail !== normalizedEmail
          ? await ctx.db
              .query('projectCollaborators')
              .withIndex('by_email', (q) => q.eq('email', rawEmail))
              .take(200)
          : []

      const uniqueSharedIds = Array.from(
        new Set([...collaborations, ...legacyCollaborations].map((c) => c.projectId))
      )

      sharedProjects = (
        await Promise.all(uniqueSharedIds.map((projectId) => ctx.db.get(projectId)))
      ).filter((p): p is Doc<'projects'> => p !== null)
    }

    const ownedProjectIds = new Set(ownedProjects.map((p) => p._id))
    const allAccessibleProjects = [
      ...ownedProjects,
      ...sharedProjects.filter((p) => !ownedProjectIds.has(p._id)),
    ]

    const cutoff = Date.now() - ACTIVE_PRESENCE_WINDOW_MS

    // Calculate active users for each accessible project using indexed queries
    const projectsWithMetadata = await Promise.all(
      allAccessibleProjects.map(async (p) => {
        const presenceRows = await ctx.db
          .query('presence')
          .withIndex('by_projectId', (q) => q.eq('projectId', p._id))
          .take(100)
        const activeCount = presenceRows.filter((row) => row.lastActive > cutoff).length

        return {
          ...p,
          isPinned: pinnedProjectIds.has(p._id),
          activeUsers: activeCount,
        }
      })
    )

    const ownedWithPinned = projectsWithMetadata.filter((p) => ownedProjectIds.has(p._id))
    const sharedWithPinned = projectsWithMetadata.filter((p) => !ownedProjectIds.has(p._id))

    return {
      owned: ownedWithPinned,
      shared: sharedWithPinned,
    }
  },
})

export const getById = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const project = await ctx.db.get(args.projectId)
    if (!project) {
      return null
    }

    const access = await resolveProjectAccess(ctx, project, identity)
    if (!access) {
      return null
    }

    return {
      ...project,
      role: access.role,
      isReadOnly: access.isReadOnly,
    }
  },
})

export const verifyMemberAccess = internalQuery({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return { ok: false as const, error: 'Unauthenticated' }
    }

    const project = await ctx.db.get(args.projectId)
    if (!project) {
      return { ok: false as const, error: 'Project not found' }
    }

    const access = await resolveProjectAccess(ctx, project, identity)
    if (!access || access.isReadOnly) {
      return {
        ok: false as const,
        error: 'Unauthorized: You do not have edit permission for this project',
      }
    }

    return {
      ok: true as const,
      role: access.role,
      userId: identity.tokenIdentifier,
    }
  },
})

export const create = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)

    const trimmedRoomId = args.roomId.trim()
    if (!trimmedRoomId) {
      throw new ConvexError('roomId is required')
    }

    const trimmedName = args.name?.trim()
    const name = trimmedName && trimmedName.length > 0 ? trimmedName : 'Untitled Project'

    const now = Date.now()
    return await ctx.db.insert('projects', {
      ownerId: identity.tokenIdentifier,
      name,
      description: args.description?.trim() || undefined,
      status: 'DRAFT',
      publicAccess: 'PRIVATE',
      roomId: trimmedRoomId,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const rename = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireProjectOwner(ctx, args.projectId, 'Only the project owner can rename this project')

    const trimmed = args.name.trim()
    if (!trimmed) {
      throw new ConvexError('Project name cannot be empty')
    }

    await ctx.db.patch(args.projectId, {
      name: trimmed,
      updatedAt: Date.now(),
    })

    return true
  },
})

export const remove = mutation({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    await requireProjectOwner(ctx, args.projectId, 'Only the project owner can delete this project')
    await cascadeDeleteProject(ctx, args.projectId)
    return true
  },
})

export const getCollaborators = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const project = await ctx.db.get(args.projectId)
    if (!project) {
      return null
    }

    const access = await resolveProjectAccess(ctx, project, identity)
    if (!access || access.isReadOnly) {
      return null
    }

    return await ctx.db
      .query('projectCollaborators')
      .withIndex('by_projectId_and_email', (q) => q.eq('projectId', args.projectId))
      .take(200)
  },
})

export const addCollaborator = mutation({
  args: {
    projectId: v.id('projects'),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireProjectOwner(
      ctx,
      args.projectId,
      'Only the project owner can invite collaborators'
    )

    if (!isValidEmail(args.email)) {
      throw new ConvexError('Invalid email address')
    }

    const normalizedEmail = normalizeEmail(args.email)
    if (identity.email && normalizeEmail(identity.email) === normalizedEmail) {
      throw new ConvexError('Cannot invite the project owner as a collaborator')
    }

    const existing = await ctx.db
      .query('projectCollaborators')
      .withIndex('by_projectId_and_email', (q) =>
        q.eq('projectId', args.projectId).eq('email', normalizedEmail)
      )
      .unique()

    if (existing) {
      throw new ConvexError('User already invited')
    }

    await ctx.db.insert('projectCollaborators', {
      projectId: args.projectId,
      email: normalizedEmail,
      createdAt: Date.now(),
    })

    return true
  },
})

export const removeCollaborator = mutation({
  args: {
    projectId: v.id('projects'),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await requireProjectOwner(
      ctx,
      args.projectId,
      'Only the project owner can remove collaborators'
    )

    const normalizedEmail = normalizeEmail(args.email)
    let collaborator = await ctx.db
      .query('projectCollaborators')
      .withIndex('by_projectId_and_email', (q) =>
        q.eq('projectId', args.projectId).eq('email', normalizedEmail)
      )
      .unique()

    if (!collaborator && args.email !== normalizedEmail) {
      collaborator = await ctx.db
        .query('projectCollaborators')
        .withIndex('by_projectId_and_email', (q) =>
          q.eq('projectId', args.projectId).eq('email', args.email)
        )
        .unique()
    }

    if (!collaborator) {
      throw new ConvexError('Collaborator not found')
    }

    await ctx.db.delete(collaborator._id)

    return true
  },
})

export const togglePin = mutation({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)
    const project = await ctx.db.get(args.projectId)
    if (!project) {
      throw new ConvexError('Project not found')
    }

    const access = await resolveProjectAccess(ctx, project, identity)
    if (!access) {
      throw new ConvexError('Unauthorized')
    }

    const userId = identity.tokenIdentifier
    const favorite = await ctx.db
      .query('favorites')
      .withIndex('by_userId_and_projectId', (q) =>
        q.eq('userId', userId).eq('projectId', args.projectId)
      )
      .unique()

    if (favorite) {
      await ctx.db.delete(favorite._id)
      return { pinned: false }
    }

    await ctx.db.insert('favorites', {
      userId,
      projectId: args.projectId,
      createdAt: Date.now(),
    })
    return { pinned: true }
  },
})

export const updateSnapshot = mutation({
  args: {
    projectId: v.id('projects'),
    snapshot: v.any(),
    nodeCount: v.optional(v.number()),
    edgeCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity, project } = await requireProjectMember(ctx, args.projectId)

    await ctx.db.patch(args.projectId, {
      canvasSnapshot: args.snapshot,
      nodeCount: args.nodeCount ?? project.nodeCount,
      edgeCount: args.edgeCount ?? project.edgeCount,
      lastContributorId: identity.tokenIdentifier,
      updatedAt: Date.now(),
    })

    return true
  },
})

export const updateStatus = mutation({
  args: {
    projectId: v.id('projects'),
    status: v.union(v.literal('DRAFT'), v.literal('ARCHIVED'), v.literal('REVIEW')),
  },
  handler: async (ctx, args) => {
    await requireProjectOwner(ctx, args.projectId)

    await ctx.db.patch(args.projectId, {
      status: args.status,
      updatedAt: Date.now(),
    })

    return true
  },
})

export const bulkUpdateStatus = mutation({
  args: {
    projectIds: v.array(v.id('projects')),
    status: v.union(v.literal('DRAFT'), v.literal('ARCHIVED'), v.literal('REVIEW')),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)

    for (const projectId of args.projectIds) {
      const project = await ctx.db.get(projectId)
      if (project && project.ownerId === identity.tokenIdentifier) {
        await ctx.db.patch(projectId, { status: args.status, updatedAt: Date.now() })
      }
    }
    return true
  },
})

export const bulkDelete = mutation({
  args: {
    projectIds: v.array(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)

    for (const projectId of args.projectIds) {
      const project = await ctx.db.get(projectId)
      if (project && project.ownerId === identity.tokenIdentifier) {
        await cascadeDeleteProject(ctx, projectId)
      }
    }
    return true
  },
})

export const updateTags = mutation({
  args: {
    projectId: v.id('projects'),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireProjectOwner(ctx, args.projectId)

    const sanitizedTags = Array.from(
      new Set(args.tags.map((t) => t.trim()).filter((t) => t.length > 0))
    )

    await ctx.db.patch(args.projectId, {
      tags: sanitizedTags,
      updatedAt: Date.now(),
    })
    return true
  },
})

export const setPublicAccess = mutation({
  args: {
    projectId: v.id('projects'),
    publicAccess: v.union(v.literal('PRIVATE'), v.literal('VIEW_ONLY')),
  },
  handler: async (ctx, args) => {
    await requireProjectOwner(
      ctx,
      args.projectId,
      'Only the project owner can change sharing settings'
    )

    await ctx.db.patch(args.projectId, {
      publicAccess: args.publicAccess,
      updatedAt: Date.now(),
    })

    return true
  },
})

export const getByRoomId = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    if (!args.roomId.trim()) {
      return null
    }

    const identity = await ctx.auth.getUserIdentity()

    const project = await ctx.db
      .query('projects')
      .withIndex('by_roomId', (q) => q.eq('roomId', args.roomId))
      .unique()

    if (!project) {
      return null
    }

    const access = await resolveProjectAccess(ctx, project, identity)
    if (!access) {
      return null
    }

    return {
      ...project,
      role: access.role,
      isReadOnly: access.isReadOnly,
    }
  },
})

export const saveCanvas = mutation({
  args: {
    projectId: v.id('projects'),
    canvasJsonPath: v.string(),
    nodeCount: v.optional(v.number()),
    edgeCount: v.optional(v.number()),
    snapshot: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { identity, project } = await requireProjectMember(ctx, args.projectId)

    await ctx.db.patch(args.projectId, {
      canvasJsonPath: args.canvasJsonPath,
      nodeCount: args.nodeCount ?? project.nodeCount,
      edgeCount: args.edgeCount ?? project.edgeCount,
      canvasSnapshot: args.snapshot ?? project.canvasSnapshot,
      lastContributorId: identity.tokenIdentifier,
      updatedAt: Date.now(),
    })

    return { success: true, canvasJsonPath: args.canvasJsonPath }
  },
})

export const getCanvasUrl = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    const project = await ctx.db.get(args.projectId)
    if (!project) {
      return null
    }

    const access = await resolveProjectAccess(ctx, project, identity)
    if (!access) {
      return null
    }

    return project.canvasJsonPath ?? null
  },
})
