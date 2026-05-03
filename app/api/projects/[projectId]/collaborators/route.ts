import { auth, clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { NextResponse } from "next/server";

const convexHttpClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
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

    const collaborators = await (convexHttpClient.query as any)(api.projects.getCollaborators, {
      projectId: projectId as Id<"projects">,
    }, { token });

    const enrichedCollaborators = await Promise.all(
      collaborators.map(async (collab: { email: string }) => {
        const client = await clerkClient();
        const users = await client.users.getUserList({
          emailAddress: [collab.email],
        });
        const user = users.data[0];

        return {
          email: collab.email,
          name: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : null,
          avatarUrl: user?.imageUrl || null,
        };
      })
    );

    return NextResponse.json(enrichedCollaborators);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email } = body;
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { projectId } = await params;
    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    await (convexHttpClient.mutation as any)(api.projects.addCollaborator, {
      projectId: projectId as Id<"projects">,
      email,
    }, { token });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
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
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { projectId } = await params;
    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    await (convexHttpClient.mutation as any)(api.projects.removeCollaborator, {
      projectId: projectId as Id<"projects">,
      email,
    }, { token });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
