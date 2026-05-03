'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type ProjectDialogType = 'create' | 'rename' | 'delete' | null;

interface Project {
  _id: string;
  name: string;
}

export function useProjectActions() {
  const router = useRouter();
  const pathname = usePathname();
  
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
    setIsLoading(true);
    try {
      const slug = slugify(name);
      const suffix = generateShortId();
      const roomId = `${slug}-${suffix}`;

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          roomId,
          description: '' 
        }),
      });

      if (!response.ok) throw new Error('Failed to create project');
      
      const { projectId } = await response.json();
      
      router.push(`/workspace/${projectId}`);
      closeDialog();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error creating project:', error);
        alert(error.message);
      } else {
        console.error('Error creating project:', error);
        alert(String(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameProject = async (id: string, newName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) throw new Error('Failed to rename project');
      
      router.refresh();
      closeDialog();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error renaming project:', error);
        alert(error.message);
      } else {
        console.error('Error renaming project:', error);
        alert(String(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete project');
      
      const segments = pathname.split('/').filter(Boolean);
      if (segments.includes(id)) {
        router.push('/editor');
      } else {
        router.refresh();
      }
      closeDialog();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error deleting project:', error);
        alert(error.message);
      } else {
        console.error('Error deleting project:', error);
        alert(String(error));
      }
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
    closeDialog,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
    slugify,
    generateShortId,
  };
}
