import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useProjects } from '../context/ProjectContext';

interface RegistryImage {
  id: string;
  repository: string;
  tag: string;
  digest: string;
  sizeMb: number;
  createdAt: string;
}

export function Registry() {
  const { selectedProject } = useProjects();
  const [images, setImages] = useState<RegistryImage[]>([]);

  useEffect(() => {
    if (!selectedProject) return;
    api.get<RegistryImage[]>(`/api/registry/project/${selectedProject.id}`).then(setImages);
  }, [selectedProject]);

  if (!selectedProject) return <div className="text-sm text-muted">Select a project to see its registry images.</div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{images.length} image{images.length === 1 ? '' : 's'}</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {images.map((img) => (
          <div key={img.id} className="rounded-lg border border-border bg-surface p-4">
            <p className="font-mono text-sm">
              {img.repository}:{img.tag}
            </p>
            <p className="mt-2 truncate font-mono text-xs text-muted" title={img.digest}>
              {img.digest}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>{img.sizeMb} MB</span>
              <span>{new Date(img.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-2 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
            No images pushed yet. A successful pipeline run pushes one automatically.
          </div>
        )}
      </div>
    </div>
  );
}
