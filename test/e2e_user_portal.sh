#!/usr/bin/env bash
# E2E smoke test — parcours utilisateur portail (API)
set -euo pipefail

BASE="${BASE:-https://mon.essensys.fr}"
EMAIL="${EMAIL:-vwaller@caramail.com}"
JWT_SECRET="${JWT_SECRET:-changeme_random_secret}"
BACKEND_DIR="${BACKEND_DIR:-../../essensys-support-site/backend}"

cd "$(dirname "$0")/.."
GENJWT="$(dirname "$0")/genjwt.go"
TOKEN=$(cd "$BACKEND_DIR" && JWT_SECRET="$JWT_SECRET" go run "$GENJWT" "$EMAIL")
AUTH=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

echo "=== E2E portail $EMAIL @ $BASE ==="

curl -sf "$BASE/api/portal/health" >/dev/null && echo "[OK] health"

STATUS=$(curl -sf "${AUTH[@]}" "$BASE/api/portal/link-request/status")
echo "[OK] link status: $STATUS"
echo "$STATUS" | grep -q '"portal_access":true' || { echo "[FAIL] portal_access=false"; exit 1; }

GW=$(curl -sf "${AUTH[@]}" "$BASE/api/portal/gateway/status")
echo "[OK] gateway: $GW"

INJ=$(curl -sf -X POST "${AUTH[@]}" "$BASE/api/portal/inject" -d '{"k":619,"v":"1"}')
echo "[OK] inject: ${INJ:0:120}..."

curl -sf -o /dev/null "$BASE/portal/" && echo "[OK] portal SPA HTTP 200"
echo "=== Succès ==="
