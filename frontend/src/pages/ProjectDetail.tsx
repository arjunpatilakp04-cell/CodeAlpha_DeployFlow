import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { PipelineVisualization } from '../components/PipelineVisualization';
import { StatusBadge } from '../components/StatusBadge';
import { STAGE_NAMES } from '../lib/stageNames';
import { usePipelineStream } from '../hooks/usePipelineStream';

interface Environment {
  id: string;
  name: string;
  type: string;
  currentVersion: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string;
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
  environments: Environment[];
}

interface Stage {
  id: string;
  name: string;
  order: number;
  status: string;
  durationMs: number | null;
  errorMessage: string | null;
  logs?: { id: string; level: string; message: string; timestamp: string }[];
}

interface PipelineRun {
  id: string;
  number: number;
  commitSha: string;
  commitMsg: string;
  branch: string;
  author: string;
  status: string;
  stages: Stage[];
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [activeRun, setActiveRun] = useState<PipelineRun | null>(null);
  const [envId, setEnvId] = useState<string>('');
  const [forceFailAt, setForceFailAt] = useState<string>('');
  const [triggering, setTriggering] = useState(false);
  const [live, setLive] = useState(false);

  const loadProject = useCallback(async () => {
    if (!id) return;
    const data = await api.get<Project>(`/api/projects/${id}`);
    setProject(data);
    if (!envId && data.environments[0]) setEnvId(data.environments[0].id);
  }, [id, envId]);

  const loadRuns = useCallback(async () => {
    if (!id) return;
    const data = await api.get<PipelineRun[]>(`/api/pipelines/project/${id}/runs`);
    setRuns(data);
    if (data[0]) {
      const full = await api.get<PipelineRun>(`/api/pipelines/runs/${data[0].id}`);
      setActiveRun(full);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
    loadRuns();
  }, [loadProject, loadRuns]);

  // Live updates via Server-Sent Events while the active run is in progress —
  // the backend pushes a fresh snapshot on every stage transition, so the
  // pipeline visualization updates without the page polling or refreshing.
  const isRunInProgress = activeRun?.status === 'RUNNING' || activeRun?.status === 'WAITING';
  usePipelineStream<PipelineRun>(
    activeRun?.id,
    isRunInProgress,
    (run) => {
      setActiveRun(run);
      setLive(true);
    },
    () => {
      setLive(false);
      loadRuns();
    }
  );
  useEffect(() => {
    if (!isRunInProgress) setLive(false);
  }, [isRunInProgress]);

  async function runPipeline() {
    if (!id || !envId) return;
    setTriggering(true);
    try {
      const run = await api.post<PipelineRun>(`/api/pipelines/project/${id}/run`, {
        environmentId: envId,
        ...(forceFailAt ? { forceFailAt } : {}),
      });
      setActiveRun(run);
      await loadRuns();
    } finally {
      setTriggering(false);
    }
  }

  async function retryRun(runId: string) {
    await api.post(`/api/pipelines/runs/${runId}/retry`);
    await loadRuns();
  }

  if (!project) return <div className="text-sm text-muted">Loading project...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{project.name}</h2>
        <p className="text-sm text-muted">{project.description}</p>
        <p className="mt-1 font-mono text-xs text-muted">
          {project.repoOwner}/{project.repoName} · branch: {project.defaultBranch}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Deploy to environment</label>
          <select
            value={envId}
            onChange={(e) => setEnvId(e.target.value)}
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            {project.environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name} {env.currentVersion ? `(${env.currentVersion})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Simulate failure at (optional)</label>
          <select
            value={forceFailAt}
            onChange={(e) => setForceFailAt(e.target.value)}
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            <option value="">Don't fail — run cleanly</option>
            {STAGE_NAMES.map((n) => (
              <option key={n} value={n}>
                Fail at: {n}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={runPipeline}
          disabled={triggering}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
        >
          {triggering ? 'Starting...' : 'Run Pipeline'}
        </button>
      </div>

      {activeRun && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Pipeline #{activeRun.number}</span>
                <StatusBadge status={activeRun.status} />
                {live && (
                  <span className="flex items-center gap-1 text-xs text-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <p className="mt-1 font-mono text-xs text-muted">
                {activeRun.commitSha.slice(0, 7)} · {activeRun.branch} · {activeRun.author}
              </p>
            </div>
            {activeRun.status === 'FAILED' && (
              <button
                onClick={() => retryRun(activeRun.id)}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-2"
              >
                Retry pipeline
              </button>
            )}
          </div>
          <PipelineVisualization stages={activeRun.stages} />
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-medium">Recent runs</h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Commit</th>
                <th className="px-4 py-2">Branch</th>
                <th className="px-4 py-2">Author</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr
                  key={r.id}
                  onClick={async () => setActiveRun(await api.get<PipelineRun>(`/api/pipelines/runs/${r.id}`))}
                  className="cursor-pointer border-t border-border hover:bg-surface"
                >
                  <td className="px-4 py-2 font-mono text-xs">#{r.number}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.commitSha.slice(0, 7)}</td>
                  <td className="px-4 py-2 text-xs text-muted">{r.branch}</td>
                  <td className="px-4 py-2 text-xs text-muted">{r.author}</td>
                  <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
