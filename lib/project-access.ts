import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

export async function getCurrentUserIdentity() {
  const { userId, getToken } = await auth();
  if (!userId) return null;

  const token = await getToken();
  if (!token) return null;

  // We don't return the token here, but we can use it to call Convex
  return { userId, token };
}

export async function checkProjectAccess(roomId: string) {
  const identity = await getCurrentUserIdentity();
  if (!identity) return null;

  const convexHttpClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  convexHttpClient.setAuth(identity.token);

  try {
    const project = await (convexHttpClient.query as any)(api.projects.getByRoomId, {
      roomId,
    });
    return project;
  } catch (error) {
    console.error("Error checking project access:", error);
    return null;
  }
}
