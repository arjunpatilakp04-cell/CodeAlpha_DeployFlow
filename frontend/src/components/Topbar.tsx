import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';

export function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const { projects, selectedProjectId, setSelectedProjectId } = useProjects();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
      <h1 className="text-sm font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        {projects.length > 0 && (
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-text"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-2 border-l border-border pl-3">
          <div className="text-right leading-tight">
            <p className="text-xs font-medium">{user?.name}</p>
            <p className="text-[11px] text-muted">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-text"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
