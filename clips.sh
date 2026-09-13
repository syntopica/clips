#!/usr/bin/env bash
set -euo pipefail
exec pnpm --dir "$(dirname "$0")" clips "$@"
