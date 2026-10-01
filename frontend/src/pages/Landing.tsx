import { Link } from 'react-router-dom';

const FEATURES = [
  { title: 'Automated CI/CD', body: 'Every push runs checkout, install, lint, test, build and deploy — no manual steps.' },
  { title: 'Containerized deployments', body: 'Docker images built and pushed to a registry as part of every pipeline run.' },
  { title: 'Real-time monitoring', body: 'Response time, error rate, uptime and resource charts for every environment.' },
  { title: 'Deployment history', body: 'A complete, browsable timeline of every version shipped to every environment.' },
  { title: 'Instant rollback', body: 'Return to any previous version in one confirmed action, fully audited.' },
  { title: 'Secure environments', body: 'Masked secrets, scoped roles, and an audit log of every sensitive change.' },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-accent" />
          <span className="text-sm font-semibold tracking-tight">DeployFlow</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/login" className="text-muted hover:text-text">
            Log in
          </Link>
          <Link to="/signup" className="rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent/90">
            Get Started
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          Ship software with confidence.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted">
          A modern CI/CD platform for building, deploying and monitoring applications automatically.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/signup" className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90">
            Get Started
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-surface"
          >
            View Demo
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-lg border border-border bg-surface p-6 font-mono text-xs leading-relaxed">
          <div className="text-muted"># Pipeline #1842 — main @ 8f92a1c</div>
          <div className="mt-2 text-success">✓ Checkout Repository <span className="text-muted">4s</span></div>
          <div className="text-success">✓ Install Dependencies <span className="text-muted">18s</span></div>
          <div className="text-success">✓ Run Tests <span className="text-muted">24s</span></div>
          <div className="text-success">✓ Build Application <span className="text-muted">31s</span></div>
          <div className="text-success">✓ Build Docker Image <span className="text-muted">42s</span></div>
          <div className="text-success">✓ Push Container <span className="text-muted">18s</span></div>
          <div className="text-warning">● Deploy to Render <span className="text-muted">Running</span></div>
          <div className="text-skip">○ Health Check <span className="text-muted">Pending</span></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-24 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-lg border border-border bg-surface p-5">
            <h3 className="text-sm font-medium">{f.title}</h3>
            <p className="mt-2 text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted">
        DeployFlow — built for the CodeAlpha DevOps Internship, Task 1 (CI/CD Pipeline), deployed on Render.
      </footer>
    </div>
  );
}
