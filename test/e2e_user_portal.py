#!/usr/bin/env python3
"""E2E smoke test — parcours utilisateur portail mon.essensys.fr.

Usage:
  JWT_SECRET=changeme_random_secret python3 test/e2e_user_portal.py \\
    --base https://mon.essensys.fr --email vwaller@caramail.com
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import uuid

try:
    import jwt
    import requests
except ImportError:
    print("pip install pyjwt requests", file=sys.stderr)
    sys.exit(1)


def make_token(email: str, role: str, secret: str) -> str:
    payload = {
        "sub": email,
        "role": role,
        "exp": int(time.time()) + 3600,
        "iss": "essensys-backend",
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--base", default="https://mon.essensys.fr")
    p.add_argument("--email", default="vwaller@caramail.com")
    p.add_argument("--role", default="guest_local")
    p.add_argument("--jwt-secret", default="changeme_random_secret")
    p.add_argument("--inject-k", type=int, default=619)
    p.add_argument("--inject-v", default="1")
    args = p.parse_args()

    token = make_token(args.email, args.role, args.jwt_secret)
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    base = args.base.rstrip("/")

    steps: list[tuple[str, bool, str]] = []

    r = requests.get(f"{base}/api/portal/health", timeout=15)
    steps.append(("health", r.status_code == 200, r.text[:80]))

    r = requests.get(f"{base}/portal/", timeout=15)
    steps.append(("portal SPA", r.status_code == 200 and "root" in r.text.lower(), f"HTTP {r.status_code}"))

    r = requests.get(f"{base}/api/portal/link-request/status", headers=headers, timeout=15)
    status_ok = r.status_code == 200
    data = r.json() if status_ok else {}
    portal_access = bool(data.get("portal_access"))
    steps.append(("link status", status_ok, json.dumps(data, ensure_ascii=False)[:200]))

    if not portal_access:
        print("FAIL: portal_access=false — lier gw CM5 (pas essensys-server) + demande approuvée")
        for name, ok, detail in steps:
            print(f"  [{'OK' if ok else 'FAIL'}] {name}: {detail}")
        return 1

    r = requests.get(f"{base}/api/portal/gateway/status", headers=headers, timeout=15)
    gw_ok = r.status_code == 200
    gw_online = r.json().get("online") if gw_ok else False
    steps.append(("gateway online", gw_ok, json.dumps(r.json() if gw_ok else {})))

    guid = str(uuid.uuid4())
    r = requests.post(
        f"{base}/api/portal/inject",
        headers=headers,
        json={"k": args.inject_k, "v": args.inject_v, "guid": guid},
        timeout=15,
    )
    inject_ok = r.status_code == 200
    steps.append(("inject volet", inject_ok, r.text[:200] if inject_ok else f"HTTP {r.status_code} {r.text[:120]}"))

    print(f"E2E portail utilisateur — {args.email} @ {base}\n")
    failed = 0
    for name, ok, detail in steps:
        mark = "OK" if ok else "FAIL"
        if not ok:
            failed += 1
        print(f"  [{mark}] {name}: {detail}")

    if gw_online:
        print("\n  Gateway en ligne — action cloud en file (poll CM5 attendu).")
    else:
        print("\n  WARN: gateway hors ligne — inject OK côté cloud, exécution locale non vérifiée.")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
