'use client'

import { useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EditorButton } from './editor-button'
import { Input } from '@/components/ui/input'
import { useProjectActions } from '../../hooks/use-project-actions'
import { FolderPlus, Pencil, Trash2 } from 'lucide-react'

// Let's redefine it to take the hook state as props
interface ProjectDialogsProps {
  state: ReturnType<typeof useProjectActions>
}

export function ProjectDialogsComponent({ state }: ProjectDialogsProps) {
  const {
    activeDialog,
    isLoading,
    projectName,
    setProjectName,
    selectedProject,
    closeDialog,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
    slugify,
  } = state

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeDialog === 'rename' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeDialog])

  if (activeDialog === 'create') {
    return (
      <Dialog open={true} onOpenChange={closeDialog}>
        <DialogContent showCloseButton className="sm:max-w-[460px]">
          <DialogHeader className="flex-row items-center gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#15303d_0%,#0c1f28_100%)] text-[#8ee0ea] ring-1 ring-white/10">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Start a New Blueprint</DialogTitle>
              <DialogDescription className="text-xs text-text-muted">
                Give your architecture a name you&apos;ll still recognize at 2 AM.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Project Name
              </label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Realtime Chat Engine"
                autoFocus
                className="h-10 rounded-xl bg-bg-base/85 border-white/[0.09] text-text-primary placeholder:text-text-faint focus-visible:border-accent-primary/65"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Room ID Preview
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-text-secondary font-mono text-xs truncate">
                <span className="text-text-muted shrink-0">ghost.ai/</span>
                <span className="truncate">{slugify(projectName) || 'your-project'}-XXXXX</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <EditorButton tone="socket" size="md" onClick={closeDialog}>
              Cancel
            </EditorButton>
            <EditorButton
              tone="primary"
              size="md"
              onClick={() => handleCreateProject(projectName)}
              disabled={!projectName || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </EditorButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (activeDialog === 'rename') {
    return (
      <Dialog open={true} onOpenChange={closeDialog}>
        <DialogContent showCloseButton className="sm:max-w-[460px]">
          <DialogHeader className="flex-row items-center gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#15303d_0%,#0c1f28_100%)] text-[#8ee0ea] ring-1 ring-white/10">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Give It a Fresh Name</DialogTitle>
              <DialogDescription className="text-xs text-text-muted">
                Renaming <strong>{selectedProject?.name}</strong>.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                New Project Name
              </label>
              <Input
                ref={inputRef}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="What should we call it now?"
                className="h-10 rounded-xl bg-bg-base/85 border-white/[0.09] text-text-primary placeholder:text-text-faint focus-visible:border-accent-primary/65"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedProject?._id && projectName.trim()) {
                    e.preventDefault()
                    handleRenameProject(selectedProject._id, projectName)
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <EditorButton tone="socket" size="md" onClick={closeDialog}>
              Cancel
            </EditorButton>
            <EditorButton
              tone="primary"
              size="md"
              onClick={() => {
                if (selectedProject?._id && projectName.trim()) {
                  handleRenameProject(selectedProject._id, projectName)
                }
              }}
              disabled={!selectedProject?._id || !projectName.trim() || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </EditorButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (activeDialog === 'delete') {
    return (
      <Dialog open={true} onOpenChange={closeDialog}>
        <DialogContent showCloseButton className="sm:max-w-[460px]">
          <DialogHeader className="flex-row items-center gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-state-error/10 text-state-error ring-1 ring-state-error/25">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Send to the Void?</DialogTitle>
              <DialogDescription className="text-xs text-text-muted mt-0.5">
                Deleting <strong>{selectedProject?.name}</strong> wipes its canvas and specs for
                good. No Ctrl+Z on this one.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter>
            <EditorButton tone="socket" size="md" onClick={closeDialog}>
              Cancel
            </EditorButton>
            <EditorButton
              tone="destructive"
              size="md"
              onClick={() => {
                if (selectedProject?._id && selectedProject?.roomId) {
                  handleDeleteProject(selectedProject._id, selectedProject.roomId)
                }
              }}
              disabled={isLoading || !selectedProject?._id}
            >
              {isLoading ? 'Deleting...' : 'Delete Project'}
            </EditorButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return null
}
