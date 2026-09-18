#!/bin/zsh
# Judge each batch of captured-but-uncited clips on its own text.
#
# Usage: run-pass.sh <work-directory>
#
# One codex run per batch, resumable: a batch whose verdict file is already
# non-empty is skipped, so a rerun after a failure costs only what failed.
#
# `codex exec` takes no approval flag - `-a/--ask-for-approval` was removed and
# passing it fails the run with `unexpected argument '-a' found` before the
# model is ever reached. `-s read-only` is the control that remains, and
# `--skip-git-repo-check` is needed because the work directory is not a
# repository. gpt-5.5 at low reasoning: high volume, low difficulty.
set -u
work="$1"
here="${0:A:h}"
mkdir -p "$work/out"

# Whose interests the judge weighs is the instance's `newsletter.triageProfile`,
# the same paragraph the first triage pass is handed. The local layer wins over
# the tracked file, as it does for the engine's own loader.
data="${SYNTOPICA_DATA:-$PWD}"
profile="$(jq -rs 'map(.newsletter.triageProfile // empty) | last // ""' \
  "$data/syntopica.config.json" \
  $([ -f "$data/syntopica.local.json" ] && echo "$data/syntopica.local.json"))"
[ -n "$profile" ] || profile="No interest profile is configured. Judge each article on general technical usefulness to a working software developer."
instructions="$(cat "$here/prompt.txt")"
instructions="${instructions//\{\{PROFILE\}\}/$profile}"

for batch in "$work"/batches/*.txt; do
  name="${batch:t:r}"
  verdicts="$work/out/$name.json"
  [ -s "$verdicts" ] && { echo "skip $name (done)"; continue; }
  prompt="$instructions

INPUT:
$(cat "$batch")"

  echo "running $name"
  codex exec "$prompt" < /dev/null \
    -C "$work" -m gpt-5.5 -c model_reasoning_effort=low \
    --output-schema "$here/verdict-schema.json" -o "$verdicts" \
    -s read-only --skip-git-repo-check >> "$work/out/$name.log" 2>&1
  echo "done $name exit=$?"
done
echo "ALL DONE"
