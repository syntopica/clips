#!/usr/bin/env bash
# One unattended clips day: harvest newsletters, promote what the triage put in
# its Ingest bucket, commit the new captures, then ingest a bounded number of
# waiting clips behind the automatic review gate.
#
# Promotion writes clips without committing them, and ingest refuses a clip
# store whose main differs from origin/main, so the commit and push between the
# two steps is what lets the same run ingest what it captured.
#
# Every step is bounded by `timeout`, each clip separately (two hours: a clip is
# three worker jobs, each allowed 45 minutes), so one stuck model call costs
# one clip. An exhausted transport (exit 4) ends the ingest at once, and five
# escalations in a row end it: that is a quota wall or a systemic failure, and
# carrying on would park the whole queue in needs-claude for a person.
#
# Usage:  tools/daily/daily.sh
# Env:    SYNTOPICA_DATA instance directory (required)
#         CLIPS_DAILY_MAX clips to ingest per run (default 40)

set -uo pipefail
DATA="${SYNTOPICA_DATA:-}"
if [ -z "$DATA" ] || [ ! -f "$DATA/syntopica.config.json" ]; then
  echo "daily: SYNTOPICA_DATA must name a directory containing syntopica.config.json" >&2
  exit 78
fi
MAX="${CLIPS_DAILY_MAX:-40}"
# Synthesis and review both go to the worker, whose queue ladder picks the
# model (owner decision 2026-10-05): agy first, then OpenRouter, then the
# local model. The ladder rests a model at its quota wall and falls through,
# so a spent agy quota no longer stops the run.
export CLIPS_SYNTHESIS_RUNNER="${CLIPS_SYNTHESIS_RUNNER:-worker}"
export CLIPS_REVIEW_RUNNER="${CLIPS_REVIEW_RUNNER:-worker}"
ENGINE="$(cd "$(dirname "$0")/../.." && pwd)"
# An array, not a function: `timeout` executes a program, so a `clips()`
# function was never called and every step ran whichever `clips` came first on
# PATH - this checkout only by coincidence, and `command not found` elsewhere.
CLIPS=(node "$ENGINE/bin/clips")
stamp() { date -u +%FT%TZ; }
cd "$DATA" || exit 1

# The 2026-10-09 run logged two clips and then nothing - no clip line, no
# `done:`, no `stop:` - and the machine had rebooted by evening. So every way
# out now leaves a line: a signal names itself, any other exit names its code
# and the step it was in, and each clip logs before it starts, so even a
# SIGKILL or a power loss leaves the clip it died on as the last line. Bash runs
# a trap only once the foreground child returns, so a signal to the process
# group (shutdown, `launchctl kill`) is logged as soon as the step dies.
step="start"
finished=0
on_exit() {
  code=$?
  [ "$finished" = 1 ] || echo "$(stamp) stop: exited with code $code during $step"
}
on_signal() {
  echo "$(stamp) stop: received SIG$1 during $step"
  finished=1
  exit $((128 + $2))
}
trap on_exit EXIT
trap 'on_signal TERM 15' TERM
trap 'on_signal HUP 1' HUP
trap 'on_signal INT 2' INT
echo "$(stamp) start: pid $$, booted $(sysctl -n kern.boottime 2>/dev/null | sed -n 's/.*} //p')"

ARCHIVE=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["clips"]["archive"])' syntopica.config.json)

step="harvest"
echo "$(stamp) harvest"
# The code is read before the next line runs: `$(stamp)` inside the echo
# resets `$?`, which logged every harvest and promote as exit=0 until
# 2026-10-11, including promote runs that captured nothing.
timeout --kill-after=30s 7200 "${CLIPS[@]}" harvest < /dev/null
code=$?
echo "$(stamp) harvest exit=$code"
step="promote"
echo "$(stamp) promote"
timeout --kill-after=30s 3600 "${CLIPS[@]}" harvest --promote < /dev/null
code=$?
echo "$(stamp) promote exit=$code"

new=$(git ls-files --others --exclude-standard -- "$ARCHIVE/clips/pending")
if [ -n "$new" ]; then
  step="commit"
  printf '%s\n' "$new" | git add --pathspec-from-file=-
  git commit -q -m "chore(clips): capture the $(date +%F) newsletter harvest" &&
    git pull -q --rebase --autostash && git push -q
  echo "$(stamp) committed $(printf '%s\n' "$new" | grep -c metadata.json) new clips"
fi

# Oldest capture first. `clips status --items` names clips by an opaque id that
# `--clip` does not accept, so the ULIDs come from the store itself.
step="list pending"
pending=$(python3 - "$ARCHIVE/clips/pending" <<'PY'
import json, pathlib, sys
rows = []
for path in pathlib.Path(sys.argv[1]).rglob("metadata.json"):
    meta = json.loads(path.read_text(encoding="utf-8"))
    rows.append((meta.get("clipped_at") or "", meta["clip_id"]))
for _, clip_id in sorted(rows):
    print(clip_id)
PY
)
echo "$(stamp) pending: $(printf '%s\n' "$pending" | grep -c .) clips, at most $MAX this run"
streak=0
count=0
for id in $pending; do
  [ "$count" -ge "$MAX" ] && break
  count=$((count + 1))
  step="ingest $id"
  echo "$(stamp) $id start"
  out=$(timeout --kill-after=30s 7200 "${CLIPS[@]}" ingest --auto-review --clip "$id" 2>&1 < /dev/null)
  code=$?
  outcome=$(printf '%s\n' "$out" | sed -n "s/^$id: //p" | tail -1)
  echo "$(stamp) $id exit=$code outcome=${outcome:-none}"
  # Exit 4: the worker ladder fell to a local model too small for the prompt,
  # so every later clip would burn its time and fail the same way. The clip is
  # still pending; tomorrow's run starts with it.
  if [ "$code" = 4 ]; then
    echo "$(stamp) stop: the synthesis transport is exhausted"
    finished=1
    exit 4
  fi
  if [ "$outcome" = "needs-claude" ] || [ "$code" = 124 ]; then
    streak=$((streak + 1))
  else
    streak=0
  fi
  if [ "$streak" -ge 5 ]; then
    echo "$(stamp) stop: five escalations in a row"
    finished=1
    exit 3
  fi
done
finished=1
echo "$(stamp) done: $count clips attempted"
