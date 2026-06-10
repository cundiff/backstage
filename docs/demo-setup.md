# Cursor + Backstage Enterprise Demo Setup

Runbook for the three enterprise demo flows in this Backstage instance. Use a throwaway GitLab group and demo API keys on screen share — never production credentials.

**Customer context:** The target customer uses Rally for planning. This demo intentionally uses **Jira (NOP)** for on-screen visibility. No Rally plugin work.

## Prerequisites

| Variable | Purpose |
| --- | --- |
| `GITLAB_TOKEN` | Scaffolder publish + cloud agent repo access (project create + contents write) |
| `CURSOR_API_KEY` | Flow 2 cloud maintenance agents (team service account key preferred) |
| `MCP_TOKEN` | Static bearer for Cursor MCP client → Backstage backend |
| `DEMO_GITLAB_GROUP` | GitLab username or group for demo repos (e.g. `your-user`) |
| `JIRA_TOKEN` | Atlassian API token with Jira read scope |
| `JIRA_EMAIL` | Atlassian account email for Jira Cloud auth |

Create an [Atlassian API token](https://id.atlassian.com/manage-profile/security/api-tokens) with Jira read scope.

Generate an MCP token:

```bash
node -p 'require("crypto").randomBytes(24).toString("base64")'
```

Copy env template and fill in values:

```bash
cp .env.example .env
# edit .env with your tokens
```

Optional override:

| Variable | Default |
| --- | --- |
| `NOPCOMMERCE_SOURCE` | `/Users/iancundiff/demos/stacks/dotnet/nopCommerce` |

## Bootstrap GitLab repos

Before the first `yarn start`, bootstrap demo repos and generate `examples/catalog.local.yaml`:

```bash
./scripts/bootstrap-gitlab-demo.sh
```

This idempotently creates under `${DEMO_GITLAB_GROUP}`:

| Repo | Purpose |
| --- | --- |
| `nopcommerce` | Hero entity — real nopCommerce fork with injected `AGENTS.md` |
| `payments-service` | Golden-path microservice (Flow 2 fallback) |
| `legacy-checkout-api` | Legacy service without `AGENTS.md` (Flow 1 contrast) |
| `auth-service`, `notification-service` | Minimal catalog stubs |

## Install and start

```bash
yarn install
yarn start
```

`yarn start` loads secrets from `.env` automatically via `dotenv-cli`.

- Frontend: http://localhost:3000
- Backend: http://localhost:7007

Sign in as the guest user when prompted.

### Without bootstrap

`yarn start` works without bootstrap — the committed `examples/acme-catalog.yaml` loads with `__DEMO_GITLAB_GROUP__` placeholder slugs. GitLab links and Flow 2 maintenance will not resolve until you run bootstrap and restart. The catalog location for `catalog.local.yaml` logs a missing-file warning if the file is absent; this is harmless.

## Pre-flight verification

With the app running:

```bash
./scripts/preflight-demo.sh
```

Checks env vars, Backstage health, MCP auth, GitLab projects, and Jira project **NOP**.

## Hero entity

Open **Catalog → nopcommerce-platform** for the full demo surface:

- **Jira** tab — project NOP on `builders180.atlassian.net`
- **Maintenance** tab — Cursor cloud agent backlog (prefer narrow, skill-scoped tasks)
- **TechDocs** tab — architecture overview and local docker bring-up (port 8080)

## 20-minute stitch order

1. **Flow 1** — Golden paths and `AGENTS.md` (5–7 min)
2. **Flow 3** — MCP catalog + scaffolder grounding (5–7 min)
3. **Flow 2** — Maintenance tab with cloud agent MR (8–10 min; pre-scaffold repo to reduce wait)

---

## Flow 1 — Cursor-ready golden paths

### Cold open (contrast)

1. Open Cursor on a repo scaffolded from **Legacy Service (No Golden Path)** (no `AGENTS.md`).
2. Ask: *"Add a health-check endpoint."*
3. Note inconsistent style and missing conventions.

### Live demo

1. In Backstage, go to **Create** (`/create`).
2. Choose **New Microservice (Golden Path)**.
3. Fill in name, owner (`group:default/platform-team` default), and stack (`node-ts` recommended).
4. Publish to GitLab and register in the catalog.
5. Open the new repo in Cursor — confirm templated `AGENTS.md`, CI stub, and `DEPENDENCIES.md`.
6. Same prompt: *"Add a health-check endpoint."* — show alignment with `AGENTS.md`.

### Verify

- [ ] `/create` lists **Legacy Service (No Golden Path)** and **New Microservice (Golden Path)**
- [ ] Golden-path repo contains `AGENTS.md`, `catalog-info.yaml`, and `.gitlab-ci.yml`
- [ ] Legacy template repo has no `AGENTS.md`

---

## Flow 3 — MCP catalog + scaffolder grounding

### Configure Cursor MCP

Copy [`docs/mcp.json.example`](mcp.json.example) into your Cursor MCP settings. Replace `${MCP_TOKEN}` with the value from `.env`.

Backstage exposes scoped servers:

- `backstage-catalog` → `/api/mcp-actions/v1/catalog`
- `backstage-scaffolder` → `/api/mcp-actions/v1/scaffolder`

### Live demo

1. In Cursor, confirm MCP tools list shows both Backstage servers.
2. Ask: *"Who owns nopcommerce-platform?"*
3. Ask: *"What Jira project tracks storefront work?"* — should surface **NOP**.
4. Ask: *"What does payments-service depend on?"* — should surface `auth-service`, `ledger-service`, `payments-db`.

### Verify

- [ ] MCP tools connect without auth errors
- [ ] Catalog queries return hero entity metadata
- [ ] Destructive catalog/scaffolder actions are not exposed

---

## Flow 2 — Maintenance tab (cloud agents)

### Setup

1. Ensure `CURSOR_API_KEY` is set.
2. Run bootstrap so `nopcommerce-platform` has a real `gitlab.com/project-slug`.
3. Ensure the GitLab token can push branches and open merge requests.

### Live demo

1. Open **Catalog → nopcommerce-platform** (or **payments-service** as fallback).
2. Select the **Maintenance** tab.
3. Review backlog cards — including **Fix docker port conflict** (NOP-7 themed).
4. Click **Run with Cursor** or a task button.
5. Watch the live SSE log stream.
6. Open the merge request link when complete.

Backend route: `POST /api/cursor-maintenance/run`

### Verify

- [ ] Maintenance tab appears on entities with `gitlab.com/project-slug`
- [ ] SSE log streams assistant and tool events
- [ ] Cloud agent opens a merge request (may take 2–10+ minutes)

---

## Verification checklist (all flows)

1. `cp .env.example .env` — fill all required vars
2. `./scripts/bootstrap-gitlab-demo.sh`
3. `yarn install && yarn start`
4. `./scripts/preflight-demo.sh`
5. **Flow 1:** golden-path vs legacy template contrast
6. **Flow 3:** MCP catalog/scaffolder tools work
7. **Flow 2:** Maintenance tab streams events and produces MR link

Run targeted tests:

```bash
yarn workspace @internal/plugin-cursor-maintenance-backend test
```

---

## Caveats

| Topic | Notes |
| --- | --- |
| Cloud agent latency | Pre-scaffold repos; use narrow tasks (single skill or file) |
| nopCommerce repo size | Prefer skill-scoped maintenance, not full monorepo refactors |
| `@cursor/sdk` beta | API may evolve; pin version in `package.json` |
| GitLab token scope | Needs `api` scope for project create and MR push |
| `catalog.local.yaml` | Gitignored; generated by bootstrap |
| Rally | Customer planning tool — documented for context, not implemented |
| Self-hosted workers | Out of scope — uses Cursor-hosted cloud agents |
