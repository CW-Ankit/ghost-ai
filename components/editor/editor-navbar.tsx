"use client";

import React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({ sidebarOpen, onToggleSidebar }: EditorNavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-14 border-b border-border-subtle bg-bg-surface flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-text-secondary hover:text-text-primary hover:bg-bg-subtle"
        >
          {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </Button>
        <div className="ml-2 text-sm font-medium text-text-secondary">
          Ghost AI Editor
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Right section stays empty for now */}
      </div>
    </nav>
  );
}
