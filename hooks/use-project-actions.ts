'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

export type ProjectDialogType = 'create' | 'rename' | 'delete' | 'share' | null;

interface Project {
  _id: string;
  name: string;
  roomId: string;
}

export function useProjectActions() {
  const router = useRouter();
  const pathname = usePathname();
  
  const createProject = useMutation(api.projects.create);
  const renameProject = useMutation(api.projects.rename);
  const removeProject = useMutation(api.projects.remove);
  const togglePinProject = useMutation(api.projects.togglePin);
  const bulkUpdateStatus = useMutation(api.projects.bulkUpdateStatus);
  const bulkDelete = useMutation(api.projects.bulkDelete);
  const updateStatus = useMutation(api.projects.updateStatus);
  
  const [activeDialog, setActiveDialog] = useState<ProjectDialogType>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const openCreateDialog = () => {
    setProjectName('');
    setSelectedProject(null);
    setActiveDialog('create');
  };

  const openRenameDialog = (project: Project) => {
    setSelectedProject(project);
    setProjectName(project.name);
    setActiveDialog('rename');
  };

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project);
    setActiveDialog('delete');
  };

  const openShareDialog = (project: Project) => {
    setSelectedProject(project);
    setActiveDialog('share');
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setSelectedProject(null);
    setProjectName('');
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const generateShortId = () => {
    return Math.random().toString(36).substring(2, 7);
  };

  const handleCreateProject = async (name: string) => {
    try {
      setIsLoading(true);
      const slug = slugify(name);
      const suffix = generateShortId();
      const roomId = `${slug}-${suffix}`;

      await createProject({ 
        name, 
        roomId,
        description: '' 
      });
      
      closeDialog();
      router.push(`/editor/${roomId}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameProject = async (id: string, newName: string) => {
    try {
      setIsLoading(true);
      await renameProject({ 
        projectId: id as any, 
        name: newName 
      });
      closeDialog();
    } catch (error: any) {
      console.error('Error renaming project:', error);
      toast.error(error.message || "Failed to rename project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, roomId: string) => {
    try {
      setIsLoading(true);
      await removeProject({ 
        projectId: id as any 
      });
      
      const segments = pathname.split('/').filter(Boolean);
      if (segments.includes(roomId)) {
        router.push('/editor');
      } else {
        closeDialog();
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error(error.message || "Failed to delete project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await togglePinProject({ 
        projectId: id as any 
      });
    } catch (error: unknown) {
      console.error('Error toggling pin:', error);
      toast.error(String(error));
    }
  };

  const handleBulkUpdateStatus = async (projectIds: string[], status: any) => {
    if (projectIds.length === 0) return;
    setIsLoading(true);
    try {
      await bulkUpdateStatus({ 
        projectIds: projectIds as any, 
        status 
      });
      toast.success(`Successfully updated ${projectIds.length} projects`);
    } catch (error: unknown) {
      console.error('Error bulk updating status:', error);
      toast.error(String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async (projectIds: string[]) => {
    if (projectIds.length === 0) return;
    setIsLoading(true);
    try {
      await bulkDelete({ 
        projectIds: projectIds as any 
      });
      toast.success(`Successfully deleted ${projectIds.length} projects`);
    } catch (error: unknown) {
      console.error('Error bulk deleting:', error);
      toast.error(String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    try {
      setIsLoading(true);
      await updateStatus({
        projectId: id as any,
        status,
      });
      toast.success(`Project status updated to ${status}`);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activeDialog,
    isLoading,
    projectName,
    setProjectName,
    selectedProject,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    openShareDialog,
    closeDialog,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
    handleTogglePin,
    handleBulkUpdateStatus,
    handleBulkDelete,
    handleUpdateStatus,
    slugify,
    generateShortId,
  };
}
