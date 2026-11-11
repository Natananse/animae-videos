#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -n "${PYTHON:-}" ]]; then
  interpreter="$PYTHON"
elif [[ -x /home/natnael/myenv/bin/python ]]; then
  interpreter=/home/natnael/myenv/bin/python
else
  interpreter=python3
fi
exec "$interpreter" scripts/make_voice.py "$@"
