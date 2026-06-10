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

## Cursor GitLab integration (Bugbot + Cloud Agents)

After bootstrap, connect GitLab in the [Cursor dashboard](https://cursor.com/dashboard?tab=integrations) so Bugbot and Cloud Agents can run against the demo repos.

### Connect GitLab

1. **Integrations → GitLab → Connect** (or **Manage** if already linked).
2. **Sync Repos** so all `${DEMO_GITLAB_GROUP}` projects appear.
3. Confirm the five bootstrapped repos are listed:
   - `nopcommerce`
   - `payments-service`
   - `legacy-checkout-api`
   - `auth-service`
   - `notification-service`

**GitLab plan note:** Bugbot on GitLab.com requires **Premium or Ultimate**. The free tier blocks project access tokens and webhook setup — you will see errors like *Failed to install webhooks for any projects*.

### Enable Bugbot

1. Open the **Bugbot** tab in the Cursor dashboard.
2. Enable Bugbot for **all demo repos** above (including `nopcommerce`).
3. Verify each project has a webhook installed:

```bash
# Expect 1 webhook per repo when Bugbot is enabled
curl -sf -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://gitlab.com/api/v4/projects/${DEMO_GITLAB_GROUP}%2Fnopcommerce/hooks" \
  | python3 -c "import sys,json; print(len(json.load(sys.stdin)), 'webhook(s)')"
```

Bugbot reviews merge requests on connected repos automatically. Use it as a talking point when a maintenance or golden-path MR lands during the demo.

### Cloud Agents (dev environment setup)

Cloud Agents use the same GitLab connection. For a richer demo on `nopcommerce`:

1. Open the repo in Cursor (or from the Cloud Agents UI).
2. Start a **Cloud Agent** on a feature branch — e.g. dev environment / local setup improvements aligned with `.cursor/skills/start-local-nopcommerce`.
3. Let the agent push a branch and open an MR; Bugbot should review that MR automatically.

This pairs well with Flow 2: Maintenance tab agents and Cloud Agents both produce GitLab MRs; Bugbot adds automated review on top.

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

Optional manual checks after Bugbot setup:

- [ ] Each demo GitLab repo has at least one webhook (Bugbot installed)
- [ ] Bugbot enabled for all five repos in the Cursor dashboard
- [ ] Cloud Agent branch/MR visible on `nopcommerce` when env-setup work is in flight

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
3. Connect GitLab in Cursor dashboard; enable **Bugbot** on all demo repos
4. (Optional) Start a **Cloud Agent** on `nopcommerce` for dev-env setup MR + Bugbot review
5. `yarn install && yarn start`
6. `./scripts/preflight-demo.sh`
7. **Flow 1:** golden-path vs legacy template contrast
8. **Flow 3:** MCP catalog/scaffolder tools work
9. **Flow 2:** Maintenance tab streams events and produces MR link

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
| Bugbot on GitLab Free | Requires Premium/Ultimate; enable per repo in Cursor dashboard after bootstrap |
| Cloud Agents | Same GitLab integration as Bugbot; optional pre-demo env-setup MR on `nopcommerce` |
| `catalog.local.yaml` | Gitignored; generated by bootstrap |
| Rally | Customer planning tool — documented for context, not implemented |
| Self-hosted workers | Out of scope — uses Cursor-hosted cloud agents |
