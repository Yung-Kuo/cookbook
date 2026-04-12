#!/usr/bin/env bash
# Run from repo root: ./scripts/seed_template_recipes.sh
# Or: bash scripts/seed_template_recipes.sh [--replace-template-images]
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"
exec python manage.py seed_template_recipes "$@"
