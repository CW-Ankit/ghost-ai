import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated");
    }

    return await ctx.db
      .query("projects")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", identity.tokenIdentifier))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated");
    }

    const now = Date.now();
    return await ctx.db.insert("projects", {
      ownerId: identity.tokenIdentifier,
      name: args.name ?? "Untitled Project",
      description: args.description, // now matches schema v.optional
      status: "DRAFT",
      roomId: args.roomId,
      // Removed placeholder canvasJsonPath; let the client/action set it once we have the projectId
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const rename = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.ownerId !== identity.tokenIdentifier) {
      throw new ConvexError("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      name: args.name,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const remove = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.ownerId !== identity.tokenIdentifier) {
      throw new ConvexError("Project not found");
    }

    await ctx.db.delete(args.projectId);

    return true;
  },
});
