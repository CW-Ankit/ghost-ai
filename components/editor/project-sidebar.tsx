"use client";

import React from "react";
import { Plus, X, MoreVertical, Pencil, Trash2, Folder, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useProjectActions } from "../../hooks/use-project-actions";
import { Doc } from "@/convex/_generated/dataModel";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  actions: ReturnType<typeof useProjectActions>;
  initialProjects: Doc<"projects">[];
  initialSharedProjects: Doc<"projects">[];
  activeProjectId?: string;
}

export function ProjectSidebar({ isOpen, onClose, actions, initialProjects, initialSharedProjects, activeProjectId }: ProjectSidebarProps) {
  const [showingActions, setShowingActions] = React.useState<string | null>(null);

  const handleOpenActions = (id: string) => {
    setShowingActions(showingActions === id ? null : id);
  };

  const myProjects = initialProjects; 
  const sharedProjects = initialSharedProjects;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          role="button"
          tabIndex={0}
          aria-label="Close overlay"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.keyCode === 27 || e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClose();
            }
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-bg-surface border-r border-border-default z-50 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-primary">Projects</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close sidebar"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
            <Tabs defaultValue="my-projects" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 bg-bg-subtle">
                <TabsTrigger value="my-projects" className="gap-2">
                  <Folder className="h-3.5 w-3.5" />
                  My Projects
                </TabsTrigger>
                <TabsTrigger value="shared" className="gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Shared
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-projects" className="flex-1 mt-4">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="flex flex-col gap-1">
                    {myProjects.map((project: Doc<"projects">) => (
                      <div
                        key={project._id}
                        className={cn(
                          "group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                          activeProjectId === project._id ? "bg-bg-subtle text-text-primary" : "text-text-secondary hover:bg-bg-subtle"
                        )}
                        onClick={() => {
                          // In a real app, this would navigate to /editor/[roomId]
                        }}
                      >
                        <span className="text-sm font-medium truncate flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-text-muted" />
                          {project.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {showingActions === project._id ? (
                            <div className="flex items-center gap-1 bg-bg-surface border border-border-subtle rounded-md p-1 shadow-sm">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Rename project"
                                className="h-7 w-7 text-text-secondary hover:text-text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  actions.openRenameDialog(project);
                                  setShowingActions(null);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Delete project"
                                className="h-7 w-7 text-text-secondary hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  actions.openDeleteDialog(project);
                                  setShowingActions(null);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="More project actions"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenActions(project._id);
                              }}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {myProjects.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted">
                        <p className="text-sm">No projects yet.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="shared" className="flex-1 mt-4">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="flex flex-col gap-1">
                    {sharedProjects.map(project => (
                      <div 
                        key={project._id}
                        className={cn(
                          "group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                          activeProjectId === project._id ? "bg-bg-subtle text-text-primary" : "text-text-secondary hover:bg-bg-subtle"
                        )}
                        onClick={() => {
                          // In a real app, this would navigate to /editor/[roomId]
                        }}
                      >
                        <span className="text-sm font-medium truncate flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-text-muted" />
                          {project.name}
                        </span>
                      </div>
                    ))}
                    {sharedProjects.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted">
                        <p className="text-sm">No shared projects yet.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border-subtle">
            <Button
              onClick={actions.openCreateDialog}
              className="w-full gap-2 bg-accent-primary text-bg-base hover:bg-accent-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
