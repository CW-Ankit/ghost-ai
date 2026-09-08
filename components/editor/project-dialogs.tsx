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
import { Button } from '@/components/ui/button'
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
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3">
            <FolderPlus className="h-5 w-5 text-accent-primary" />
            <div>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>Enter a name for your new architecture project.</DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Project Name
              </label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. E-commerce Platform"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Room ID Preview
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg-subtle border border-border-subtle text-text-secondary font-mono text-sm">
                <span className="text-text-muted">ghost.ai/</span>
                <span>{slugify(projectName) || 'your-project'}-XXXXX</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => handleCreateProject(projectName)}
              disabled={!projectName || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (activeDialog === 'rename') {
    return (
      <Dialog open={true} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3">
            <Pencil className="h-5 w-5 text-accent-primary" />
            <div>
              <DialogTitle>Rename Project</DialogTitle>
              <DialogDescription>
                Renaming <strong>{selectedProject?.name}</strong>.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                New Project Name
              </label>
              <Input
                ref={inputRef}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter new name"
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
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedProject?._id && projectName.trim()) {
                  handleRenameProject(selectedProject._id, projectName)
                }
              }}
              disabled={!selectedProject?._id || !projectName.trim() || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (activeDialog === 'delete') {
    return (
      <Dialog open={true} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3">
            <Trash2 className="h-5 w-5 text-state-error" />
            <div>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedProject?.name}</strong>? This
                action cannot be undone.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="py-4" />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedProject?._id && selectedProject?.roomId) {
                  handleDeleteProject(selectedProject._id, selectedProject.roomId)
                }
              }}
              disabled={isLoading || !selectedProject?._id}
            >
              {isLoading ? 'Deleting...' : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return null
}
