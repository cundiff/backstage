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
