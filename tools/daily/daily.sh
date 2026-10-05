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
# one clip. Five escalations in a row end the ingest: that is a quota
# wall or a systemic failure, and carrying on would park the whole queue in
# needs-claude for a person.
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
clips() { node "$ENGINE/bin/clips" "$@"; }
stamp() { date -u +%FT%TZ; }
cd "$DATA" || exit 1

ARCHIVE=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["clips"]["archive"])' syntopica.config.json)

echo "$(stamp) harvest"
timeout --kill-after=30s 7200 clips harvest < /dev/null
echo "$(stamp) harvest exit=$?"
echo "$(stamp) promote"
timeout --kill-after=30s 3600 clips harvest --promote < /dev/null
echo "$(stamp) promote exit=$?"

new=$(git ls-files --others --exclude-standard -- "$ARCHIVE/clips/pending")
if [ -n "$new" ]; then
  printf '%s\n' "$new" | git add --pathspec-from-file=-
  git commit -q -m "chore(clips): capture the $(date +%F) newsletter harvest" &&
    git pull -q --rebase --autostash && git push -q
  echo "$(stamp) committed $(printf '%s\n' "$new" | grep -c metadata.json) new clips"
fi

# Oldest capture first. `clips status --items` names clips by an opaque id that
# `--clip` does not accept, so the ULIDs come from the store itself.
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
streak=0
count=0
for id in $pending; do
  [ "$count" -ge "$MAX" ] && break
  count=$((count + 1))
  out=$(timeout --kill-after=30s 7200 clips ingest --auto-review --clip "$id" 2>&1 < /dev/null)
  code=$?
  outcome=$(printf '%s\n' "$out" | sed -n "s/^$id: //p" | tail -1)
  echo "$(stamp) $id exit=$code outcome=${outcome:-none}"
  if [ "$outcome" = "needs-claude" ] || [ "$code" = 124 ]; then
    streak=$((streak + 1))
  else
    streak=0
  fi
  if [ "$streak" -ge 5 ]; then
    echo "$(stamp) stop: five escalations in a row"
    exit 3
  fi
done
echo "$(stamp) done: $count clips attempted"
