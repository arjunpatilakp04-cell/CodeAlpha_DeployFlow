import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { api } from '../api/client';

export function Projects() {
  const { projects, refresh } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', repoOwner: '', repoName: '', defaultBranch: 'main' });
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    setSubmitting(true);
    try {
      await api.post('/api/projects', form);
      await refresh();
      setShowCreate(false);
      setForm({ name: '', description: '', repoOwner: '', repoName: '', defaultBranch: 'main' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{projects.length} project{projects.length === 1 ? '' : 's'}</p>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          New project
        </button>
      </div>

      {showCreate && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-4">
          <input placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="col-span-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input placeholder="Repo owner (GitHub username/org)" value={form.repoOwner} onChange={(e) => setForm({ ...form, repoOwner: e.target.value })} className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input placeholder="Repo name" value={form.repoName} onChange={(e) => setForm({ ...form, repoName: e.target.value })} className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm" />
          <div className="col-span-2 flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="rounded-md border border-border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={handleCreate} disabled={submitting || !form.name} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">
              {submitting ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {projects.map((p) => (
          <Link
            key={p.id}
            to={`/app/projects/${p.id}`}
            className="rounded-lg border border-border bg-surface p-4 hover:bg-surface-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{p.name}</h3>
              <span className="font-mono text-xs text-muted">{p.defaultBranch}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{p.description || 'No description'}</p>
            <p className="mt-2 font-mono text-xs text-muted">{p.repoOwner}/{p.repoName}</p>
            <div className="mt-3 flex gap-2">
              {p.environments.map((env) => (
                <span key={env.id} className="rounded border border-border px-2 py-0.5 text-xs text-muted">
                  {env.name}{env.currentVersion ? ` · ${env.currentVersion}` : ''}
                </span>
              ))}
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="col-span-2 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
            No projects yet. Create one to see the CI/CD pipeline in action.
          </div>
        )}
      </div>
    </div>
  );
}
