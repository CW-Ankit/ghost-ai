import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, roomId, nodes, edges } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const canvasPayload = {
      projectId,
      roomId: roomId || "",
      nodes: nodes || [],
      edges: edges || [],
      version: 1,
      savedAt: new Date().toISOString(),
    };

    const jsonContent = JSON.stringify(canvasPayload, null, 2);
    const filename = `canvas/${projectId}.json`;

    // Check if Vercel Blob token is available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(filename, jsonContent, {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
      });

      return NextResponse.json({
        success: true,
        blobUrl: blob.url,
      });
    } else {
      // Local fallback when BLOB_READ_WRITE_TOKEN is not yet configured
      const fallbackUrl = `https://blob.vercel-storage.com/${filename}`;
      return NextResponse.json({
        success: true,
        blobUrl: fallbackUrl,
        fallback: true,
      });
    }
  } catch (error: any) {
    console.error("Failed to save canvas to blob:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save canvas" },
      { status: 500 }
    );
  }
}
