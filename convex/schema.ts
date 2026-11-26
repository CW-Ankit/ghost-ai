import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  projects: defineTable({
    ownerId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal('DRAFT'), v.literal('ARCHIVED'), v.literal('REVIEW')),
    publicAccess: v.optional(v.union(v.literal('PRIVATE'), v.literal('VIEW_ONLY'))),
    roomId: v.string(),
    canvasJsonPath: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    pinned: v.optional(v.boolean()),
    lastAccessedAt: v.optional(v.number()),
    nodeCount: v.optional(v.number()),
    edgeCount: v.optional(v.number()),
    lastContributorId: v.optional(v.string()),
    canvasSnapshot: v.optional(
      v.object({
        nodes: v.array(v.any()),
        edges: v.array(v.any()),
      })
    ),
    tags: v.optional(v.array(v.string())),
  })
    .index('by_ownerId', ['ownerId'])
    .index('by_roomId', ['roomId']),

  projectCollaborators: defineTable({
    projectId: v.id('projects'),
    email: v.string(),
    createdAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_projectId_and_email', ['projectId', 'email']),

  favorites: defineTable({
    userId: v.string(),
    projectId: v.id('projects'),
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_projectId', ['projectId'])
    .index('by_userId_and_projectId', ['userId', 'projectId']),

  presence: defineTable({
    userId: v.string(),
    projectId: v.id('projects'),
    lastActive: v.number(),
  })
    .index('by_projectId', ['projectId'])
    .index('by_userId', ['userId'])
    .index('by_lastActive', ['lastActive'])
    .index('by_projectId_and_userId', ['projectId', 'userId']),

  taskRuns: defineTable({
    projectId: v.id('projects'),
    type: v.union(v.literal('design'), v.literal('spec')),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed')
    ),
    prompt: v.optional(v.string()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_projectId', ['projectId'])
    .index('by_projectId_and_type', ['projectId', 'type'])
    .index('by_status', ['status']),

  specs: defineTable({
    projectId: v.id('projects'),
    taskRunId: v.optional(v.id('taskRuns')),
    title: v.string(),
    filePath: v.string(),
    status: v.union(v.literal('generating'), v.literal('ready'), v.literal('failed')),
    createdAt: v.number(),
  }).index('by_projectId', ['projectId']),
})
