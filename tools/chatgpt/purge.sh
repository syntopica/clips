#!/usr/bin/env bash
# Delete the exported conversations from the ChatGPT account, in the pinned tab.
#
# Irreversible: the product has no undo for a deleted conversation, and this
# account is a Business workspace that cannot export, so the markdown under
# sources/chatgpt/ becomes the only copy the moment this finishes. It therefore
# refuses to run without CHATGPT_PURGE_CONFIRM set to the exact phrase below,
# and the queue is built by purge_queue.py from ids that have both a rendered
# `.md` and a parseable `raw/*.json` on disk. Nothing else is reachable.
#
# Usage:  CHATGPT_PURGE_CONFIRM=yes-delete-my-conversations tools/chatgpt/purge.sh [--limit N]
# Env:    CHATGPT_PURGE_PACE ms (default 1000), CHATGPT_PURGE_WORKERS (default 4)

set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
OUT="$ROOT/sources/chatgpt"
PACE="${CHATGPT_PURGE_PACE:-1000}"
WORKERS="${CHATGPT_PURGE_WORKERS:-4}"
LIMIT=0

while [ $# -gt 0 ]; do
  case "$1" in
    --limit)
      LIMIT="${2:?--limit needs a number}"
      shift 2
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [ "${CHATGPT_PURGE_CONFIRM:-}" != "yes-delete-my-conversations" ]; then
  echo "refusing: set CHATGPT_PURGE_CONFIRM=yes-delete-my-conversations" >&2
  echo "this deletes conversations from the account and cannot be undone" >&2
  exit 1
fi

command -v chrome-cli >/dev/null 2>&1 || {
  echo "chrome-cli not installed (brew install chrome-cli)" >&2
  exit 1
}

# The tab is pinned by id and never rediscovered, for the reason written down in
# run.sh: "the active tab of the frontmost window" is a moving target on a
# browser holding hundreds of tabs, and it has already cost this lane an hour.
# Here it would cost more than an hour - a script that talks to whatever tab is
# in front is not a script you point at a delete endpoint - so an unusable
# TABFILE is fatal rather than a cue to open a window.
TABFILE="${CHATGPT_TAB_FILE:-$HOME/.brain-chatgpt-tab}"
TAB="$(cat "$TABFILE" 2>/dev/null || true)"
[ -n "$TAB" ] || {
  echo "no pinned tab in $TABFILE - run tools/chatgpt/run.sh first" >&2
  exit 1
}
case "$(timeout 15 chrome-cli info -t "$TAB" 2>/dev/null | sed -n 's/^Url: //p')" in
  https://chatgpt.com/*) ;;
  *)
    echo "pinned tab $TAB is not on chatgpt.com" >&2
    exit 1
    ;;
esac
echo "pinned tab $TAB"

cg() { timeout 60 chrome-cli execute "$1" -t "$TAB" 2>/dev/null; }

STATE="$(cg 'String(window.__cgState)' || true)"
case "$STATE" in
  fetching* | listing* | starting*)
    echo "a collector is still running in this tab: $STATE" >&2
    exit 1
    ;;
esac
PURGE_STATE="$(cg 'String(window.__cgPurgeState)' || true)"
case "$PURGE_STATE" in
  purging* | starting*)
    echo "a purge is already running in this tab: $PURGE_STATE" >&2
    exit 1
    ;;
esac

python3 "$DIR/purge_queue.py" "$OUT" > "${TMPDIR:-/tmp}/cg-purge-queue.txt"

cg "window.__cgPurgeQueue=[]; window.__cgPurgePace=$PACE; window.__cgPurgeWorkers=$WORKERS; String(0)" >/dev/null
while IFS= read -r slice; do
  cg "window.__cgPurgeQueue.push(...$slice); String(window.__cgPurgeQueue.length)" >/dev/null
done < "${TMPDIR:-/tmp}/cg-purge-queue.txt"

if [ "$LIMIT" -gt 0 ]; then
  cg "window.__cgPurgeQueue=window.__cgPurgeQueue.slice(0,$LIMIT); String(window.__cgPurgeQueue.length)" >/dev/null
fi

QUEUED="$(cg 'String(window.__cgPurgeQueue.length)')"
echo "queued $QUEUED conversations for deletion"

# `String(0)` is load-bearing: chrome-cli hands the expression's value back over
# an AppleEvent and calls `UTF8String` on it, so an async IIFE - which evaluates
# to a Promise - crashes the binary with `unrecognized selector`. The script
# still runs, but the crash is a non-zero exit that `set -e` reads as a failed
# launch. Ending on a string keeps the launch reportable.
cg "$(node "$DIR/purge.js")
String(0)" >/dev/null
echo "purge started (workers=$WORKERS pace=${PACE}ms)"
echo "poll with: chrome-cli execute 'String(window.__cgPurgeState)' -t $TAB"
