# TODO

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

- [!] The daily job cannot read Chrome's Medium cookies under launchd: "EPERM:
  operation not permitted, copyfile .../Chrome/Default/Cookies" every day since
  2026-10-05. Two effects: the medium-list collector is skipped, and
  `clips harvest --promote` reads the cookie jar before any article, so every
  promote since 2026-10-05 captured nothing (its exit 1 was logged as `exit=0`
  until `705547f`). Blocked on a human GUI grant: System Settings > Privacy &
  Security > Full Disk Access > + > `/bin/bash` (the plist's
  `ProgramArguments[0]`, which launchd most likely holds responsible), or move
  the job to a signed helper and grant that. Then check the next `promote exit=`
  line in `~/p/.clips-daily.launchd.log`.

- [!] Instance repairs in `~/p/wiki` that this engine repository may not make
  (2026-10-11, all read-only observations): 1. Seven kept `ingest/<id>` branches
  and worktrees (01KYSGC20YE4BMTR04CGWYQH4F, 01KYSGC20YET3NNJ300ZYM07WC,
  01KYSGC20YGPHY79P4AHFP3255, 01KYSGC20YGWRSTKVWX1V2JZVZ,
  01KYSGC20YH4P9Z1NQDAX39MZ6, 01KYSGC20YH7B36RNBTBK9BBG5,
  01KYSGC20YHBWGVX6EYA2YVWRZ); E4BM's worktree is `locked`, so the daily run
  reports it `stopped` every morning. Save each diff if it matters, then run the
  clear command `clips ingest` prints for it. 2. 01KYSGC20YH4P9Z1NQDAX39MZ6,
  01KYSGC20YH7B36RNBTBK9BBG5 and 01KYSGC20YHBWGVX6EYA2YVWRZ parked as
  INDEX_MAP_FAILED (fixed in `bf4166c`); after step 1,
  `clips requeue --clip <id>` for each. 3. 01KYSGC20YGHQTSEX81YT61J3C:
  `clips/clips/pending/.../state.json` is an uncommitted rewrite claiming
  needs-claude since 2026-10-07 (the move-before-state fix is `632147f`).
  Restore it with
  `git -C ~/p/wiki checkout -- clips/clips/pending/2026/07/2026-07-30-medium-com-10-js-tricks-senior-devs-don-t-tell-you-01kysgc2/state.json`.

- [ ] The 2026-10-09 daily run logged two clips and then nothing: no clip line,
      no `done:` and no `stop:`, although each clip is bounded by a 2 h timeout.
      The machine booted again around 19:45Z that day, and `log show` no longer
      holds that window. Smallest next step: if it recurs, read
      `log show --predicate 'eventMessage CONTAINS "clips-daily"'` the same day,
      and check whether the host slept (timeout counts monotonic time).

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
