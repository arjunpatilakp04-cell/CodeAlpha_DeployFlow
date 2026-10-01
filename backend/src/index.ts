import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import pipelineRoutes from './routes/pipelines';
import buildRoutes from './routes/builds';
import deploymentRoutes from './routes/deployments';
import environmentRoutes from './routes/environments';
import variableRoutes from './routes/variables';
import logRoutes from './routes/logs';
import monitoringRoutes from './routes/monitoring';
import miscRoutes from './routes/misc';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

// This is DeployFlow's OWN health endpoint (used by Render / uptime checks
// for this app itself) — separate from the per-project health checks the
// platform simulates for demo projects.
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'deployflow-backend', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/builds', buildRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/variables', variableRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api', miscRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`DeployFlow backend listening on port ${PORT}`);
});
