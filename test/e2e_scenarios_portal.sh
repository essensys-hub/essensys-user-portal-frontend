#!/usr/bin/env bash
# E2E portail — API scénarios (cloud)
set -euo pipefail

BASE="${BASE:-https://mon.essensys.fr}"
EMAIL="${EMAIL:-}"
JWT_SECRET="${JWT_SECRET:-}"
BACKEND_DIR="${BACKEND_DIR:-../../essensys-user-portal-backend}"

if [[ -z "$EMAIL" || -z "$JWT_SECRET" ]]; then
  echo "Usage: EMAIL=user@example.com JWT_SECRET=... $0"
  exit 1
fi

cd "$(dirname "$0")/.."
GENJWT="$(dirname "$0")/genjwt.go"
TOKEN=$(cd "$BACKEND_DIR" && JWT_SECRET="$JWT_SECRET" go run "$GENJWT" "$EMAIL")
AUTH=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

echo "=== E2E portail scénarios @ $BASE ==="

curl -sf "${AUTH[@]}" "$BASE/api/portal/gateway/status" >/dev/null && echo "[OK] gateway status"

LIST=$(curl -sf "${AUTH[@]}" "$BASE/api/portal/scenarios")
echo "$LIST" | grep -q '"slots"' || { echo "[FAIL] list"; exit 1; }
echo "[OK] GET /api/portal/scenarios"

curl -sf "${AUTH[@]}" "$BASE/api/portal/scenarios/2" | grep -q '"slot_number"' && echo "[OK] GET slot 2"

BM=$(curl -sf "${AUTH[@]}" "$BASE/api/portal/scenarios/meta/bitmasks")
echo "$BM" | grep -q 'light' && echo "[OK] bitmasks"

echo "=== Succès (launch désactivé si gateway offline) ==="
