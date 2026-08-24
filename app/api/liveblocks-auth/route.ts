import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getLiveblocksClient, getCursorColor } from "@/lib/liveblocks";
import { checkProjectAccess } from "@/lib/project-access";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const roomId = body.room || body.roomId || url.searchParams.get("room") || url.searchParams.get("roomId");

    if (!roomId) {
      return new NextResponse("Room ID is required", { status: 400 });
    }

    // 1. Verify Clerk authentication & project access
    const project = await checkProjectAccess(roomId);
    if (!project) {
      return new NextResponse("Unauthorized access to project", { status: 403 });
    }

    // 2. Get current user details for metadata
    const user = await currentUser();
    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const client = getLiveblocksClient();

    // 3. Prepare session with user metadata and permissions
    const session = client.prepareSession(user.id, {
      userInfo: {
        displayName: user.fullName || user.username || "Unknown User",
        avatar: user.imageUrl,
        cursorColor: getCursorColor(user.id),
      },
    });

    // Grant write access to the specific room
    session.allow(roomId, session.FULL_ACCESS);

    // 4. Authorize the session to get the access token
    const { status, body: authBody } = await session.authorize();

    return new Response(authBody, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
