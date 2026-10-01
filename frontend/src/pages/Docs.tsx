const MAPPING = [
  { azure: 'Azure DevOps Pipelines', render: 'DeployFlow pipeline engine + GitHub Actions', note: 'Stage-based YAML replaced by the 9-stage engine in services/pipelineEngine.ts' },
  { azure: 'Azure Container Registry (ACR)', render: 'GitHub Container Registry (ghcr.io)', note: 'Free, no separate registry account needed' },
  { azure: 'Azure App Service', render: 'Render Web Service', note: 'render.yaml blueprint defines the service' },
  { azure: 'Azure Database for PostgreSQL', render: 'PostgreSQL (Render Postgres or Neon)', note: 'The application database — provisioned automatically by render.yaml' },
  { azure: 'Azure Key Vault', render: 'Render environment variables (masked)', note: 'Secrets masked in the Variables page, revealed on demand' },
  { azure: 'Azure Monitor / App Insights', render: 'DeployFlow Monitoring page', note: 'Response time, error rate, CPU/memory charts' },
  { azure: 'Azure Active Directory', render: 'JWT + bcrypt auth (this app)', note: 'Self-contained; no external identity provider required' },
  { azure: 'Azure Front Door / CDN', render: 'Render\'s built-in CDN + TLS', note: 'Handled automatically per Render service' },
];

const SECTIONS = [
  {
    title: 'What this project is',
    body: "DeployFlow is a CI/CD and deployment platform built for the CodeAlpha DevOps Internship Task 1 brief: automate build, test and deployment for an application, and demonstrate the pipeline end to end. It was designed to mirror what a team migrating off Azure DevOps to a free-tier-friendly stack (GitHub + Render) would actually use day to day.",
  },
  {
    title: 'Live integration vs. demo mode',
    body: "There is no real GitHub webhook, Docker daemon, or Render API call behind a pipeline run in this build. What IS real: every stage transition happens asynchronously over actual wall-clock time, is persisted to PostgreSQL as it happens, and is pushed to the browser live over Server-Sent Events — no polling. Wiring in real Docker builds means replacing the timed stage execution in services/pipelineEngine.ts with actual `docker build` / `docker push` / Render Deploy API calls; the data model, API and frontend need no changes to support that.",
  },
  {
    title: 'Roles',
    body: 'Admin can do everything, including managing other users. Developer can trigger pipelines, roll back deployments, and manage secrets. Viewer can read everything (dashboards, logs, history) but cannot trigger, deploy, or edit secrets.',
  },
  {
    title: 'Real-time updates',
    body: 'GET /api/pipelines/runs/:id/stream is a Server-Sent Events endpoint. The pipeline engine emits an event on every stage transition; connected clients get a fresh run snapshot immediately, and the stream closes once the run reaches a final status. The pipeline page uses this instead of polling on an interval.',
  },
  {
    title: 'Local development',
    body: 'Requires PostgreSQL — the quickest path is docker compose up db -d from the repo root, which matches the default .env.example. Backend: cd backend && npm install && cp .env.example .env && npx prisma generate && npx prisma db push && npm run seed && npm run dev. Frontend: cd frontend && npm install && npm run dev. Or run the whole stack with docker compose up --build.',
  },
];

export function Docs() {
  return (
    <div className="max-w-3xl space-y-8">
      {SECTIONS.map((s) => (
        <div key={s.title}>
          <h3 className="text-sm font-medium">{s.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
        </div>
      ))}

      <div>
        <h3 className="mb-2 text-sm font-medium">Azure → Render / GitHub mapping</h3>
        <p className="mb-3 text-sm text-muted">
          This table documents what each managed Azure service was replaced with, for teams evaluating the same
          migration.
        </p>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2">Azure service</th>
                <th className="px-4 py-2">Replacement</th>
                <th className="px-4 py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {MAPPING.map((m) => (
                <tr key={m.azure} className="border-t border-border align-top">
                  <td className="px-4 py-2 text-xs">{m.azure}</td>
                  <td className="px-4 py-2 text-xs font-medium">{m.render}</td>
                  <td className="px-4 py-2 text-xs text-muted">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
