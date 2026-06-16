# Acme Developer Portal

Enterprise-shaped **Cursor + Backstage** demo: rich software catalog, Jira visibility (NOP), golden-path scaffolding, and cloud-agent maintenance on a real nopCommerce fork.

Quick start:

```bash
cp .env.example .env          # fill GITLAB_TOKEN, CURSOR_API_KEY, MCP_TOKEN, DEMO_GITLAB_GROUP, JIRA_*
./scripts/bootstrap-gitlab-demo.sh
yarn install
yarn start
```

Open http://localhost:3000 and navigate to **nopcommerce-platform** for Jira, Maintenance, and TechDocs tabs.

Full runbook: [docs/demo-setup.md](docs/demo-setup.md)

## Team onboarding

Each teammate runs their own local instance. Demo repos are created under **your** GitLab namespace — not shared centrally.

### Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js 22 or 24 | See `package.json` engines |
| Yarn 4 | `corepack enable` if needed |
| GitLab account | Personal access token with `api` scope |
| Cursor API key | Team service account preferred for Flow 2 |
| Jira access | Project **NOP** on `builders180.atlassian.net` (email + API token) |
| Docker | Required for TechDocs generation |

### First-time setup (per developer)

1. Clone this repo and `cd` into it.
2. Copy env template and fill in your tokens:
   ```bash
   cp .env.example .env
   ```
   Set `DEMO_GITLAB_GROUP` to your GitLab username or group (e.g. `your-user`).
3. Bootstrap demo GitLab repos (idempotent — safe to re-run):
   ```bash
   ./scripts/bootstrap-gitlab-demo.sh
   ```
   This creates `nopcommerce`, `payments-service`, `legacy-checkout-api`, and stub repos under your namespace, then writes `examples/catalog.local.yaml` (gitignored).
4. Install and start:
   ```bash
   yarn install
   yarn start
   ```
5. Configure Cursor MCP — copy [`docs/mcp.json.example`](docs/mcp.json.example) into your Cursor MCP settings and replace `${MCP_TOKEN}` with the value from `.env`.
6. *(Optional)* Connect GitLab in the [Cursor dashboard](https://cursor.com/dashboard?tab=integrations) and enable **Bugbot** on all five demo repos. Bugbot on GitLab.com requires **Premium or Ultimate**.

### Without bootstrap

`yarn start` works without bootstrap — the committed catalog uses `__DEMO_GITLAB_GROUP__` placeholder slugs. GitLab links and Flow 2 maintenance will not resolve until you run bootstrap and restart.

### Optional overrides

| Variable | Purpose |
| --- | --- |
| `NOPCOMMERCE_SOURCE` | Local path or git URL to a nopCommerce fork; defaults to cloning `github.com/cundiff/nopCommerce` (`develop`) |

### Sanity check

With the app running:

```bash
./scripts/preflight-demo.sh
```

All checks should pass before a screen share.

## Demo flows

| Flow | What it shows |
| --- | --- |
| **Flow 1** | Legacy template (no `AGENTS.md`) vs golden-path scaffold |
| **Flow 2** | Maintenance tab — Cursor cloud agent opens a GitLab MR |
| **Flow 3** | MCP catalog + scaffolder grounding from Cursor |

## Verification

```bash
./scripts/preflight-demo.sh     # with app running
yarn workspace @internal/plugin-cursor-maintenance-backend test
```

Built on [Backstage](https://backstage.io) 1.51.0.
