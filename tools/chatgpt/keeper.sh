#!/usr/bin/env bash
# Keep the ChatGPT export going unattended, and preserve whatever it produces.
#
# Two capabilities, deliberately in one script, because only one of them can be
# blocked. Converting parts to markdown and committing them is plain file work
# that runs anywhere. Restarting a dead collector needs `chrome-cli`, which
# needs AppleEvents, which macOS TCC denies to a launchd job - the failure this
# repository already recorded for the X bookmarks LaunchAgent (`Abort trap: 6`,
# no foreground app to raise the Automation prompt against). A process detached
# from an interactive shell keeps the grant; a LaunchAgent does not.
#
# So run it both ways. The detached copy holds the lock and can do everything.
# If it dies, the LaunchAgent copy takes the lock on its next tick and keeps
# converting, committing and pushing - degraded, but nothing already fetched is
# ever stranded in ~/Downloads.
#
# Usage:  tools/chatgpt/keeper.sh
# Env:    KEEPER_INTERVAL seconds (default 300), KEEPER_BATCH files (default 100)

set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
OUT="$ROOT/sources/chatgpt"
INDEX="${CHATGPT_INDEX:-$HOME/Downloads/chatgpt-index.json}"
INTERVAL="${KEEPER_INTERVAL:-300}"
BATCH="${KEEPER_BATCH:-100}"
LOCK="$HOME/.brain-chatgpt-keeper.lock"
LOG="$ROOT/../.brain-chatgpt-keeper.log"
BEAT="$HOME/.brain-chatgpt-keeper.beat"

say() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$LOG"; }

# Atomic lock. A stale one - owner gone - is reclaimed rather than obeyed, so a
# killed detached copy does not lock the LaunchAgent out forever.
if ! mkdir "$LOCK" 2>/dev/null; then
  owner=$(cat "$LOCK/pid" 2>/dev/null || echo "")
  if [ -n "$owner" ] && kill -0 "$owner" 2>/dev/null; then
    # 75 (EX_TEMPFAIL), not 0. Under the LaunchAgent this is the standby copy
    # finding the detached one alive, and it must be restarted later so it can
    # take over if that one dies - a clean exit would retire it permanently,
    # because KeepAlive here is SuccessfulExit=false.
    exit 75
  fi
  say "reclaiming stale lock from pid ${owner:-unknown}"
  rm -rf "$LOCK"; mkdir "$LOCK" 2>/dev/null || exit 0
fi
echo $$ > "$LOCK/pid"
trap 'rm -rf "$LOCK"' EXIT INT TERM

# Hold the machine awake for as long as this keeper lives, and no longer. A Mac
# kept awake by a job that has finished is a job that outstayed its reason.
caffeinate -dimsu -w $$ &
say "keeper started (pid $$, interval ${INTERVAL}s, batch $BATCH)"

remaining() {
  python3 "$DIR/queue.py" "$INDEX" "$OUT" 2>&1 >/dev/null | sed -n 's/^\([0-9]*\) to fetch.*/\1/p'
}

publish() {
  local new
  # `--untracked-files=all`: git collapses a wholly-untracked directory into
  # a single `?? sources/chatgpt/` line, so the default count says 1 for two
  # thousand new files and the batch threshold never fires.
  new=$(git -C "$ROOT" status --porcelain --untracked-files=all -- sources/chatgpt | grep -c '\.md$' || true)
  [ "${new:-0}" -lt "$1" ] && return 0
  # Explicit paths only. `git add -A` here would sweep whatever another session
  # has dirty into an unattended commit, which is the one thing CLAUDE.md
  # forbids outright.
  git -C "$ROOT" add -- sources/chatgpt || return 0
  git -C "$ROOT" commit -q -m "chatgpt: export $new conversations" \
    -m "Rendered from the account's own conversation trees by tools/chatgpt. Unattended batch; see tools/chatgpt/keeper.sh." || return 0
  say "committed $new conversations"
  if ! git -C "$ROOT" push -q 2>/dev/null; then
    git -C "$ROOT" fetch -q origin
    # Autostash only when nobody else's uncommitted work is in the way of the
    # incoming commits. A stash-and-restore of files the incoming diff does not
    # touch cannot conflict, so it moves nothing; where the sets overlap the
    # rebase is skipped and retried, because another session's work in flight is
    # not this job's to carry. Without this test a dirty tree - the normal state
    # of this repo - stalls every push indefinitely.
    local stash=
    if [ -z "$(comm -12 \
        <(git -C "$ROOT" diff --name-only | sort) \
        <(git -C "$ROOT" diff --name-only HEAD...origin/main | sort))" ]; then
      stash=--autostash
    fi
    if git -C "$ROOT" rebase -q $stash origin/main 2>/dev/null; then
      git -C "$ROOT" push -q 2>/dev/null && say "pushed after rebase" || say "push still refused; will retry"
    else
      git -C "$ROOT" rebase --abort 2>/dev/null
      say "rebase skipped (conflict, or another session is editing an incoming path); commit stays local, will retry"
    fi
  else
    say "pushed"
  fi
}

while true; do
  # Drain before converting: the collector's chunks live in the page until this
  # writes them out, and a tab that dies with an undrained vault loses them.
  #
  # This is why the tick is short (120s) and why shortening it buys nothing else.
  # The collector sleeps its rate-limit cooldown *inside the page* - `cooling
  # 15min WAITING 900000ms` - so a faster tick cannot make it fetch sooner; the
  # binding limit is the account's per-window budget, measured at bursts of
  # ~17-23 conversations followed by a 15-minute wait. What the tick does buy is
  # exposure: an undrained chunk is 10 conversations that exist only in the tab,
  # and re-earning them after a tab death costs the one resource that cannot be
  # bought back. Draining costs no request against OpenAI at all.
  bash "$DIR/drain.sh" "$(dirname "$INDEX")" >> "$LOG" 2>&1
  python3 "$DIR/convert.py" "$(dirname "$INDEX")" >> "$LOG" 2>&1
  left=$(remaining)
  echo "$(date '+%s') remaining=${left:-?}" > "$BEAT"

  if [ "${left:-1}" = "0" ]; then
    publish 1
    say "export complete; nothing left to fetch"
    exit 0
  fi

  publish "$BATCH"

  # Polled against the pinned tab, never the active one: reading the browser's
  # foreground made a live collector look dead every time the operator switched
  # tabs, and the relaunch that followed opened another window instead.
  TAB="$(cat "${CHATGPT_TAB_FILE:-$HOME/.brain-chatgpt-tab}" 2>/dev/null || true)"
  if [ -n "$TAB" ]; then
    state=$(timeout 60 chrome-cli execute 'String(window.__cgState)' -t "$TAB" 2>/dev/null || echo "no-chrome-cli")
  else
    state="no-pinned-tab"
  fi
  case "$state" in
    fetching*|listing*|starting*) : ;;
    *)
      # Attempted even when chrome-cli just failed: run.sh opens Chrome itself
      # if no chatgpt.com tab is up, and the attempt's own failure is the
      # honest record of whether this copy has the Automation grant.
      say "collector not running (state=$state); relaunching for $left conversations"
      if CHATGPT_WORKERS=1 CHATGPT_PACE=4000 bash "$DIR/run.sh" >> "$LOG" 2>&1; then
        say "relaunched"
      else
        say "relaunch failed - most likely TCC denying AppleEvents to this copy"
      fi
      ;;
  esac

  # Backgrounded and waited on, not called directly: bash defers a trap until
  # the running foreground command returns, so a plain `sleep 300` swallows
  # SIGTERM for up to five minutes and the lock outlives the request to stop.
  sleep "$INTERVAL" &
  wait $!
done
