"use client";

import React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
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
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
            <Tabs defaultValue="my-projects" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 bg-bg-subtle">
                <TabsTrigger value="my-projects">My Projects</TabsTrigger>
                <TabsTrigger value="shared">Shared</TabsTrigger>
              </TabsList>
              
              <TabsContent value="my-projects" className="flex-1 mt-4">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 text-text-muted">
                    <p className="text-sm">No projects yet.</p>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="shared" className="flex-1 mt-4">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 text-text-muted">
                    <p className="text-sm">No shared projects yet.</p>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border-subtle">
            <Button className="w-full gap-2 bg-accent-primary text-bg-base hover:bg-accent-primary/90">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
