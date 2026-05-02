'use client';

import { useState } from 'react';

export type ProjectDialogType = 'create' | 'rename' | 'delete' | null;

interface Project {
  id: string;
  name: string;
  slug: string;
  isOwner: boolean;
}

export function useProjectDialogs() {
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

  const handleCreateProject = async (_name: string) => {
    void _name;
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to create project', error);
    } finally {
      setIsLoading(false);
      closeDialog();
    }
  };

  const handleRenameProject = async (_id: string, _newName: string) => {
    void _id;
    void _newName;
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to rename project', error);
    } finally {
      setIsLoading(false);
      closeDialog();
    }
  };

  const handleDeleteProject = async (_id: string) => {
    void _id;
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to delete project', error);
    } finally {
      setIsLoading(false);
      closeDialog();
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
  };
}
