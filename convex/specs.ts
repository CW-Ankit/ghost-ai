import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { ConvexError } from 'convex/values'

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    const project = await ctx.db.get(args.projectId)
    if (!project) {
      return []
    }

    // Verify access
    const isOwner = Boolean(identity && project.ownerId === identity.tokenIdentifier)
    let isCollaborator = false

    if (identity?.email) {
      const collaboration = await ctx.db
        .query('projectCollaborators')
        .withIndex('by_projectId_and_email', (q) =>
          q.eq('projectId', args.projectId).eq('email', identity.email!)
        )
        .unique()
      if (collaboration) isCollaborator = true
    }

    const isPublicView = project.publicAccess === 'VIEW_ONLY'

    if (!isOwner && !isCollaborator && !isPublicView) {
      return []
    }

    return await ctx.db
      .query('specs')
      .withIndex('by_projectId', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .collect()
  },
})

export const getById = query({
  args: { specId: v.id('specs') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    const spec = await ctx.db.get(args.specId)
    if (!spec) {
      return null
    }

    const project = await ctx.db.get(spec.projectId)
    if (!project) {
      return null
    }

    const isOwner = Boolean(identity && project.ownerId === identity.tokenIdentifier)
    let isCollaborator = false

    if (identity?.email) {
      const collaboration = await ctx.db
        .query('projectCollaborators')
        .withIndex('by_projectId_and_email', (q) =>
          q.eq('projectId', project._id).eq('email', identity.email!)
        )
        .unique()
      if (collaboration) isCollaborator = true
    }

    const isPublicView = project.publicAccess === 'VIEW_ONLY'

    if (!isOwner && !isCollaborator && !isPublicView) {
      return null
    }

    return spec
  },
})

export const remove = mutation({
  args: { specId: v.id('specs') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError('Unauthenticated')
    }

    const spec = await ctx.db.get(args.specId)
    if (!spec) {
      throw new ConvexError('Spec not found')
    }

    const project = await ctx.db.get(spec.projectId)
    if (!project || project.ownerId !== identity.tokenIdentifier) {
      throw new ConvexError('Only the project owner can delete specifications')
    }

    await ctx.db.delete(args.specId)
    return true
  },
})
