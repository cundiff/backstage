#!/usr/bin/env bash
# Idempotent GitLab demo bootstrap — mirrors nopCommerce, scaffolds microservices,
# and emits examples/catalog.local.yaml with resolved GitLab slugs.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

: "${GITLAB_TOKEN:?GITLAB_TOKEN is required}"
: "${DEMO_GITLAB_GROUP:?DEMO_GITLAB_GROUP is required}"

NOPCOMMERCE_SOURCE="${NOPCOMMERCE_SOURCE:-/Users/iancundiff/demos/stacks/dotnet/nopCommerce}"
GITLAB_HOST="${GITLAB_HOST:-gitlab.com}"
GITLAB_API="https://${GITLAB_HOST}/api/v4"
WORK_DIR="${TMPDIR:-/tmp}/backstage-demo-bootstrap-$$"

NOPCOMMERCE_REPO="nopcommerce"
PAYMENTS_REPO="payments-service"
LEGACY_REPO="legacy-checkout-api"
AUTH_REPO="auth-service"
NOTIFICATION_REPO="notification-service"

cleanup() {
  rm -rf "${WORK_DIR}"
}
trap cleanup EXIT

log() {
  printf '[bootstrap] %s\n' "$*"
}

gitlab_api() {
  local method="$1"
  local path="$2"
  shift 2
  curl -sfS -X "${method}" \
    -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
    -H "Content-Type: application/json" \
    "${GITLAB_API}${path}" "$@"
}

encode_path() {
  python3 -c 'import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$1"
}

project_exists() {
  local slug="$1"
  local encoded
  encoded="$(encode_path "${DEMO_GITLAB_GROUP}/${slug}")"
  if gitlab_api GET "/projects/${encoded}" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

create_project() {
  local name="$1"
  log "Creating GitLab project ${DEMO_GITLAB_GROUP}/${name}"
  gitlab_api POST "/projects" \
    -d "{\"name\":\"${name}\",\"path\":\"${name}\",\"namespace_id\":null,\"visibility\":\"private\"}" \
    >/dev/null 2>&1 || \
  gitlab_api POST "/projects" \
    -d "{\"name\":\"${name}\",\"path\":\"${name}\",\"namespace\":\"${DEMO_GITLAB_GROUP}\",\"visibility\":\"private\"}" \
    >/dev/null
}

ensure_project() {
  local name="$1"
  if project_exists "${name}"; then
    log "Project ${DEMO_GITLAB_GROUP}/${name} already exists"
  else
    create_project "${name}"
  fi
}

push_repo() {
  local name="$1"
  local source_dir="$2"
  local branch="${3:-main}"
  local remote="https://oauth2:${GITLAB_TOKEN}@${GITLAB_HOST}/${DEMO_GITLAB_GROUP}/${name}.git"

  rm -rf "${source_dir}/.git"
  git -C "${source_dir}" init -b "${branch}"
  git -C "${source_dir}" config user.email "demo@backstage.local"
  git -C "${source_dir}" config user.name "Backstage Demo Bootstrap"
  git -C "${source_dir}" add -A
  if git -C "${source_dir}" diff --cached --quiet; then
    git -C "${source_dir}" commit -m "Bootstrap demo repo for Backstage enterprise seed" --allow-empty
  else
    git -C "${source_dir}" commit -m "Bootstrap demo repo for Backstage enterprise seed"
  fi
  git -C "${source_dir}" remote add origin "${remote}"
  git -C "${source_dir}" push -u origin "${branch}" --force
}

prepare_nopcommerce() {
  local dest="${WORK_DIR}/nopcommerce"
  log "Preparing nopCommerce from ${NOPCOMMERCE_SOURCE}"

  if [[ -d "${NOPCOMMERCE_SOURCE}/.git" ]]; then
    git clone --branch develop --single-branch "${NOPCOMMERCE_SOURCE}" "${dest}"
  elif [[ -d "${NOPCOMMERCE_SOURCE}" ]]; then
    cp -a "${NOPCOMMERCE_SOURCE}" "${dest}"
    rm -rf "${dest}/.git" 2>/dev/null || true
  else
    log "Cloning nopCommerce from GitHub (develop branch)"
    git clone --branch develop --single-branch \
      https://github.com/cundiff/nopCommerce.git "${dest}"
  fi

  if [[ ! -f "${dest}/AGENTS.md" ]]; then
    cat > "${dest}/AGENTS.md" <<'AGENTS'
# nopCommerce Platform — Agent Instructions

This .NET monolith is the hero demo entity for the Acme Developer Portal.

## Architecture

- Core libraries: `src/Libraries/Nop.Services`, `src/Libraries/Nop.Core`
- Web host: `src/Presentation/Nop.Web`
- Tax integration: conceptual `services/tax-service` (see branch `cursor/tax-service-node-migration-203e`)

## Local development

- Use `.cursor/skills/start-local-nopcommerce` to bring up Docker on port **8080**
- Use `.cursor/skills/stop-local-nopcommerce` to tear down containers
- Do not change the default port without updating the skill fallback chain

## Logging conventions

- Use structured logging via NLog / ILogger — avoid raw `Console.WriteLine` in application code
- Include correlation IDs on HTTP request paths in `Nop.Web`

## Maintenance scope

- Prefer narrow, skill-scoped tasks (docker port conflicts, single-file logging migrations)
- Avoid full monorepo refactors during live demos
AGENTS
  fi

  if [[ ! -f "${dest}/catalog-info.yaml" ]]; then
    cat > "${dest}/catalog-info.yaml" <<'CATALOG'
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: nopcommerce-platform
  annotations:
    backstage.io/managed-by-location: file:./catalog-info.yaml
spec:
  type: website
  lifecycle: production
  owner: group:default/ecommerce-team
  system: ecommerce
CATALOG
  fi

  ensure_project "${NOPCOMMERCE_REPO}"
  push_repo "${NOPCOMMERCE_REPO}" "${dest}" "develop"
}

prepare_payments_service() {
  local dest="${WORK_DIR}/payments-service"
  local skeleton="${REPO_ROOT}/examples/templates/new-microservice/skeleton"

  log "Scaffolding ${PAYMENTS_REPO} from golden-path skeleton"
  rm -rf "${dest}"
  cp -a "${skeleton}" "${dest}"

  # Substitute template placeholders for bootstrap output
  find "${dest}" -type f \( -name '*.md' -o -name '*.ts' -o -name '*.json' -o -name '*.yaml' -o -name '*.yml' -o -name '*.mdc' \) -print0 | \
    while IFS= read -r -d '' file; do
      sed -i '' \
        -e 's/\${{ values.name }}/payments-service/g' \
        -e 's/\${{ values.owner }}/group:default\/payments-team/g' \
        -e 's/\${{ values.stack }}/node-ts/g' \
        "${file}" 2>/dev/null || \
      sed -i \
        -e 's/\${{ values.name }}/payments-service/g' \
        -e 's/\${{ values.owner }}/group:default\/payments-team/g' \
        -e 's/\${{ values.stack }}/node-ts/g' \
        "${file}"
    done

  cat > "${dest}/catalog-info.yaml" <<'CATALOG'
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payments-service
  tags:
    - golden-path
    - cursor-ready
spec:
  type: service
  lifecycle: production
  owner: group:default/payments-team
  system: payments
CATALOG

  ensure_project "${PAYMENTS_REPO}"
  push_repo "${PAYMENTS_REPO}" "${dest}" "main"
}

prepare_legacy_checkout() {
  local dest="${WORK_DIR}/legacy-checkout-api"
  local skeleton="${REPO_ROOT}/scripts/skeletons/legacy-checkout-api"

  log "Scaffolding ${LEGACY_REPO} (no AGENTS.md)"
  rm -rf "${dest}"
  cp -a "${skeleton}" "${dest}"

  ensure_project "${LEGACY_REPO}"
  push_repo "${LEGACY_REPO}" "${dest}" "main"
}

prepare_stub_repo() {
  local name="$1"
  local dest="${WORK_DIR}/${name}"

  log "Scaffolding stub ${name}"
  rm -rf "${dest}"
  mkdir -p "${dest}/src"
  cat > "${dest}/package.json" <<JSON
{
  "name": "${name}",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "start": "node src/index.js"
  }
}
JSON
  cat > "${dest}/src/index.js" <<'JS'
const http = require('node:http');
const PORT = Number(process.env.PORT ?? 3000);
http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
}).listen(PORT, () => console.log(`Listening on ${PORT}`));
JS
  cat > "${dest}/catalog-info.yaml" <<CATALOG
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ${name}
spec:
  type: service
  lifecycle: production
  owner: group:default/platform-team
  system: platform
CATALOG

  ensure_project "${name}"
  push_repo "${name}" "${dest}" "main"
}

emit_catalog_local() {
  local out="${REPO_ROOT}/examples/catalog.local.yaml"
  local source="${REPO_ROOT}/examples/acme-catalog.yaml"
  log "Writing ${out} from ${source} with group ${DEMO_GITLAB_GROUP}"

  {
    printf '# Generated by scripts/bootstrap-gitlab-demo.sh — do not commit (gitignored)\n'
    sed "s/__DEMO_GITLAB_GROUP__/${DEMO_GITLAB_GROUP}/g" "${source}"
  } > "${out}"

  # Point the catalog Location shim at the generated file.
  cat > "${REPO_ROOT}/examples/entities.yaml" <<YAML
---
# Thin shim — enterprise catalog lives in acme-catalog.yaml (template) or
# catalog.local.yaml (generated by bootstrap with resolved GitLab slugs).
apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: acme-catalog
spec:
  type: file
  target: ./catalog.local.yaml
YAML
}

# --- main ---
log "Validating GitLab token"
gitlab_api GET "/user" >/dev/null

mkdir -p "${WORK_DIR}"

prepare_nopcommerce
prepare_payments_service
prepare_legacy_checkout
prepare_stub_repo "${AUTH_REPO}"
prepare_stub_repo "${NOTIFICATION_REPO}"
emit_catalog_local

printf '\n'
printf 'Bootstrap complete for group: %s\n' "${DEMO_GITLAB_GROUP}"
printf '%-25s %s\n' 'Repository' 'GitLab slug'
printf '%-25s %s\n' '-------------------------' '----------------------------------------'
printf '%-25s %s/%s\n' 'nopcommerce-platform' "${DEMO_GITLAB_GROUP}" "${NOPCOMMERCE_REPO}"
printf '%-25s %s/%s\n' 'payments-service' "${DEMO_GITLAB_GROUP}" "${PAYMENTS_REPO}"
printf '%-25s %s/%s\n' 'legacy-checkout-api' "${DEMO_GITLAB_GROUP}" "${LEGACY_REPO}"
printf '%-25s %s/%s\n' 'auth-service (stub)' "${DEMO_GITLAB_GROUP}" "${AUTH_REPO}"
printf '%-25s %s/%s\n' 'notification-service (stub)' "${DEMO_GITLAB_GROUP}" "${NOTIFICATION_REPO}"
printf '\nNext: yarn start\n'
