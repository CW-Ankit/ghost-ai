import { EditorLayout } from '@/components/editor/editor-layout'
import { getProjects } from '@/lib/projects-server'

export default async function EditorPage() {
  const { projects, sharedProjects } = await getProjects();

  return (
    <EditorLayout 
      initialProjects={projects} 
      initialSharedProjects={sharedProjects} 
    />
  );
}
