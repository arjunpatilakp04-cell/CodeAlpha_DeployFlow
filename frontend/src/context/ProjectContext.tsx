import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../api/client';

export interface Project {
  id: string;
  name: string;
  description: string;
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
  environments: { id: string; name: string; type: string; currentVersion: string | null }[];
}

interface ProjectContextValue {
  projects: Project[];
  selectedProjectId: string | null;
  selectedProject: Project | null;
  setSelectedProjectId: (id: string) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    localStorage.getItem('deployflow_project')
  );
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const data = await api.get<Project[]>('/api/projects');
      setProjects(data);
      // Keep the saved selection only if it still exists; otherwise fall back to the first project.
      setSelectedProjectId((current) =>
        data.some((p) => p.id === current) ? current : data[0]?.id ?? null
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProjectId) localStorage.setItem('deployflow_project', selectedProjectId);
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  return (
    <ProjectContext.Provider
      value={{ projects, selectedProjectId, selectedProject, setSelectedProjectId, refresh, loading }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used inside ProjectProvider');
  return ctx;
}
