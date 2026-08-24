"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserPlus, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Collaborator {
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface ShareDialogProps {
  projectId: string;
  ownerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ projectId, ownerId, open, onOpenChange }: ShareDialogProps) {
  const { userId } = useAuth();
  const isOwner = userId === ownerId;
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchCollaborators = React.useCallback(async () => {
    if (!projectId) return;
    setIsFetching(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      if (!res.ok) throw new Error("Failed to fetch collaborators");
      const data = await res.json();
      setCollaborators(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch collaborators";
      toast.error(message);
    } finally {
      setIsFetching(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      fetchCollaborators();
    }
  }, [open, fetchCollaborators]);

  async function handleInvite() {
    if (!email) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to invite collaborator");
      }
      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      await fetchCollaborators();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to invite collaborator";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemove(email: string) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove collaborator");
      }
      toast.success(`Removed ${email}`);
      await fetchCollaborators();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to remove collaborator";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/editor/${window.location.pathname.split("/").pop()}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Project link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-bg-surface border-border-default text-text-primary overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Share Project</DialogTitle>
          <DialogDescription className="text-text-muted">
            Invite collaborators to work on this architecture with you in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invite Section */}
          {isOwner && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  placeholder="Enter email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-bg-base border-border-subtle text-text-primary placeholder:text-text-faint rounded-xl"
                />
              </div>
              <Button 
                onClick={handleInvite} 
                disabled={isLoading || !email}
                className="bg-accent-primary text-bg-base hover:bg-accent-primary/90 rounded-xl gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <UserPlus className="h-4 w-4" />
                <span>Invite</span>
              </Button>
            </div>
          )}

          {/* Collaborators List */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-text-faint uppercase tracking-wider">Collaborators</h3>
            {isFetching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border-subtle rounded-2xl">
                <p className="text-sm text-text-muted">No collaborators yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {collaborators.map((collab) => (
                  <div 
                    key={collab.email} 
                    className="flex items-center justify-between p-2 rounded-xl bg-bg-elevated border border-transparent hover:border-border-subtle transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-border-subtle">
                        <AvatarImage src={collab.avatarUrl || ""} />
                        <AvatarFallback className="bg-bg-subtle text-text-secondary text-xs">
                          {collab.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text-primary">
                          {collab.name || collab.email}
                        </span>
                        <span className="text-xs text-text-muted">{collab.email}</span>
                      </div>
                    </div>
                    {isOwner && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemove(collab.email)}
                        className="h-8 w-8 text-text-muted hover:text-state-error hover:bg-state-error/10 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Copy Link Section */}
          <div className="pt-4 border-t border-border-subtle">
            <Button 
              variant="outline" 
              onClick={handleCopyLink}
              className="w-full justify-between bg-bg-base border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded-xl gap-2"
            >
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                <span>Copy project link</span>
              </div>
              {copied ? <Check className="h-4 w-4 text-state-success" /> : null}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-text-muted hover:text-text-primary rounded-xl"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
