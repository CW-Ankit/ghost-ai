import { v, ConvexError } from 'convex/values'
import { query, mutation } from './_generated/server'
import { requireProjectOwner, resolveProjectAccess } from './lib/access'

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    const project = await ctx.db.get(args.projectId)
    if (!project) {
      return []
    }

    const access = await resolveProjectAccess(ctx, project, identity)
    if (!access) {
      return []
    }

    return await ctx.db
      .query('specs')
      .withIndex('by_projectId', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .take(100)
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

    const access = await resolveProjectAccess(ctx, project, identity)
    if (!access) {
      return null
    }

    return spec
  },
})

export const remove = mutation({
  args: { specId: v.id('specs') },
  handler: async (ctx, args) => {
    const spec = await ctx.db.get(args.specId)
    if (!spec) {
      throw new ConvexError('Spec not found')
    }

    await requireProjectOwner(
      ctx,
      spec.projectId,
      'Only the project owner can delete specifications'
    )

    await ctx.db.delete(args.specId)
    return true
  },
})
