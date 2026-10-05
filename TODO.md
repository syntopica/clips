# TODO

- [ ] `clips requeue` leaves the failed run's kept worktree and branch
      (`ingest/<id>`), so the requeued clip stops at once with "kept by an
      earlier run; clear it to synthesize again" (2026-10-05,
      01KYSGC20YASFDJ8GT0JBFS2CG and 01KYSGC20YC7BRXR2PBVCHDK0Y, cleared by hand
      after saving their diffs). Smallest next step: have requeue save the kept
      diff into the clip's state and remove the worktree and branch, or print
      the clear command it needs.

- [ ] Worker-ladder synthesis on free OpenRouter models (trial 2026-10-05, 10
      clips: 2 published, 1 reviewer skip, 7 needs-claude). Remaining refusals
      not fixed in the engine: a rewrite that drops an existing section, and a
      new page whose `link_from` names a page the model was not shown. Smallest
      next step: measure the rates over the full 817-clip run before choosing a
      repair.

- [ ] OpenRouter's free daily cap is shared by every worker queue: on 2026-10-05
      atrium.synthesis took 818 of about 1000 attempts, the clips run stopped at
      08:13Z after 64 clips (16 published, 3 skipped, 42 needs-claude), and once
      the cap was spent every writing prompt fell to the local model, whose
      40960-token window cannot hold 166-274 KB, so each clip burned about 25
      minutes for nothing. Smallest next step: stop a run when the writing
      step's answering executor turns local, instead of waiting for twelve
      escalations.

- [ ] The daily job's medium-list collector fails under launchd: "EPERM:
      operation not permitted, copyfile .../Chrome/Default/Cookies" (2026-10-05
      04:30Z), so its triage does not cover Medium lists. Smallest next step:
      grant the launchd job's node Full Disk Access, or read the cookies through
      a path launchd may open.

- [~] Hold `clips status --json` inside the dashboard polling budget (p95 2 s,
  300 MB). Lazy command imports and one `cat-file --batch-check` for every
  processed clip's commit took it from a 14 s full status to 0.6-0.9 s wall and
  about 130 MB on a 2043-clip store, with at most 1.3 s of CPU. Under machine
  load averages of 50-80, 1-2 runs in 10 still took 2.7-8.6 s wall, so p95 is
  over budget on a loaded host. Smallest next step: re-measure on an idle host
  before the dashboard adapter ships; if the tail remains, write the document at
  the end of a job instead of polling.

- [x] Unattended clips day restored (2026-10-05). Four silent breaks: agy no
      longer listed `claude-opus-4-6-thinking` (now `claude-opus-5-5-high`,
      `aef83b5`); with Claude spent, fallback synthesis ran on the auto-review
      gate's own Gemini and every clip escalated (`authorAwareReviewer` routes
      those diffs to `gemini-3.8-flash-high`, `aef83b5`); Vexa moved message
      HTML out of `messages.body_html`, so the newsletter lane harvested nothing
      from 2026-09-04 (bodies now via `vexa message --json`, `1053786`); and a
      17 s Gemini run that wrote nothing parked a clip (one retry, `a49dea3`).
      `tools/daily/daily.sh` + launchd template run harvest, promote, commit and
      a 40-clip auto-review ingest at 06:30 (`3963018`). Verified by
      `pnpm check` (1309 tests), `clips harvest --dry-run` (177 emails, 655
      articles) and a launchd probe reaching agy, vexa and the remote.
- [ ] `tools/daily/daily.sh` has not yet completed a scheduled run. Smallest
      step: read `~/p/.clips-daily.launchd.log` after the first 06:30 run.
- [ ] `read-vexa-message-html.ts` passes the id after `--` because Vexa ids can
      begin with `-`; no test pins the argument order. Smallest step: extract
      the argument list into its own unit and test a dash-leading id.

- [x] Resolve the ChatGPT converter output from instance configuration.
      `convert.py` now reads `SYNTOPICA_DATA` and `brain.sources` at call time;
      `run.sh` and `purge.sh` use the same configuration contract as
      `keeper.sh`. Verified with temporary instances by `uv run pytest -q` (646
      passed, 4 skipped) and `uv run codeality-py gate` (all applicable checks
      passed).
- [x] Resolve the sessions converter output from instance configuration.
      `convert.py` now resolves rendered pages and mirrored hosts from
      `SYNTOPICA_DATA` and `brain.sources` at call time. Tests use temporary
      instances and a synthetic home; missing or invalid configuration refuses
      before scanning stores. Verified by `uv run pytest -q` (668 passed, 4
      skipped), `uv run codeality-py gate` (all applicable checks passed),
      `convert.py --help` with an instance (usage, exit 0), and `convert.py`
      without `SYNTOPICA_DATA` (configuration error on stderr, exit 78).
- [x] Pass the instance directory through the ChatGPT launchd template.
      `EnvironmentVariables` now carries `SYNTOPICA_DATA` through an explicit
      `__DATA_ROOT__` placeholder, filled by the documented render command.
      Verified by `uv run pytest -q tests/test_chatgpt_launchd_template.py` and
      the full Python suite: the documented command renders a valid plist in a
      temporary checkout with every path filled. No job was installed or
      bootstrapped; `tools/sessions/` has no launchd template.
- [x] Centralize conventional instance commit messages and surface hook
      refusals. Routing used a bare `Route clip ...` subject, so a `commit-msg`
      hook rejected it after the clip move was staged. All runtime emitters now
      use `instanceCommitMessage`, including the harvest recovery command and
      the ChatGPT keeper. `commitStagedChanges` reports the attempted message,
      both output streams, and the staged but uncommitted state. Regression
      coverage runs real hooks in temporary repositories; verify with
      `pnpm check` and `uv run pytest -q`. Instance data is not part of this
      repair.
- [x] Mirror the Brain schema's required/state path classification. The Clips
      schema is byte-identical to Brain commit `93fc683`; the selected runtime
      schema supplies path presence policy on every load. Missing state is named
      without failing or being created, while missing content still fails even
      when it shares a location with state. Verify with `pnpm check` and
      `uv run pytest -q`; regression fixtures are synthetic instances.

- [x] Add a synthesis runner that runs on this machine instead of an account
      (2026-09-30, owner order: codex forbidden, cursor cancelled, only agy and
      local models). `CLIPS_SYNTHESIS_RUNNER=worker` sends each clip to the
      worker's `clips.synthesis` queue as two tool-less `inference` jobs (select
      pages from the index, then return those pages whole); the engine writes
      the answer into the worktree, refusing any non-page path and any existing
      page the model was not shown. The author is `worker:<provider>/<model>`
      from the result's `executor`, and the grade guard maps `ollama` to a
      `local` tier. A direct agent CLI on Ollama was probed first and dropped:
      opencode confines its tools to the worktree (`external_directory: deny`,
      measured), but Ollama's OpenAI endpoint cannot pin `num_ctx`, and one such
      call reloaded the 22 GB model at 262,144 tokens under Vexa. The brain
      engine's schema accepts `worker` for synthesis since brain `0463313`.
      Verified by `pnpm check` (274 files, 1248 tests) and three real runs on a
      throwaway copy of the pages, never the wiki repo: 436 s, 181 s and 93 s
      per clip on qwen3.6:35b. None was publishable - see the open item below.
      The worker does not declare the queue yet (`403 queue_not_granted`); the
      contract is `docs/worker-synthesis-contract.md` and the request is in the
      wiki's `TODO.md`.
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
- [ ] `pnpm check` failed once with 4 integration tests throwing
      `Cannot inspect configured Git repository` from
      `makeSyntopicaConfigFixture` (2026-09-30, machine under heavy load), and
      passed on the two reruns with no change. A git spawn failing under load
      reads as a config error. Smallest step: have `runSyntopicaGit` include the
      spawn error code in the message so the next occurrence says whether it was
      `EAGAIN`.
- [ ] A fresh clone fails `pnpm test`: the ten `*.integration.test.ts` files
      gate on `BRAIN_ENGINE_PRESENT` and skip without a `brain` checkout beside
      the repository, and coverage then lands at 72.08% lines, 73.78% functions,
      71.89% statements and 66.01% branches against thresholds of 76/78/76/68.
      Measured 2026-09-22 on an untouched clone of `origin/main` (1156 passed,
      24 skipped); the same tree with the engine present is 1180 passed and
      exit 0. Smallest step: have the setup guide, or the test script, state
      that the engine must be cloned first, or scope the thresholds to what runs
      without it.
- [x] Derive the wiki layout from `brain.*` instead of the repository root
      (broken 2026-09-14, fixed 2026-09-30). The owner's instance moved its
      pages under `brain/` in wiki commit 644fa090; from then no clip ingest
      published. Evidence: `clips ingest --clip 01M3QXGJ` wrote
      `brain/topics/claude-code-configuration.md` and validation refused it as
      `outside the allowed directories (brain)` (wiki eb404f11). The same audit
      reported 0 findings because it read pages and ledgers at the root. Three
      more silent breaks sat behind it: the index generator was run as
      `tools/index/build.py` in the worktree (it moved to the brain engine, and
      the worktree's relative engine paths fail its config load), the read probe
      read the root `SCHEMA.md` that no longer exists, and the sensitive-diff
      guard matched ` a/business/`, which no nested header contains.
      `src/layout/` now derives the page root (the index's directory), page
      directories, sources and ledger from the config; page ids, ledgers, audit
      subjects and `grade --page` stay page-root-relative; the index builder
      runs from `engines.brain.path` with a temporary `syntopica.local.json`
      pinning engine paths absolute. Verified by `pnpm check` (263 files, 1198
      tests), new nested-layout suites, and on the instance: the kept 01M3QXGJ
      worktree now validates and regenerates `brain/index.md`;
      `clips ingest --dry-run --clip 01M3QXGF` routes; `clips audit` 0 -> 145
      findings (a flat-layout clone of the same content gives 153, the 8 extra
      being gitignored X threads and one `clips/` source absent from the clone);
      `clips status` now sees ledgers and reports two clips
      (01M097NSDEKSQJV2MX20DPCQRA, 01M097NSDET32KW1MAM73BNBED)
      reconciliation-pending.

## Shared package scope migration (2026-09-14)

- [ ] After the owner publishes the renamed shared packages, regenerate the
      lockfile and run the existing repository quality gate. Source references
      now use the new scope; the lockfile is intentionally unchanged because the
      packages are not published.
- [ ] Twelve ingest integration tests fail on a clean checkout of `b6d5b9f` and
      of its parent alike (`ingest.claim-markers`, `ingest.consistency`,
      `ingest.grading`, `ingest.locking`, `ingest.publish`, `ingest.skip`,
      `ingest.route` files): each dies in its fixture with
      `git cat-file -e main:topics/test-topic.md` failing or
      `branch 'ingest/<id>' not found`, so the run they assert on never
      published. Measured 2026-09-16 with `pnpm vitest run` before and after the
      inbox change; the failing set is identical, which is what let the change
      ship. Smallest step: run one file alone with `--reporter verbose` and read
      the synthesizer it selects; the fixture likely needs a runner the host no
      longer has on `PATH`.

- [ ] Decide whether `WIKI_REGISTER_INSTRUCTION` needs an AI-prose line. The
      `prose-quality` skill (rocket-agents `49a1744a`) names the patterns. A
      2026-09-27 grep over the 273 published pages in the private instance found
      few real hits: most matches for its word list are technical ("syntax
      highlighting", "robust algorithm") or quoted titles ("Game-Changing
      Features"); 14 "is not X but Y" contrasts, several of them legitimate
      corrections. The instruction's rule is one line per measured rejection,
      and none of the rejections documented there is this failure, so the prompt
      stays unchanged. Smallest next step: count reviewer rejections that cite
      puffery or `-ing` tails over the next ingest batch, and add a line only if
      they recur.
