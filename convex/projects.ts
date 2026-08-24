import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userIdentifier = identity.tokenIdentifier;
    const userEmail = identity.email;

    // Get user's pinned projects
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", userIdentifier))
      .collect();
    const pinnedProjectIds = new Set(favorites.map((f) => f.projectId));

    // Get owned projects
    const ownedProjects = await ctx.db
      .query("projects")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", userIdentifier))
      .collect();

    // Get shared projects if email is available
    let sharedProjects: any[] = [];
    if (userEmail) {
      const collaborations = await ctx.db
        .query("projectCollaborators")
        .withIndex("by_email", (q) => q.eq("email", userEmail))
        .collect();
      
      const sharedProjectIds = collaborations.map((c) => c.projectId);
      
      // Fetch shared projects in parallel
      sharedProjects = (await Promise.all(
        sharedProjectIds.map(async (projectId) => {
          const project = await ctx.db.get(projectId);
          return project;
        })
      )).filter((p): p is NonNullable<typeof p> => p !== null);
    }

    const allAccessibleProjects = [...ownedProjects, ...sharedProjects];
    const now = Date.now();
    const timeout = 60 * 1000;

    // Calculate active users for each accessible project in parallel
    const projectsWithMetadata = await Promise.all(
      allAccessibleProjects.map(async (p) => {
        const activeUsers = await ctx.db
          .query("presence")
          .withIndex("by_projectId", (q) => q.eq("projectId", p._id))
          .filter((q) => q.gt(q.field("lastActive"), now - timeout))
          .collect();
        
        return {
          ...p,
          isPinned: pinnedProjectIds.has(p._id),
          activeUsers: activeUsers.length,
        };
      })
    );

    const ownedWithPinned = projectsWithMetadata.filter(p => 
      ownedProjects.some(op => op._id === p._id)
    );
    const sharedWithPinned = projectsWithMetadata.filter(p => 
      sharedProjects.some(sp => sp._id === p._id)
    );

    return {
      owned: ownedWithPinned,
      shared: sharedWithPinned,
    };
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

export const getCollaborators = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("projectCollaborators")
      .withIndex("by_projectId_and_email", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const addCollaborator = mutation({
  args: {
    projectId: v.id("projects"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.ownerId !== identity.tokenIdentifier) {
      throw new ConvexError("Only the project owner can invite collaborators");
    }

    const existing = await ctx.db
      .query("projectCollaborators")
      .withIndex("by_projectId_and_email", (q) => 
        q.eq("projectId", args.projectId).eq("email", args.email)
      )
      .unique();

    if (existing) {
      throw new ConvexError("User already invited");
    }

    await ctx.db.insert("projectCollaborators", {
      projectId: args.projectId,
      email: args.email,
      createdAt: Date.now(),
    });

    return true;
  },
});

export const removeCollaborator = mutation({
  args: {
    projectId: v.id("projects"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.ownerId !== identity.tokenIdentifier) {
      throw new ConvexError("Only the project owner can remove collaborators");
    }

    const collaborator = await ctx.db
      .query("projectCollaborators")
      .withIndex("by_projectId_and_email", (q) => 
        q.eq("projectId", args.projectId).eq("email", args.email)
      )
      .unique();

    if (!collaborator) {
      throw new ConvexError("Collaborator not found");
    }

    await ctx.db.delete(collaborator._id);

    return true;
  },
});

export const togglePin = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated");
    }

    const userId = identity.tokenIdentifier;
    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_userId_and_projectId", (q) => 
        q.eq("userId", userId).eq("projectId", args.projectId)
      )
      .unique();

    if (favorite) {
      await ctx.db.delete(favorite._id);
      return { pinned: false };
    } else {
      await ctx.db.insert("favorites", {
        userId,
        projectId: args.projectId,
        createdAt: Date.now(),
      });
      return { pinned: true };
    }
  },
});

export const updateSnapshot = mutation({
  args: {
    projectId: v.id("projects"),
    snapshot: v.any(),
    nodeCount: v.optional(v.number()),
    edgeCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new ConvexError("Project not found");

    const userId = identity.tokenIdentifier;
    const userEmail = identity.email;

    // Verify project membership: must be owner or a collaborator
    const isOwner = project.ownerId === userId;
    let isCollaborator = false;

    if (userEmail) {
      const collaboration = await ctx.db
        .query("projectCollaborators")
        .withIndex("by_projectId_and_email", (q) => 
          q.eq("projectId", args.projectId).eq("email", userEmail)
        )
        .unique();
      if (collaboration) isCollaborator = true;
    }

    if (!isOwner && !isCollaborator) {
      throw new ConvexError("Unauthorized: You do not have permission to update this project snapshot");
    }
    
    await ctx.db.patch(args.projectId, {
      canvasSnapshot: args.snapshot,
      nodeCount: args.nodeCount ?? project.nodeCount,
      edgeCount: args.edgeCount ?? project.edgeCount,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const updateStatus = mutation({
  args: {
    projectId: v.id("projects"),
    status: v.union(v.literal("DRAFT"), v.literal("ARCHIVED"), v.literal("REVIEW")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.ownerId !== identity.tokenIdentifier) {
      throw new ConvexError("Project not found or unauthorized");
    }

    await ctx.db.patch(args.projectId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const bulkUpdateStatus = mutation({
  args: {
    projectIds: v.array(v.id("projects")),
    status: v.union(v.literal("DRAFT"), v.literal("ARCHIVED"), v.literal("REVIEW")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    for (const projectId of args.projectIds) {
      const project = await ctx.db.get(projectId);
      if (project && project.ownerId === identity.tokenIdentifier) {
        await ctx.db.patch(projectId, { status: args.status, updatedAt: Date.now() });
      }
    }
    return true;
  },
});

export const bulkDelete = mutation({
  args: {
    projectIds: v.array(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    for (const projectId of args.projectIds) {
      const project = await ctx.db.get(projectId);
      if (project && project.ownerId === identity.tokenIdentifier) {
        await ctx.db.delete(projectId);
      }
    }
    return true;
  },
});

export const updateTags = mutation({
  args: {
    projectId: v.id("projects"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.ownerId !== identity.tokenIdentifier) {
      throw new ConvexError("Project not found or unauthorized");
    }

    await ctx.db.patch(args.projectId, { tags: args.tags });
    return true;
  },
});

export const getByRoomId = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .unique();

    if (!project) {
      return null;
    }

    // Check ownership
    if (project.ownerId === identity.tokenIdentifier) {
      return project;
    }

    // Check collaborator access by email
    const userEmail = identity.email;
    if (!userEmail) {
      return null;
    }

    const collaborator = await ctx.db
      .query("projectCollaborators")
      .withIndex("by_projectId_and_email", (q) => 
        q.eq("projectId", project._id).eq("email", userEmail)
      )
      .unique();

    if (collaborator) {
      return project;
    }

    return null;
  },
});

export const saveCanvas = mutation({
  args: {
    projectId: v.id("projects"),
    canvasJsonPath: v.string(),
    nodeCount: v.optional(v.number()),
    edgeCount: v.optional(v.number()),
    snapshot: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new ConvexError("Project not found");

    const userId = identity.tokenIdentifier;
    const userEmail = identity.email;

    // Verify project membership: must be owner or a collaborator
    const isOwner = project.ownerId === userId;
    let isCollaborator = false;

    if (userEmail) {
      const collaboration = await ctx.db
        .query("projectCollaborators")
        .withIndex("by_projectId_and_email", (q) => 
          q.eq("projectId", args.projectId).eq("email", userEmail)
        )
        .unique();
      if (collaboration) isCollaborator = true;
    }

    if (!isOwner && !isCollaborator) {
      throw new ConvexError("Unauthorized: You do not have permission to modify this project");
    }

    await ctx.db.patch(args.projectId, {
      canvasJsonPath: args.canvasJsonPath,
      nodeCount: args.nodeCount ?? project.nodeCount,
      edgeCount: args.edgeCount ?? project.edgeCount,
      canvasSnapshot: args.snapshot ?? project.canvasSnapshot,
      updatedAt: Date.now(),
    });

    return { success: true, canvasJsonPath: args.canvasJsonPath };
  },
});

export const getCanvasUrl = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    const userId = identity.tokenIdentifier;
    const userEmail = identity.email;

    const isOwner = project.ownerId === userId;
    let isCollaborator = false;

    if (userEmail) {
      const collaboration = await ctx.db
        .query("projectCollaborators")
        .withIndex("by_projectId_and_email", (q) => 
          q.eq("projectId", args.projectId).eq("email", userEmail)
        )
        .unique();
      if (collaboration) isCollaborator = true;
    }

    if (!isOwner && !isCollaborator) {
      return null;
    }

    return project.canvasJsonPath ?? null;
  },
});
