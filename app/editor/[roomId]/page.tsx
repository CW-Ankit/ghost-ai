import { redirect } from "next/navigation";
import { checkProjectAccess } from "@/lib/project-access";
import { getProjects } from "@/lib/projects-server";
import { WorkspaceShell } from "@/components/editor/workspace-shell";
import { AccessDenied } from "@/components/editor/access-denied";
import { auth } from "@clerk/nextjs/server";
import { Doc } from "@/convex/_generated/dataModel";

export default async function EditorRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  // 1. Auth Check
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // 2. Project Access Check
  const project = await checkProjectAccess(roomId);
  if (!project) {
    return <AccessDenied />;
  }

  // 3. Fetch projects for the sidebar
  const { projects, sharedProjects } = await getProjects();

  return (
    <WorkspaceShell 
      project={project as Doc<"projects">} 
      initialProjects={projects} 
      initialSharedProjects={sharedProjects}
    >
      {/* Canvas Placeholder */}
      <div className="h-full w-full flex items-center justify-center bg-base text-text-muted">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 bg-bg-surface border border-border-subtle rounded-2xl flex items-center justify-center mb-2">
            <span className="text-xl">🎨</span>
          </div>
          <p className="text-sm font-medium text-text-secondary">Canvas Workspace</p>
          <p className="text-xs opacity-60">Collaborative canvas loading...</p>
        </div>
      </div>
    </WorkspaceShell>
  );
}
