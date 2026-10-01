import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useProjects } from '../context/ProjectContext';
import { StatusBadge } from '../components/StatusBadge';

interface EnvironmentRow {
  id: string;
  name: string;
  type: string;
  branch: string;
  url: string | null;
  autoDeploy: boolean;
  currentVersion: string | null;
  deployments: { status: string; version: string; createdAt: string }[];
  healthChecks: { healthy: boolean; responseTimeMs: number; checkedAt: string }[];
}

export function Environments() {
  const { selectedProject } = useProjects();
  const [environments, setEnvironments] = useState<EnvironmentRow[]>([]);

  async function load() {
    if (!selectedProject) return;
    const data = await api.get<EnvironmentRow[]>(`/api/environments/project/${selectedProject.id}`);
    setEnvironments(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  async function toggleAutoDeploy(env: EnvironmentRow) {
    await api.patch(`/api/environments/${env.id}`, { autoDeploy: !env.autoDeploy });
    await load();
  }

  if (!selectedProject) return <div className="text-sm text-muted">Select a project to see its environments.</div>;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {environments.map((env) => {
        const latestDeploy = env.deployments[0];
        const latestHealth = env.healthChecks[0];
        return (
          <div key={env.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{env.name}</h3>
              {latestHealth && (
                <span className={`h-2 w-2 rounded-full ${latestHealth.healthy ? 'bg-success' : 'bg-danger'}`} />
              )}
            </div>
            <p className="mt-1 font-mono text-xs text-muted">branch: {env.branch}</p>
            <p className="mt-2 font-mono text-sm">{env.currentVersion || 'No deployment yet'}</p>

            {latestDeploy && (
              <div className="mt-2">
                <StatusBadge status={latestDeploy.status} />
              </div>
            )}

            {latestHealth && (
              <p className="mt-2 text-xs text-muted">Response time: {latestHealth.responseTimeMs}ms</p>
            )}

            <label className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
              Auto-deploy on push
              <button
                onClick={() => toggleAutoDeploy(env)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  env.autoDeploy ? 'bg-accent' : 'bg-surface-2'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    env.autoDeploy ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          </div>
        );
      })}
      {environments.length === 0 && (
        <div className="col-span-3 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          No environments found for this project.
        </div>
      )}
    </div>
  );
}
