import { v } from 'convex/values'
import { internalMutation, query } from './_generated/server'

// --- Internal mutations for task run management ---

export const insertTaskRun = internalMutation({
  args: {
    projectId: v.id('projects'),
    type: v.union(v.literal('design'), v.literal('spec')),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('taskRuns', {
      projectId: args.projectId,
      type: args.type,
      status: 'pending',
      prompt: args.prompt,
      startedAt: Date.now(),
    })
  },
})

export const patchTaskRun = internalMutation({
  args: {
    taskRunId: v.id('taskRuns'),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed')
    ),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = { status: args.status }
    if (args.result !== undefined) updates.result = args.result
    if (args.error !== undefined) updates.error = args.error
    if (args.status === 'completed' || args.status === 'failed') {
      updates.completedAt = Date.now()
    }
    await ctx.db.patch(args.taskRunId, updates)
  },
})

export const insertSpec = internalMutation({
  args: {
    projectId: v.id('projects'),
    taskRunId: v.id('taskRuns'),
    title: v.string(),
    filePath: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('specs', {
      projectId: args.projectId,
      taskRunId: args.taskRunId,
      title: args.title,
      filePath: args.filePath,
      status: 'ready',
      createdAt: Date.now(),
    })
  },
})

// --- Public queries for task runs ---

export const getTaskRun = query({
  args: { taskRunId: v.id('taskRuns') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return await ctx.db.get(args.taskRunId)
  },
})

export const getLatestTaskRun = query({
  args: {
    projectId: v.id('projects'),
    type: v.union(v.literal('design'), v.literal('spec')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const runs = await ctx.db
      .query('taskRuns')
      .withIndex('by_projectId', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .take(10)

    return runs.find((r) => r.type === args.type) ?? null
  },
})

export const getTaskRunsByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    return await ctx.db
      .query('taskRuns')
      .withIndex('by_projectId', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .take(20)
  },
})
