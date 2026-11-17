import { redirect } from 'next/navigation'
import { WorkspaceShell } from '@/components/editor/workspace-shell'
import { auth } from '@clerk/nextjs/server'
import { CanvasProvider } from '@/components/editor/canvas/canvas-provider'
import { Canvas } from '@/components/editor/canvas/canvas'
import { checkProjectAccess } from '@/lib/project-access'

export default async function EditorRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params

  // 1. Auth & Public Access Check
  const { userId } = await auth()
  if (!userId) {
    const project = await checkProjectAccess(roomId)
    // If project doesn't exist or is not public, require sign-in
    if (!project || !project.isReadOnly) {
      redirect('/sign-in')
    }
  }

  return (
    <CanvasProvider roomId={roomId}>
      <WorkspaceShell>
        <Canvas />
      </WorkspaceShell>
    </CanvasProvider>
  )
}
