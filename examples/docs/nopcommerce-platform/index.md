# nopCommerce Platform

The **nopcommerce-platform** component is the hero entity for the Acme Developer Portal demo.
It represents a .NET monolith with an evolving tax integration story.

## Architecture

- **Monolith**: nopCommerce storefront (`src/Presentation/Nop.Web`)
- **Core libraries**: `src/Libraries/Nop.Services`, `src/Libraries/Nop.Core`
- **Tax integration**: catalog sub-component [`tax-service`](../../acme-catalog.yaml) — conceptual path `services/tax-service` on the `develop` branch
- **Migration branch**: [`cursor/tax-service-node-migration-203e`](https://gitlab.com/__DEMO_GITLAB_GROUP__/nopcommerce/-/tree/cursor/tax-service-node-migration-203e) explores a Node.js tax microservice extraction

## Dependencies

| Dependency | Kind | Notes |
| --- | --- | --- |
| `tax-service` | Component | Tax calculation within the monorepo |
| `auth-service` | Component | Customer authentication |
| `payments-api` | API | Payment processing integration |

## Local development

Bring up the storefront locally on port **8080**:

1. Open this repo in Cursor
2. Run the skill at `.cursor/skills/start-local-nopcommerce`
3. Browse to http://localhost:8080
4. Tear down with `.cursor/skills/stop-local-nopcommerce`

The maintenance demo includes a backlog item to add port fallback logic in the start skill when 8080 is already in use (themed on Jira **NOP-7**).

## Jira

Storefront work is tracked in project **[NOP](https://builders180.atlassian.net/browse/NOP)** on `builders180.atlassian.net`.

## Cursor agent context

- Root **`AGENTS.md`** is injected by `./scripts/bootstrap-gitlab-demo.sh` before the GitLab push
- Existing Cursor skills under `.cursor/skills/` handle local Docker lifecycle
- Prefer **narrow maintenance tasks** during live demos — avoid full monorepo refactors

## Related catalog entities

- [`nopcommerce-platform`](https://localhost:3000/catalog/default/component/nopcommerce-platform) — this component
- [`tax-service`](https://localhost:3000/catalog/default/component/tax-service) — tax sub-component
- [`payments-service`](https://localhost:3000/catalog/default/component/payments-service) — golden-path Flow 2 fallback
