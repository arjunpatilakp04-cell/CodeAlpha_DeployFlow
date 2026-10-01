import { Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Builds } from './pages/Builds';
import { Deployments } from './pages/Deployments';
import { Environments } from './pages/Environments';
import { Registry } from './pages/Registry';
import { Monitoring } from './pages/Monitoring';
import { Logs } from './pages/Logs';
import { Variables } from './pages/Variables';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';
import { Docs } from './pages/Docs';
import { Architecture } from './pages/Architecture';
import { AppLayout } from './layouts/AppLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="builds" element={<Builds />} />
        <Route path="deployments" element={<Deployments />} />
        <Route path="environments" element={<Environments />} />
        <Route path="registry" element={<Registry />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="logs" element={<Logs />} />
        <Route path="variables" element={<Variables />} />
        <Route path="activity" element={<Activity />} />
        <Route path="architecture" element={<Architecture />} />
        <Route path="docs" element={<Docs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
