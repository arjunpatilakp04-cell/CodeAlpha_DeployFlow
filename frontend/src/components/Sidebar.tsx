import { NavLink } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

const NAV = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/app/projects', label: 'Projects' },
  { to: '/app/builds', label: 'Builds' },
  { to: '/app/deployments', label: 'Deployments' },
  { to: '/app/environments', label: 'Environments' },
  { to: '/app/registry', label: 'Container Registry' },
  { to: '/app/monitoring', label: 'Monitoring' },
  { to: '/app/logs', label: 'Logs' },
  { to: '/app/variables', label: 'Secrets & Variables' },
  { to: '/app/activity', label: 'Activity' },
];

const NAV_SECONDARY = [
  { to: '/app/architecture', label: 'Architecture' },
  { to: '/app/docs', label: 'Documentation' },
  { to: '/app/settings', label: 'Settings' },
];

export function Sidebar() {
  const { selectedProject } = useProjects();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="h-5 w-5 rounded bg-accent" />
        <span className="text-sm font-semibold tracking-tight">DeployFlow</span>
      </div>

      {selectedProject && (
        <div className="border-b border-border px-4 py-3">
          <p className="text-[11px] text-muted">Active project</p>
          <p className="truncate text-sm font-medium">{selectedProject.name}</p>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block rounded-md px-3 py-1.5 text-sm ${
                isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface-2 hover:text-text'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-border px-2 py-3">
        {NAV_SECONDARY.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-md px-3 py-1.5 text-sm ${
                isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface-2 hover:text-text'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
