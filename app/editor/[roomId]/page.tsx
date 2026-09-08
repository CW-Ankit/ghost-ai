import { redirect } from 'next/navigation'
import { WorkspaceShell } from '@/components/editor/workspace-shell'
import { auth } from '@clerk/nextjs/server'
import { CanvasProvider } from '@/components/editor/canvas/canvas-provider'
import { Canvas } from '@/components/editor/canvas/canvas'

export default async function EditorRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params

  // 1. Auth Check
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <CanvasProvider roomId={roomId}>
      <WorkspaceShell>
        <Canvas />
      </WorkspaceShell>
    </CanvasProvider>
  )
}
