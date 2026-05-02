"use client";

import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";

// Let's redefine it to take the hook state as props
interface ProjectDialogsProps {
  state: ReturnType<typeof useProjectDialogs>;
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
  } = state;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeDialog === 'rename' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeDialog]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  if (activeDialog === 'create') {
    return (
      <Dialog open={true} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Enter a name for your new architecture project.
            </DialogDescription>
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
                Project Slug
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg-subtle border border-border-subtle text-text-secondary font-mono text-sm">
                <span className="text-text-muted">ghost.ai/</span>
                <span>{generateSlug(projectName) || 'your-project-slug'}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={() => handleCreateProject(projectName)} 
              disabled={!projectName || isLoading}
            >
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (activeDialog === 'rename') {
    return (
      <Dialog open={true} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Renaming <strong>{selectedProject?.name}</strong>.
            </DialogDescription>
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
                  if (e.key === 'Enter' && selectedProject?.id && projectName.trim()) {
                    e.preventDefault();
                    handleRenameProject(selectedProject.id, projectName);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={() => {
                if (selectedProject?.id && projectName.trim()) {
                  handleRenameProject(selectedProject.id, projectName);
                }
              }}
              disabled={!selectedProject?.id || !projectName.trim() || isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (activeDialog === 'delete') {
    return (
      <Dialog open={true} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedProject?.name}</strong>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4" />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedProject?.id) {
                  handleDeleteProject(selectedProject.id);
                }
              }}
              disabled={isLoading || !selectedProject?.id}
            >
              {isLoading ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
