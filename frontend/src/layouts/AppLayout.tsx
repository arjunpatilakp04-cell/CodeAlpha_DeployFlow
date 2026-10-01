import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProjectProvider } from '../context/ProjectContext';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

const TITLES: Record<string, string> = {
  '/app': 'Overview',
  '/app/projects': 'Projects',
  '/app/builds': 'Builds',
  '/app/deployments': 'Deployments',
  '/app/environments': 'Environments',
  '/app/registry': 'Container Registry',
  '/app/monitoring': 'Monitoring',
  '/app/logs': 'Logs',
  '/app/variables': 'Secrets & Variables',
  '/app/activity': 'Activity',
  '/app/architecture': 'Architecture',
  '/app/docs': 'Documentation',
  '/app/settings': 'Settings',
};

export function AppLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-muted">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const title =
    Object.entries(TITLES).find(([path]) => location.pathname.startsWith(path) && path !== '/app')?.[1] ||
    TITLES[location.pathname] ||
    'DeployFlow';

  return (
    <ProjectProvider>
      <div className="flex h-screen overflow-hidden bg-bg">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar title={title} />
          <main className="flex-1 overflow-y-auto px-6 py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ProjectProvider>
  );
}
