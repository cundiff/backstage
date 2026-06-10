# AGENTS.md

Guidance for AI agents working in the Acme Developer Portal (Backstage 1.51.0 monorepo).

## Project overview

Single Backstage instance with custom Cursor maintenance plugins, enterprise-shaped demo catalog, Jira dashboard, golden-path scaffolder templates, and MCP actions. Yarn 4 workspaces: `packages/app`, `packages/backend`, `plugins/cursor-maintenance*`.

## Cursor Cloud specific instructions

### Runtime requirements

- **Node.js 22 or 24** (see `package.json` `engines`)
- **Yarn 4.4.1** via Corepack (`packageManager` field)

### First-time local setup (human or agent)

1. Copy env template: `cp .env.example .env` and fill tokens for full demo flows (GitLab, Cursor API, Jira). For basic portal dev, placeholder values plus a generated `MCP_TOKEN` are enough to start the app.
2. Install deps: `corepack enable && corepack prepare yarn@4.4.1 --activate && yarn install`
3. Start dev servers: `yarn start` (frontend **3000**, backend **7007**)

Optional for full catalog components (`nopcommerce-platform`, etc.): run `./scripts/bootstrap-gitlab-demo.sh` with a real `GITLAB_TOKEN` and `DEMO_GITLAB_GROUP` to generate `examples/catalog.local.yaml`. Without bootstrap, `examples/entities.yaml` points at a missing `catalog.local.yaml` (backend logs a warning); **org groups and scaffolder templates still work**.

### Starting services

Use a persistent tmux session for `yarn start` — it runs both frontend and backend and does not exit:

```bash
SESSION_NAME="backstage-dev"
tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$SESSION_NAME" 2>/dev/null \
  || tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_NAME" -c /workspace -- "${SHELL:-zsh}" -l
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_NAME:0.0" 'cd /workspace && yarn start' C-m
```

Sign in at http://localhost:3000 with **Guest** (click ENTER on the Guest card).

### Lint and test

| Command | Purpose |
| --- | --- |
| `yarn lint:all` | ESLint across workspaces |
| `CI=true yarn workspace @internal/plugin-cursor-maintenance-backend test --watchAll=false` | Unit tests for maintenance plugin (9 tests) |
| `yarn test:e2e` | Playwright E2E (auto-starts app if not running) |
| `./scripts/preflight-demo.sh` | Full demo validation (needs real env vars + running app) |

`yarn lint` (without `:all`) only checks packages changed since `origin/main`.

### Gotchas

- **`.env` is required** for `yarn start` — the start script uses `dotenv -e .env`. Create it from `.env.example` before starting.
- **Catalog components** need `examples/catalog.local.yaml` from bootstrap; groups come from `examples/org.yaml` regardless.
- **TechDocs generation** uses Docker (`techdocs.generator.runIn: docker` in `app-config.yaml`); Docker is optional for catalog/UI dev.
- **External integrations** (GitLab scaffolder publish, Jira tab, Cursor maintenance agents, MCP client) need real credentials in `.env`.
- **Database**: local dev uses in-memory SQLite (`better-sqlite3`); no Postgres required locally.
- **Backend catalog API** returns 401 without auth; the frontend proxies authenticated requests after Guest sign-in.

### Key URLs

- App: http://localhost:3000
- Backend: http://localhost:7007
- Scaffolder: http://localhost:3000/create

See `README.md` and `docs/demo-setup.md` for full demo flows.
