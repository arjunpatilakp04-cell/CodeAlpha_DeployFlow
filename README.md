# DeployFlow

A CI/CD and deployment platform (React + Express + Prisma + PostgreSQL) built for the CodeAlpha
DevOps Internship. Trigger a pipeline, watch 9 stages progress live over Server-Sent Events, deploy
to Development/Staging/Production, view builds, registry images, logs and metrics, manage masked
secrets, and roll back.

## Live integration vs. demo mode
This build runs in **demo mode**. There is no real GitHub webhook, Docker daemon, or Render API call.
What is real: stage transitions happen over actual time, are stored in Postgres, and the frontend
receives them live over a Server-Sent Events stream (no polling). You can force a failure at any
stage to exercise failure handling, retry and rollback.
To go live, replace the timed stages in `backend/src/services/pipelineEngine.ts` with real
`docker build` / `docker push` / Render Deploy API calls. The data model, API and UI need no changes.

## Quick start (local)
Requires a Postgres database. Easiest: start one with Docker —
```bash
docker compose up db -d
```
Then:
```bash
cd backend
npm install
cp .env.example .env    # already points at the Docker Compose db above
npx prisma generate
npx prisma db push
npm run seed             # demo@deployflow.dev / demo1234
npm run dev               # http://localhost:4000

cd ../frontend
npm install
npm run dev                # http://localhost:5173
```
No Docker? Point `DATABASE_URL` in `backend/.env` at any Postgres instance instead (a local install,
or a free one from Neon or Render Postgres), then run the same backend/frontend steps.

Or run the whole stack in containers: `docker compose up --build` (frontend on :5173, backend on :4000).

## Real-time pipeline updates
`GET /api/pipelines/runs/:id/stream` is a Server-Sent Events endpoint. The pipeline engine emits an
event on every stage transition; the route re-reads the run from the database and pushes a fresh
snapshot to any connected client, then closes the stream once the run reaches PASSED or FAILED. The
frontend's `usePipelineStream` hook (`frontend/src/hooks/usePipelineStream.ts`) consumes it — no
polling interval anywhere in the pipeline view. Because `EventSource` can't send custom headers, the
auth token travels as a query param and is verified separately from the normal Authorization-header
middleware (see `verifyToken` in `backend/src/middleware/auth.ts`).

## Deploy to Render
Push to GitHub, create a Blueprint from `render.yaml`. It provisions a free Postgres database
alongside the two web services and wires `DATABASE_URL` automatically. Update the two service URLs
in `render.yaml` to match what Render assigns, and set `CORS_ORIGIN` / `VITE_API_URL` accordingly
(see the walkthrough earlier in this project's chat history for exact steps).

## Azure → Render / GitHub mapping
| Azure | Replacement |
|---|---|
| Azure DevOps Pipelines | DeployFlow pipeline engine + GitHub Actions (`.github/workflows/ci.yml`) |
| Azure Container Registry | GitHub Container Registry (ghcr.io) |
| Azure App Service | Render Web Service (`render.yaml`) |
| Azure Database for PostgreSQL | Render Postgres (provisioned by `render.yaml`) |
| Azure Key Vault | Masked environment variables |
| Azure Monitor | Monitoring page |
| Azure AD | JWT + bcrypt auth |

## Roles
Admin: everything. Developer: run pipelines, roll back, manage secrets. Viewer: read-only.

## Known limitations
This is a working demo, not the full spec of every DevOps-SaaS feature imaginable. Not built:
- Real GitHub webhook, Docker daemon, or Render API integration (see "Live integration vs. demo mode").
- Notifications (Slack/email/webhook) — no model, no page, no history.
- Global search / Cmd+K command palette.
- Light mode / theme switcher, org/workspace switcher.
- Forgot-password flow.
- httpOnly-cookie sessions (the JWT is stored in localStorage), rate limiting, CSRF protection.
- `POST /api/webhooks/github`, an Integrations table, a dedicated health-check-config page.
- Frontend log virtualization (the backend paginates logs; the UI doesn't yet).
- Breadcrumbs, image vulnerability scanning, deployment-frequency chart, uptime-over-time chart.
- Metrics charts use generated demo series, not real telemetry.

## Prisma / build note
This project's schema and TypeScript were authored in a sandbox that could not reach Prisma's engine
binary host, so `prisma generate` was never run end-to-end during authoring. The schema and all
`prisma.*` calls were hand-checked against each other, and the Express/React TypeScript was compiled
successfully. Still: run `npx prisma generate` locally as the first step, and if it reports a schema
error, it's likely a small mismatch to fix.
