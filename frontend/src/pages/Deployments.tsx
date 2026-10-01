import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useProjects } from '../context/ProjectContext';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

interface Deployment {
  id: string;
  version: string;
  commitSha: string;
  status: string;
  durationMs: number | null;
  rolledBackTo: string | null;
  createdAt: string;
  environment: { id: string; name: string; type: string };
}

function formatMs(ms: number | null) {
  if (!ms) return '—';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function Deployments() {
  const { selectedProject } = useProjects();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [rollbackTarget, setRollbackTarget] = useState<{ current: Deployment; target: Deployment } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!selectedProject) return;
    const data = await api.get<Deployment[]>(`/api/deployments/project/${selectedProject.id}`);
    setDeployments(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  async function handleRollback() {
    if (!rollbackTarget) return;
    setSubmitting(true);
    try {
      await api.post(`/api/deployments/${rollbackTarget.current.id}/rollback`, {
        targetDeploymentId: rollbackTarget.target.id,
      });
      setRollbackTarget(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  if (!selectedProject) return <div className="text-sm text-muted">Select a project to see its deployments.</div>;

  // A live deployment in each environment can be rolled back to any prior
  // successful (LIVE / ROLLED_BACK-source) deployment in that same environment.
  const liveByEnv = new Map(deployments.filter((d) => d.status === 'LIVE').map((d) => [d.environment.id, d]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{deployments.length} deployment{deployments.length === 1 ? '' : 's'}</p>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2">Version</th>
              <th className="px-4 py-2">Environment</th>
              <th className="px-4 py-2">Commit</th>
              <th className="px-4 py-2">Duration</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((d) => {
              const currentLive = liveByEnv.get(d.environment.id);
              const canRollbackTo = currentLive && d.status === 'SUPERSEDED';
              return (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs">
                    {d.version}
                    {d.rolledBackTo && <span className="ml-1 text-muted">(rolled back to {d.rolledBackTo})</span>}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted">{d.environment.name}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted">{d.commitSha.slice(0, 7)}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted">{formatMs(d.durationMs)}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {canRollbackTo && (
                      <button
                        onClick={() => setRollbackTarget({ current: currentLive!, target: d })}
                        className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2"
                      >
                        Roll back to this
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {deployments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                  No deployments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!rollbackTarget}
        title="Confirm rollback"
        onClose={() => setRollbackTarget(null)}
        onConfirm={handleRollback}
        confirmLabel={submitting ? 'Rolling back...' : 'Roll back'}
        danger
      >
        {rollbackTarget && (
          <p>
            This rolls back <strong className="text-text">{rollbackTarget.current.environment.name}</strong> from{' '}
            <span className="font-mono">{rollbackTarget.current.version}</span> to{' '}
            <span className="font-mono">{rollbackTarget.target.version}</span>. The current live version will be
            marked as rolled back.
          </p>
        )}
      </Modal>
    </div>
  );
}
