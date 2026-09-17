#!/usr/bin/env bash
# Run the CLI from this checkout without moving the caller. `pnpm --dir` sets
# the subprocess directory to the checkout, so instance discovery walked up
# from the engine instead of from the wiki and reported no configuration.
set -euo pipefail
exec "$(cd "$(dirname "$0")" && pwd)/bin/clips" "$@"
