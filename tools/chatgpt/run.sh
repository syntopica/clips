#!/usr/bin/env bash
# Start (or resume) the in-page ChatGPT collection in the logged-in tab.
#
# Resume state is the export itself: every conversation already rendered under
# sources/chatgpt/ carries its `conversation_id:` in frontmatter, and `queue.py`
# subtracts those from the saved index. So the recovery from a dead tab, a
# closed browser or an OpenAI rate-limit window is always the same: convert
# whatever parts landed, then run this again. Nothing is fetched twice.
#
# The queue is injected rather than re-listed. Listing costs 21 requests against
# the same rate-limited endpoint the fetch loop needs, and on a resume that
# budget is better spent on conversations.
#
# Pace deliberately: OpenAI rate-limits this endpoint hard - four workers
# earned 23 x 429 in five conversations on 2026-08-22 - so one worker with a
# gap between requests is both kinder and, measured, no slower.
#
# Usage:  tools/chatgpt/run.sh [chrome-profile-directory]
# Env:    CHATGPT_WORKERS (default 1), CHATGPT_PACE ms (default 1500),
#         CHATGPT_INDEX (default ~/Downloads/chatgpt-index.json)

set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
# After the split, an engine-relative sources path found nothing and Git still
# reported success. The instance must supply its data directory and sources path.
DATA="${SYNTOPICA_DATA:-}"
if [ -z "$DATA" ] || [ ! -d "$DATA" ] || [ ! -f "$DATA/syntopica.config.json" ]; then
  echo "run: SYNTOPICA_DATA must name a directory containing syntopica.config.json" >&2
  exit 78
fi
if ! SOURCES=$(python3 - "$DATA/syntopica.config.json" <<'PY'
import json
import sys

try:
    with open(sys.argv[1], encoding="utf-8") as config_file:
        sources = json.load(config_file)["brain"]["sources"]
    if not isinstance(sources, str) or not sources.strip():
        raise ValueError("brain.sources must be a non-empty string")
except (OSError, ValueError, KeyError, TypeError):
    print("run: SYNTOPICA_DATA/syntopica.config.json must define brain.sources as a non-empty string in valid JSON", file=sys.stderr)
    sys.exit(78)
print(sources)
PY
); then
  exit 78
fi
CHATGPT_SOURCES="$SOURCES/chatgpt"
OUT="$DATA/$CHATGPT_SOURCES"
PROFILE="${1:-${CHATGPT_CHROME_PROFILE:-Profile 1}}"
INDEX="${CHATGPT_INDEX:-$HOME/Downloads/chatgpt-index.json}"
WORKERS="${CHATGPT_WORKERS:-1}"
PACE="${CHATGPT_PACE:-4000}"

command -v chrome-cli >/dev/null 2>&1 || {
  echo "chrome-cli not installed (brew install chrome-cli)" >&2
  exit 1
}

# Pin the tab by id and never speak to "the active tab" again.
#
# Every chrome-cli call here used to take its default target: the active tab of
# the frontmost window. That is a moving target on a browser holding hundreds of
# tabs, and on 2026-08-25 it stalled the export for an hour - the active tab was
# AliExpress, so `window.__cgState` read `undefined`, the keeper concluded the
# collector had died, and each relaunch opened *another* chatgpt.com window
# while the queue stayed frozen at 624. Four relaunches, nothing fetched. This
# is the same default that produced the hollow X scrape, so it is now written
# down in the one place that can enforce it.
#
# The id is resolved once and remembered, because rediscovering it means an
# `info` call per tab and there were 640 of them.
TABFILE="${CHATGPT_TAB_FILE:-$HOME/.brain-chatgpt-tab}"

tab_url() { timeout 15 chrome-cli info -t "$1" 2>/dev/null | sed -n 's/^Url: //p'; }

TAB=""
if [ -f "$TABFILE" ]; then
  candidate="$(cat "$TABFILE" 2>/dev/null || true)"
  case "$(tab_url "$candidate")" in
    https://chatgpt.com/*) TAB="$candidate" ;;
  esac
fi

if [ -z "$TAB" ]; then
  open -na "Google Chrome" --args --profile-directory="$PROFILE" "https://chatgpt.com/"
  sleep 8
  # Safe to read the active tab here and only here: the window was just opened,
  # so it is the frontmost one by construction.
  TAB="$(timeout 15 chrome-cli info 2>/dev/null | sed -n 's/^Id: //p')"
  case "$(tab_url "$TAB")" in
    https://chatgpt.com/*) printf '%s\n' "$TAB" > "$TABFILE" ;;
    *)
      echo "could not open and pin a chatgpt.com tab" >&2
      exit 1
      ;;
  esac
fi
echo "pinned tab $TAB"

# Timed out rather than awaited: a tab Chrome has discarded for memory answers
# an AppleEvent never, and an unbounded wait there hangs the keeper instead of
# reporting a dead tab it could relaunch.
cg() { timeout 60 chrome-cli execute "$1" -t "$TAB" 2>/dev/null; }

# A second collector in the same tab would fetch everything twice and interleave
# two chunk counters onto one filename series. Refuse instead.
STATE="$(cg 'String(window.__cgState)' || true)"
case "$STATE" in
  fetching*|listing*|starting*)
    echo "a collector is already running in this tab: $STATE" >&2
    echo "reload the tab first if you mean to restart it" >&2
    exit 1
    ;;
esac

mkdir -p "$OUT"
cg "window.__cgQueue=[]; window.__cgWorkers=$WORKERS; window.__cgPace=$PACE; String(0)" >/dev/null

if [ -f "$INDEX" ]; then
  python3 "$DIR/queue.py" "$INDEX" "$OUT" > "${TMPDIR:-/tmp}/cg-queue.txt"
  while IFS= read -r slice; do
    cg "window.__cgQueue.push(...$slice); String(window.__cgQueue.length)" >/dev/null
  done < "${TMPDIR:-/tmp}/cg-queue.txt"
  echo "queue: $(cg 'String(window.__cgQueue.length)') conversations"
else
  echo "no $INDEX yet - cold start, the collector lists first"
fi

cg "$(node "$DIR/collect.js")"
echo "collector started (workers=$WORKERS pace=${PACE}ms)"
echo "poll with: chrome-cli execute 'String(window.__cgState)' -t $TAB"
