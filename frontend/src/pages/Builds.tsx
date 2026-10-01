import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useProjects } from '../context/ProjectContext';
import { StatusBadge } from '../components/StatusBadge';

interface Build {
  id: string;
  number: number;
  commitSha: string;
  branch: string;
  author: string;
  status: string;
  durationMs: number | null;
  imageTag: string | null;
  createdAt: string;
}

function formatMs(ms: number | null) {
  if (!ms) return '—';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function Builds() {
  const { selectedProject } = useProjects();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!selectedProject) return;
    const q = filter ? `?status=${filter}` : '';
    api.get<Build[]>(`/api/builds/project/${selectedProject.id}${q}`).then(setBuilds);
  }, [selectedProject, filter]);

  if (!selectedProject) return <div className="text-sm text-muted">Select a project to see its builds.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{builds.length} build{builds.length === 1 ? '' : 's'}</p>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Commit</th>
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">Author</th>
              <th className="px-4 py-2">Image tag</th>
              <th className="px-4 py-2">Duration</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {builds.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono text-xs">#{b.number}</td>
                <td className="px-4 py-2 font-mono text-xs">{b.commitSha.slice(0, 7)}</td>
                <td className="px-4 py-2 text-xs text-muted">{b.branch}</td>
                <td className="px-4 py-2 text-xs text-muted">{b.author}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted">{b.imageTag || '—'}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted">{formatMs(b.durationMs)}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
            {builds.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                  No builds yet. Run a pipeline from the project page to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
