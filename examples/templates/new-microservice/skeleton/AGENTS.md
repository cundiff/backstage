# ${{ values.name }} — Agent Instructions

This repository was scaffolded from the **New Microservice (Golden Path)** Backstage template.
Follow these conventions when making changes.

## Service context

| Field | Value |
|-------|-------|
| **Name** | ${{ values.name }} |
| **Owner** | ${{ values.owner }} |
| **Stack** | ${{ values.stack }} |

> **Demo note:** `python` and `go` stack selections currently receive the `node-ts` skeleton.
> Adapt generated files if you chose a non-TypeScript stack.

## Ownership & catalog

- Catalog owner: `${{ values.owner }}`
- Register changes in `catalog-info.yaml` when service metadata changes.
- Do not rename the service without updating catalog entities.

## Stack conventions (${{ values.stack }})

{% if values.stack == 'node-ts' %}
- Runtime: Node.js with TypeScript (strict mode).
- Entry point: `src/index.ts`
- Build output: `dist/` (if a build step is added later).
- Prefer native `node:http` or established project HTTP libraries — check `DEPENDENCIES.md` first.
{% elif values.stack == 'python' %}
- Runtime: Python 3.11+
- Entry point: `src/main.py` (create when migrating from node-ts scaffold).
- Use `pytest` for tests colocated under `tests/` or next to modules.
{% elif values.stack == 'go' %}
- Runtime: Go 1.22+
- Entry point: `cmd/${{ values.name }}/main.go` (create when migrating from node-ts scaffold).
- Use table-driven tests in `*_test.go` files next to source.
{% endif %}

## Logging

- **Do not** add `console.log` / unstructured stdout logging in application code.
- Use a structured logger with levels (`info`, `warn`, `error`) and JSON fields:
  - `service`: `${{ values.name }}`
  - `requestId` when handling HTTP traffic
- Existing `console.log` calls are intentional demo debt — migrate them when asked.

## Error envelope

HTTP handlers must return errors in this shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable summary",
    "details": {}
  }
}
```

- Use appropriate HTTP status codes (4xx client, 5xx server).
- Never leak stack traces or internal paths in responses.

## Tests

- Colocate unit tests beside source (e.g. `src/index.test.ts` next to `src/index.ts`).
- Every new endpoint or exported function needs at least one happy-path test.
- CI runs `yarn test` — keep tests fast and deterministic.

## Dependencies

- Consult `DEPENDENCIES.md` before adding packages.
- Prefer minimal dependencies; justify new ones in the PR description.

## Pull requests

- Reference the catalog entity `${{ values.name }}` when linking to Backstage.
- Keep changes focused; golden-path services stay small and observable.
