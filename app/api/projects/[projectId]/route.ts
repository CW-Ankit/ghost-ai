import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { NextResponse } from "next/server";

const convexHttpClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId } = await params;
    const token = await getToken({ template: "convex" });
    
    if (!token) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    
    await convexHttpClient.mutation(api.projects.rename, {
      projectId: projectId as Id<"projects">,
      name: body.name,
    }, { token });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Project not found") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const { projectId } = await params;
    const token = await getToken({ template: "convex" });
    
    if (!token) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    
    await convexHttpClient.mutation(api.projects.remove, {
      projectId: projectId as Id<"projects">,
    }, { token });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Project not found") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
