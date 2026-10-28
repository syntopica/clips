# TODO

> Consolidated from the accessible agent conversation history of this project.
> Last reviewed: 2026-10-12. History coverage: Partial. Not re-audited during
> the 2026-10-12 format migration.
>
> States: `[ ]` pending · `[~]` partial or unverified · `[!]` blocked · `[x]`
> verified complete · `[-]` obsolete or superseded. Closed work moves to
> `TODO_LOG.md`.

- [ ] Kept ingest worktrees fill the disk. Every clip that ends rejected or
      escalated keeps its `brain-ingest-*/<clip_id>` worktree, which is a full
      checkout of the instance (2.4 GiB, half `clips/` and half `brain/`) to
      keep a 1-3 file draft. The 2026-10-28 daily run (MacBook, started 06:33)
      kept 14 of them by 11:27, about 34 GiB, while free space fell from 58 to
      28 GiB; the 11 empty `brain-ingest-*` parents are clips that published
      cleanly. Evidence: `git -C ~/p/wiki worktree list | grep -c brain-ingest`
      gives 14, every branch is 0 commits ahead of `origin/main` with 1-3 dirty
      files. Smallest next step: keep the draft, not the checkout - save the
      worktree's diff and untracked files next to the clip (or in the rejection
      record) and remove the worktree, or cut it as a sparse checkout of the
      pages synthesis touches; until then, a disk-free guard in
      `tools/daily/daily.sh` that stops before the next clip.

- [~] Worker-ladder synthesis refusal rates. Measured 2026-10-11 over the
  instance's needs-claude bucket (198 clips from the daily runs of
  2026-10-05..11; 1444 processed, 588 pending): MODEL_ESCALATED 111 (34 of them
  the selection pass saying a new page would be needed, 4 local-window
  overflows, about 10 refused page writes such as a `link_from` naming a page
  the model was not shown), CONTENT_VALIDATION_FAILED 68 (44 a rewrite that
  drops an existing section, 10 missing frontmatter, 3 too many changed lines),
  AUTO_REVIEWER_ESCALATED 16, INDEX_MAP_FAILED 3. Landed: one writing retry told
  which section it dropped (`480c77d`) and a selection prompt that no longer
  escalates for a missing page (`6ee5ac3`). Smallest next step: after a week of
  daily runs, recount the same codes from clips escalated after 2026-10-11 and
  compare.

- [~] The 2026-10-09 daily run logged two clips and then nothing: no clip line,
  no `done:` and no `stop:`, although each clip is bounded by a 2 h timeout. The
  machine booted again around 19:45Z that day, and `log show` no longer holds
  that window. Guards landed 2026-10-11 (see `TODO_LOG.md`): the run now logs
  its boot time, a `<id> start` line before each clip and a
  `stop: ... during <step>` on any exit or signal. Smallest next step: on the
  next run that ends without `done:`, read the last line of
  `~/p/.clips-daily.launchd.log` (a `<id> start` with nothing after it is a
  SIGKILL or power loss; compare the `booted` time of the next run) and close
  this with the cause.

- [~] Worker synthesis on qwen3.6:35b does not yet produce a publishable page.
  Three runs of the TaxHacker clip, 2026-09-30: once the selection named pages
  without `.md` (now resolved leniently); twice the writing pass created a new
  page and returned no page linking to it, so the validator refused it
  (`no other page links to it`), even with the rule stated twice in the prompt.
  One selection also invented a relation (the tool "developed for InteliFactu").
  Fix landed the same day: each new page names a shown page in `link_from`, the
  engine inserts the `[[link]]` (into a Related / See also list, else a
  `See also:` line ahead of `## Contested`), and an answer whose new page names
  no shown page is refused whole; the writing rules also forbid stating a
  connection neither the clip nor a shown page states. Unverified on the model:
  the rerun on the real `clips.synthesis` queue (declared in wiki `80bb0d74`)
  sat queued 36 min without being leased, while the local Ollama answered 500
  after 4-17 min and swap stood at 23.6 of 24.5 GB. Next step: rerun `smoke` on
  the same clip three times once the worker drains, and close this only if the
  validator accepts the results.

## Security

## Reproducibility
