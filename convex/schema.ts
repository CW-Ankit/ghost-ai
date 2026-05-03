import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    ownerId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("DRAFT"), v.literal("ARCHIVED")),
    roomId: v.string(),
    canvasJsonPath: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_ownerId", ["ownerId"]),

  projectCollaborators: defineTable({
    projectId: v.id("projects"),
    email: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_projectId_and_email", ["projectId", "email"]),
});
