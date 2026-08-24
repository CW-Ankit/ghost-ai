"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProjectSidebar } from "./project-sidebar";
import { Plus, Share2, MessageSquare, PanelLeftClose, PanelLeftOpen, ChevronLeft, LayoutTemplate, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProjectActions } from "../../hooks/use-project-actions";
import { ShareDialog } from "./share-dialog";
import { ProjectDialogsComponent } from "./project-dialogs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMutation as useLiveblocksMutation, useStorage } from "@liveblocks/react";
import { LiveObject, LiveMap } from "@liveblocks/client";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";
import { StarterTemplatesModal } from "./starter-templates-modal";
import { CanvasTemplate } from "./starter-templates";
import { AISidebar } from "./ai-sidebar";

interface WorkspaceShellProps {
  children: React.ReactNode;
}

export function WorkspaceShell({ 
  children 
}: WorkspaceShellProps) {
  const params = useParams();
  const roomIdParam = params?.roomId;
  const roomId = (Array.isArray(roomIdParam) ? roomIdParam[0] : roomIdParam) as string | undefined;
  const project = useQuery(api.projects.getByRoomId, { roomId: roomId ?? "" });

  const setPresence = useMutation(api.presence.setPresence);
  const clearPresence = useMutation(api.presence.clearPresence);

  useEffect(() => {
    const projectId = project?._id;
    if (projectId) {
      setPresence({ projectId });
    }
    return () => {
      if (projectId) {
        clearPresence({ projectId });
      }
    };
  }, [project?._id, setPresence, clearPresence]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const actions = useProjectActions();

  const { fitView } = useReactFlow();

  const nodeCount = useStorage((root: any) => {
    const flow = root?.flow;
    if (!flow || !flow.nodes) return 0;
    return flow.nodes.size !== undefined ? flow.nodes.size : Object.keys(flow.nodes).length;
  }) ?? 0;

  const loadTemplate = useLiveblocksMutation(({ storage }, template: CanvasTemplate) => {
    const flow = storage.get("flow") as any;
    if (!flow) {
      const nodesMap = new LiveMap();
      const edgesMap = new LiveMap();
      template.nodes.forEach((n) => {
        nodesMap.set(
          n.id,
          new LiveObject<any>({
            id: n.id,
            type: n.type || "canvasNode",
            position: n.position,
            data: new LiveObject(n.data as any),
            ...(n.style ? { style: n.style } : {}),
          })
        );
      });
      template.edges.forEach((e) => {
        edgesMap.set(
          e.id,
          new LiveObject<any>({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            type: e.type || "canvasEdge",
            markerEnd: e.markerEnd,
            data: new LiveObject((e.data || {}) as any),
          })
        );
      });
      storage.set("flow", new LiveObject({ nodes: nodesMap, edges: edgesMap }));
      return;
    }

    const nodesMap = flow.get("nodes");
    const edgesMap = flow.get("edges");

    if (nodesMap) {
      const existingNodeKeys = Array.from(nodesMap.keys());
      for (const key of existingNodeKeys) {
        nodesMap.delete(key);
      }
      for (const node of template.nodes) {
        nodesMap.set(
          node.id,
          new LiveObject<any>({
            id: node.id,
            type: node.type || "canvasNode",
            position: node.position,
            data: new LiveObject(node.data as any),
            ...(node.style ? { style: node.style } : {}),
          })
        );
      }
    }

    if (edgesMap) {
      const existingEdgeKeys = Array.from(edgesMap.keys());
      for (const key of existingEdgeKeys) {
        edgesMap.delete(key);
      }
      for (const edge of template.edges) {
        edgesMap.set(
          edge.id,
          new LiveObject<any>({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            type: edge.type || "canvasEdge",
            markerEnd: edge.markerEnd,
            data: new LiveObject((edge.data || {}) as any),
          })
        );
      }
    }
  }, []);

  const handleSelectTemplate = useCallback((template: CanvasTemplate) => {
    try {
      loadTemplate(template);
      toast.success(`Loaded "${template.name}" template`);
      setTimeout(() => {
        fitView({ duration: 400, padding: 0.2 });
      }, 100);
    } catch (err) {
      console.error("Failed to load template", err);
      toast.error("Failed to load template");
    }
  }, [loadTemplate, fitView]);

  if (!roomId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-base text-text-muted">
        <p className="text-sm">Invalid workspace ID</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-base overflow-hidden">
      {/* Left Sidebar */}
      <ProjectSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        actions={actions}
        activeProjectId={project?._id}
      />

      <div className="flex flex-col flex-1 relative">
        {/* Top Navbar */}
        <header className="h-14 bg-bg-surface border-b border-border-default flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-text-secondary hover:text-text-primary"
            >
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </Button>

            <Link
              href="/editor"
              className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary px-2.5 py-1.5 rounded-lg hover:bg-bg-subtle transition-all group"
              title="Back to Dashboard"
            >
              <ChevronLeft className="h-4 w-4 text-text-muted group-hover:text-accent-primary transition-colors" />
              <span>Projects</span>
            </Link>

            <span className="text-text-muted/40 text-xs select-none">/</span>

            <h1 className="text-sm font-medium text-text-primary truncate max-w-md">
              {project?.name || "Loading..."}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setTemplatesModalOpen(true)}
              className="gap-2 border-border-subtle bg-bg-subtle text-text-primary hover:bg-bg-elevated hover:text-accent-primary transition-colors"
            >
              <LayoutTemplate className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={!project}
              onClick={() => project && actions.openShareDialog(project)}
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
                aiSidebarOpen ? "bg-accent-ai-dim text-accent-ai-text border border-accent-ai/30" : "text-text-secondary"
              )}
            >
              <Bot className="h-4 w-4 text-accent-ai-text" />
              <span className="hidden sm:inline">AI Workspace</span>
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
          <AISidebar 
            isOpen={aiSidebarOpen} 
            onClose={() => setAiSidebarOpen(false)} 
          />
        </main>
      </div>

      <ShareDialog 
        projectId={actions.selectedProject?._id ?? ""}
        ownerId={project?.ownerId ?? ""}
        open={actions.activeDialog === 'share'}
        onOpenChange={(open) => !open && actions.closeDialog()}
      />
      <ProjectDialogsComponent state={actions} />
      <StarterTemplatesModal
        open={templatesModalOpen}
        onOpenChange={setTemplatesModalOpen}
        onSelectTemplate={handleSelectTemplate}
        hasExistingNodes={nodeCount > 0}
      />
    </div>
  );
}
