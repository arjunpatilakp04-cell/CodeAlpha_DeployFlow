import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useProjects } from '../context/ProjectContext';

interface LogRow {
  id: string;
  level: string;
  message: string;
  service: string;
  timestamp: string;
  pipelineStage: { name: string; pipelineRun: { number: number } };
}

const LEVEL_COLOR: Record<string, string> = {
  INFO: 'text-muted',
  SUCCESS: 'text-success',
  WARNING: 'text-warning',
  ERROR: 'text-danger',
};

export function Logs() {
  const { selectedProject } = useProjects();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!selectedProject) return;
    const params = new URLSearchParams();
    if (level) params.set('level', level);
    if (search) params.set('search', search);
    api.get<LogRow[]>(`/api/logs/project/${selectedProject.id}?${params.toString()}`).then(setLogs);
  }, [selectedProject, level, search]);

  if (!selectedProject) return <div className="text-sm text-muted">Select a project to see its logs.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm"
        >
          <option value="">All levels</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        <input
          placeholder="Search messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="rounded-lg border border-border bg-bg p-4 font-mono text-xs leading-relaxed">
        {logs.map((l) => (
          <div key={l.id} className="flex gap-2">
            <span className="shrink-0 text-skip">{new Date(l.timestamp).toLocaleTimeString()}</span>
            <span className="shrink-0 text-muted">
              #{l.pipelineStage.pipelineRun.number}/{l.pipelineStage.name}
            </span>
            <span className={LEVEL_COLOR[l.level] || 'text-text'}>{l.message}</span>
          </div>
        ))}
        {logs.length === 0 && <p className="text-muted">No logs match the current filters.</p>}
      </div>
    </div>
  );
}
