#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/render.mjs "${1:-final}"
