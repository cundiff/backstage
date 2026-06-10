#!/usr/bin/env bash
# Pre-flight checks for the enterprise Backstage demo.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
FAILURES=0

warn() {
  printf '[preflight] WARN: %s\n' "$*" >&2
}

fail() {
  printf '[preflight] FAIL: %s\n' "$*" >&2
  FAILURES=$((FAILURES + 1))
}

pass() {
  printf '[preflight] OK: %s\n' "$*"
}

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    fail "Environment variable ${name} is not set"
  else
    pass "${name} is set"
  fi
}

# Load .env if present
if [[ -f "${REPO_ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/.env"
  set +a
fi

printf '[preflight] Checking required environment variables\n'
require_env GITLAB_TOKEN
require_env CURSOR_API_KEY
require_env MCP_TOKEN
require_env DEMO_GITLAB_GROUP
require_env JIRA_TOKEN
require_env JIRA_EMAIL

if [[ -f "${REPO_ROOT}/examples/catalog.local.yaml" ]]; then
  pass "examples/catalog.local.yaml exists"
else
  warn "examples/catalog.local.yaml missing — run ./scripts/bootstrap-gitlab-demo.sh"
fi

printf '[preflight] Checking Backstage health\n'
if curl -sf http://localhost:3000 >/dev/null 2>&1; then
  pass "Frontend reachable at http://localhost:3000"
else
  fail "Frontend not reachable at http://localhost:3000 (is yarn start running?)"
fi

if curl -sf http://localhost:7007/.well-known/backstage/health/v1/readiness >/dev/null 2>&1; then
  pass "Backend readiness OK"
else
  fail "Backend readiness check failed at http://localhost:7007"
fi

printf '[preflight] Checking MCP catalog endpoint\n'
MCP_INIT=$(curl -sf -X POST http://localhost:7007/api/mcp-actions/v1/catalog \
  -H "Authorization: Bearer ${MCP_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"preflight","version":"1.0.0"}}}' \
  2>/dev/null || true)

if [[ -n "${MCP_INIT}" ]]; then
  pass "MCP catalog initialize responded"
else
  fail "MCP catalog initialize failed (check MCP_TOKEN and backend.auth.externalAccess)"
fi

printf '[preflight] Checking GitLab projects\n'
encode_path() {
  python3 -c 'import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$1"
}

for repo in nopcommerce payments-service legacy-checkout-api; do
  encoded="$(encode_path "${DEMO_GITLAB_GROUP}/${repo}")"
  if curl -sf -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
    "https://gitlab.com/api/v4/projects/${encoded}" >/dev/null 2>&1; then
    pass "GitLab project ${DEMO_GITLAB_GROUP}/${repo} reachable"
  else
    fail "GitLab project ${DEMO_GITLAB_GROUP}/${repo} not found or token lacks access"
  fi
done

printf '[preflight] Checking Jira project NOP\n'
if curl -sf -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  "https://builders180.atlassian.net/rest/api/3/project/NOP" >/dev/null 2>&1; then
  pass "Jira project NOP reachable"
else
  fail "Jira project NOP not reachable (check JIRA_EMAIL and JIRA_TOKEN)"
fi

if [[ "${FAILURES}" -gt 0 ]]; then
  printf '\n[preflight] %d check(s) failed\n' "${FAILURES}"
  exit 1
fi

printf '\n[preflight] All checks passed\n'
