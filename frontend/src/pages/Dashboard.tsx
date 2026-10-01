import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useProjects } from '../context/ProjectContext';

interface Overview {
  totalProjects: number;
  successfulBuilds: number;
  failedBuilds: number;
  activeDeployments: number;
  deploymentSuccessRate: number;
  avgBuildTimeMs: number;
  avgDeployTimeMs: number;
  uptime: number;
  incidents: number;
}

function formatMs(ms: number) {
  if (!ms) return '—';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function Dashboard() {
  const { projects } = useProjects();
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    api.get<Overview>('/api/monitoring/overview').then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="Projects" value={String(data?.totalProjects ?? '—')} />
        <Card
          label="Builds"
          value={`${data?.successfulBuilds ?? 0} passed`}
          sub={data ? `${data.failedBuilds} failed` : undefined}
        />
        <Card label="Live deployments" value={String(data?.activeDeployments ?? '—')} />
        <Card
          label="Deploy success rate"
          value={data ? `${data.deploymentSuccessRate}%` : '—'}
        />
        <Card label="Avg build time" value={formatMs(data?.avgBuildTimeMs ?? 0)} />
        <Card label="Avg deploy time" value={formatMs(data?.avgDeployTimeMs ?? 0)} />
        <Card label="Uptime" value={data ? `${data.uptime.toFixed(1)}%` : '—'} />
        <Card label="Incidents" value={String(data?.incidents ?? '—')} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">Projects</h2>
          <Link to="/app/projects" className="text-xs text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {projects.slice(0, 4).map((p) => (
            <Link
              key={p.id}
              to={`/app/projects/${p.id}`}
              className="rounded-lg border border-border bg-surface p-4 hover:bg-surface-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{p.name}</h3>
                <span className="font-mono text-xs text-muted">{p.defaultBranch}</span>
              </div>
              <p className="mt-1 truncate text-xs text-muted">{p.description || 'No description'}</p>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="col-span-2 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
              No projects yet.{' '}
              <Link to="/app/projects" className="text-accent hover:underline">
                Create your first one
              </Link>
              .
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
