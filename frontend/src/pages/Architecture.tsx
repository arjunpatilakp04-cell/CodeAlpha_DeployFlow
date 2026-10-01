const NODES = [
  { x: 20, y: 20, w: 150, h: 50, label: 'GitHub repo', sub: 'push / PR' },
  { x: 20, y: 110, w: 150, h: 50, label: 'DeployFlow UI', sub: 'React + Vite' },
  { x: 220, y: 110, w: 170, h: 50, label: 'DeployFlow API', sub: 'Express + Prisma' },
  { x: 220, y: 200, w: 170, h: 50, label: 'Pipeline engine', sub: '9-stage runner' },
  { x: 440, y: 20, w: 170, h: 50, label: 'SQLite / Postgres', sub: 'all app state' },
  { x: 440, y: 110, w: 170, h: 50, label: 'Container registry', sub: 'ghcr.io' },
  { x: 440, y: 200, w: 170, h: 50, label: 'Render web service', sub: 'live deployment' },
  { x: 220, y: 290, w: 170, h: 50, label: 'Health checks', sub: '/health polling' },
];

const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 4],
  [2, 3],
  [3, 5],
  [3, 6],
  [6, 7],
  [7, 3],
];

function centerOf(n: (typeof NODES)[number]) {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

export function Architecture() {
  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-muted">
        A push to GitHub is picked up by DeployFlow (in demo mode, manually triggered from the UI instead of a real
        webhook). The API creates a pipeline run and hands it to the pipeline engine, which progresses through
        checkout, install, lint, test, build, containerize, push, deploy and health-check stages — persisting state
        to the database at every step so the UI can poll it live.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface p-4">
        <svg viewBox="0 0 650 360" className="min-w-[650px]" xmlns="http://www.w3.org/2000/svg">
          {EDGES.map(([from, to], i) => {
            const a = centerOf(NODES[from]);
            const b = centerOf(NODES[to]);
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#232328"
                strokeWidth={1.5}
                markerEnd="url(#arrow)"
              />
            );
          })}
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#8B8B93" />
            </marker>
          </defs>
          {NODES.map((n, i) => (
            <g key={i}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={8} fill="#1A1A1E" stroke="#232328" />
              <text x={n.x + 12} y={n.y + 22} fill="#F4F4F5" fontSize={13} fontFamily="Inter, sans-serif">
                {n.label}
              </text>
              <text x={n.x + 12} y={n.y + 38} fill="#8B8B93" fontSize={11} fontFamily="JetBrains Mono, monospace">
                {n.sub}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-medium">Data flow</h3>
          <p className="mt-2 text-sm text-muted">
            Every stage write, log line, build, registry image, deployment and health check is a real row in the
            database. The frontend never simulates state client-side — it polls the API, so refreshing the page
            never loses progress.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-medium">Failure handling</h3>
          <p className="mt-2 text-sm text-muted">
            Triggering a run with a chosen "fail at" stage causes that stage — and only that stage — to fail; every
            stage after it is marked skipped, and a failed build/deployment record is still created so the failure
            is visible everywhere, not hidden. Retrying creates a fresh run against the same commit and environment.
          </p>
        </div>
      </div>
    </div>
  );
}
