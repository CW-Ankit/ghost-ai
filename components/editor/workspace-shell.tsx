"use client";

import React, { useState } from "react";
import { ProjectSidebar } from "./project-sidebar";
import { Plus, Share2, MessageSquare, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProjectActions } from "../../hooks/use-project-actions";
import { Doc } from "@/convex/_generated/dataModel";
import { ShareDialog } from "./share-dialog";

interface WorkspaceShellProps {
  project: Doc<"projects">;
  initialProjects: Doc<"projects">[];
  initialSharedProjects: Doc<"projects">[];
  children: React.ReactNode;
}

export function WorkspaceShell({ 
  project, 
  initialProjects, 
  initialSharedProjects, 
  children 
}: WorkspaceShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const actions = useProjectActions();

  return (
    <div className="flex h-screen w-full bg-base overflow-hidden">
      {/* Left Sidebar */}
      <ProjectSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        actions={actions}
        initialProjects={initialProjects}
        initialSharedProjects={initialSharedProjects}
        activeProjectId={project._id}
      />

      <div className="flex flex-col flex-1 relative">
        {/* Top Navbar */}
        <header className="h-14 bg-bg-surface border-b border-border-default flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-text-secondary hover:text-text-primary"
            >
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </Button>
            <h1 className="text-sm font-medium text-text-primary truncate max-w-md">
              {project.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShareDialogOpen(true)}
              className="text-text-secondary gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button 
              variant={aiSidebarOpen ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
              className={cn(
                "gap-2",
                aiSidebarOpen ? "bg-accent-ai-dim text-accent-ai-text" : "text-text-secondary"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">AI Assistant</span>
            </Button>
          </div>
        </header>

        {/* Main Workspace Area */}
        <main className="flex-1 flex overflow-hidden relative">
          {/* Canvas Area */}
          <div className="flex-1 relative bg-base">
            {children}
          </div>

          {/* Right AI Sidebar */}
          <aside 
            className={cn(
              "h-full bg-bg-surface border-l border-border-default transition-all duration-300 ease-in-out overflow-hidden",
              aiSidebarOpen ? "w-80" : "w-0"
            )}
          >
            <div className="w-80 h-full p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-primary">AI Assistant</h2>
                <Button variant="ghost" size="icon" onClick={() => setAiSidebarOpen(false)} className="h-6 w-6">
                  <Plus className="h-4 w-4 rotate-45" />
                </Button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Ask AI to generate or modify your architecture</p>
              </div>
            </div>
          </aside>
        </main>
      </div>

      <ShareDialog 
        projectId={project._id}
        ownerId={project.ownerId}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </div>
  );
}
