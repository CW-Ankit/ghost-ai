import { NextResponse } from 'next/server'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getAuthenticatedConvex, handleApiError } from '@/lib/api-auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskRunId: string }> }
) {
  const authResult = await getAuthenticatedConvex()
  if (!authResult.ok) return authResult.response

  try {
    const { taskRunId } = await params
    const taskRun = await authResult.ctx.convex.query(api.taskRuns.getTaskRun, {
      taskRunId: taskRunId as Id<'taskRuns'>,
    })

    if (!taskRun) {
      return NextResponse.json({ error: 'Task run not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json(taskRun)
  } catch (error) {
    return handleApiError(error, 'Failed to fetch task run')
  }
}
