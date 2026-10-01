import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';

export function Settings() {
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [renderApiKey, setRenderApiKey] = useState('');
  const [renderServiceId, setRenderServiceId] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // Demo mode: there is no live Render API call wired up (see README
    // "Live Integration vs Demo Mode"). This just confirms the form works
    // and shows where a real integration would plug in.
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium">Account</h3>
        <p className="mt-1 text-sm text-muted">{user?.name} · {user?.email}</p>
        <p className="mt-1 text-xs text-muted">Role: {user?.role}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium">Render integration</h3>
        <p className="mt-1 text-xs text-muted">
          Demo mode: these fields are stored only for this session and are not used to make real API calls.
          Wiring this up for real means calling Render's Deploy API from{' '}
          <code className="rounded bg-surface-2 px-1 py-0.5">services/pipelineEngine.ts</code> at the "Deploy to
          Render" stage instead of simulating it.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Render API key</label>
            <input
              type="password"
              value={renderApiKey}
              onChange={(e) => setRenderApiKey(e.target.value)}
              placeholder="rnd_xxxxxxxxxxxxxxxx"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Render service ID</label>
            <input
              value={renderServiceId}
              onChange={(e) => setRenderServiceId(e.target.value)}
              placeholder="srv-xxxxxxxxxxxxxxxx"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm"
            />
          </div>
          <button
            onClick={handleSave}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
          >
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {selectedProject && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-medium">Project</h3>
          <p className="mt-1 text-sm text-muted">{selectedProject.name}</p>
          <p className="mt-1 font-mono text-xs text-muted">
            {selectedProject.repoOwner}/{selectedProject.repoName}
          </p>
        </div>
      )}
    </div>
  );
}
