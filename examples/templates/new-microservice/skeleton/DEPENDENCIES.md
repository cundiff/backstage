# Approved dependencies

<!-- Golden-path services start dependency-free. Add approved packages below. -->

| Package | Purpose | Approved |
|---------|---------|----------|
| `@onetru/data-access` | Permissioned consumer-record access + FCRA audit trail (Tru Guardrail 1). The only approved path to consumer/credit data. | yes |

Direct database drivers (`pg`, `mysql2`, `knex`, `prisma`, ...) against consumer or credit
data are NOT approved — use `@onetru/data-access` instead (see `.cursor/rules/tru-guardrails.mdc`).
