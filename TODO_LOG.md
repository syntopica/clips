# TODO Log

> Searchable record of closed work. Active work lives in `TODO.md`.

<!-- tadu:log v1 since 2026-10-12 -->

## 2026

### 2026-10-11 - Backlog run

- [x] `tools/capture` HTTPS calls under the python.org framework `python3`
      (`CERTIFICATE_VERIFY_FAILED`): the network tools are now documented to run
      through `uv run python` (capture `README.md`, `push_index_to_service.py`
      usage), with `SSL_CERT_FILE=/etc/ssl/cert.pem` as the bare-Python
      alternative. Verified from a plain shell: an unauthenticated request to
      the capture origin under `uv run python` completed the handshake
      (`http 401`), the same request under `/usr/local/bin/python3` failed
      `CERTIFICATE_VERIFY_FAILED`, and
      `uv run python tools/capture/push_index_to_service.py --dry-run --limit 1`
      printed `pushed 1, skipped 0, failed 0 of 1`. A live `--limit 1` push was
      not run: it needs the capture token.
- [x] `tools/daily/daily.sh` names where it stopped: a `start:` line with pid
      and boot time, a `pending:` count, a `<id> start` line before each clip,
      and EXIT/TERM/HUP/INT traps that log `stop: ... during <step>`. The same
      change fixes a latent bug: `timeout clips ...` never called the script's
      `clips()` function (timeout executes a program), so every step ran the
      first `clips` on PATH; it now runs `node "$ENGINE/bin/clips"` from an
      array. Verified with `shellcheck` (clean) and a stub engine in a scratch
      instance: a normal run ends `done: 2 clips attempted`, a TERM to the
      process group mid-clip logs `stop: received SIGTERM during ingest B2` (rc
      143), and a failing preamble logs
      `stop: exited with code 1 during     start`.
- [x] The daily job can read Chrome's cookies under launchd again: `/bin/bash`
      (the plist's `ProgramArguments[0]`) has Full Disk Access, granted in
      System Settings on 2026-10-11 (TCC `kTCCServiceSystemPolicyAllFiles`,
      `auth_value=2`). Verified with a throwaway launchd job running
      `/bin/bash -c 'cp .../Chrome/Default/Cookies ...'`, which printed `ok`
      where the daily job had failed with `EPERM` since 2026-10-05. The next
      `promote exit=` line in `~/p/.clips-daily.launchd.log` is the live check.
- [x] Instance repairs in `~/p/wiki`: the seven kept `ingest/<id>` branches and
      their worktrees are cleared (E4BM's locked worktree no longer existed on
      disk; unlocked and pruned), after a verified bundle of all seven branches
      plus each worktree's diff, status and untracked files were saved to
      `~/Backups/wiki-ingest-branches-20261011/`. The three `INDEX_MAP_FAILED`
      clips are requeued (wiki `81a464628`, `eb507c3aa`, `d8a1bd9df`), and
      01KYSGC20YGHQTSEX81YT61J3C's uncommitted `state.json` is restored with
      `git checkout`. Verified: `git branch --list 'ingest/*'` and the
      `brain-ingest` worktree list are empty; each requeue printed
      `requeued to     pending`.
- [x] `clips requeue` refuses while the failed run's `ingest/<id>` branch is
      still kept, names the clear command and writes nothing (`ed8fa6a`). Codex
      decision D1, option (b), high: clearing a branch that may hold a refused
      diff stays the operator's call. Verified by
      `pnpm exec vitest run src/commands/requeue.integration.test.ts` (6
      passed).
- [x] `INDEX_MAP_FAILED` is requeueable (`d2e4c5c`). Codex D2 (a), high.
- [x] The brain index builder now runs through
      `uv run --no-sync --project <brain>` (`bf4166c`). Under launchd's PATH a
      bare `python3` was the system 3.9, the builder died at import on
      `typing.Never`, and three daily clips (01KYSGC20YH4P9Z1NQDAX39MZ6,
      01KYSGC20YH7B36RNBTBK9BBG5, 01KYSGC20YHBWGVX6EYA2YVWRZ) parked as
      INDEX_MAP_FAILED from 2026-10-09. Reproduced with
      `PATH=/opt/homebrew/bin:/usr/bin:/bin pnpm exec vitest run src/commands/ingest.claim-markers.integration.test.ts`
      (1 failed before, passes after).
- [x] `tools/daily/daily.sh` completes scheduled runs:
      `~/p/.clips-daily.launchd.log` has `done: 40 clips attempted` on
      2026-10-05, 06 and 07, and `stop: five escalations in a row` on 08, 10
      and 11. Its harvest/promote `exit=` lines always read 0 because `$(stamp)`
      reset `$?`; fixed in `705547f`.
- [x] `vexaMessageArguments` pins the id after `--`, tested with a dash-leading
      id (`c3a7483`).
- [x] `runSyntopicaGit` names the spawn error code, e.g.
      `Cannot inspect configured Git repository (ENOBUFS)`, never the path
      (`eb554ba`); a test forces ENOBUFS. Likely cause of the 2026-09-30 flake:
      the 5 s spawn timeout under load (ETIMEDOUT), which the next occurrence
      will now say.
- [x] Fresh-clone coverage: README states the brain engine must be checked out
      beside the engine and synced before `pnpm test` (`cea339b`). Measured on a
      clips-only clone today: 1301 passed, 24 skipped, coverage 74.96% lines
      against 76% (exit 1); CI already checks out brain.
- [x] Twelve ingest integration tests failing on a clean checkout: no longer
      reproduce. `pnpm check` on `a8b42e6` with the brain engine beside: 297
      files, 1325 passed, exit 0.
- [x] `clips status --json` holds the polling budget: 20 runs at load averages
      86-114 on a 2230-clip store, p95 0.80 s, max 1.22 s, RSS about 137 MB
      (`/usr/bin/time -l node bin/clips status --json` in the instance).
- [x] Shared package scope migration: `npm view` gives
      `@syntopica/eslint-config` 0.9.0, `@syntopica/prettier-config` 0.2.2,
      `@syntopica/tsconfig` 0.3.1; the lockfile already resolves the new scope
      and a fresh clone installs with `--frozen-lockfile`. The expired
      `minimumReleaseAgeExclude` entries were dropped (`248c430`).
- [x] `WIKI_REGISTER_INSTRUCTION` stays unchanged. Of the 16
      AUTO_REVIEWER_ESCALATED clips in the instance's needs-claude bucket none
      cites puffery or `-ing` tails. Codex D5 (b), high.
- [x] A clip move writes state.json after `git mv` succeeds and refuses an
      occupied destination (`632147f`); a refused mv had left
      01KYSGC20YGHQTSEX81YT61J3C in `pending/` claiming needs-claude since
      2026-10-07, and `git mv` into an existing directory nested the clip
      instead of refusing.
- [x] Section-drop retry and selection prompt (`480c77d`, `6ee5ac3`). Codex D4
      (b)+(c), medium: one writing retry told which section it dropped,
      validator unchanged; the selection pass no longer escalates because a new
      page is needed.
- [x] OpenRouter's shared free cap: a writing or selection answer the local
      model gave to a prompt its window could not hold now leaves the clip
      pending, ends the run with exit 4, and `daily.sh` stops on it (`361f63e`).
      Codex D3 (a), high. Verified by `pnpm check` (1344 tests) and an ingest
      integration test asserting exit 4, a pending clip and no kept branch.
- [x] The 81 frozen `code-policy/no-inline-types-in-runtime-files` suppressions
      are paid down; `eslint-suppressions.json` is empty and emitted JavaScript
      is unchanged (`6443646`, implemented by Codex in workspace-write and
      re-verified by `pnpm check`, 1339 tests).
- [x] Dependencies at their latest releases (`a11a2df`): `pnpm up --latest -r`,
      `uv lock --upgrade`, and every GitHub Action re-pinned to the SHA of its
      latest tag. Verified by `pnpm check`, `uv run pytest -q` (678 passed, 4
      skipped), `uv run codeality-py gate` and `actionlint`.

### Before 2026-10-11 (moved from TODO.md)

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

### 2026-10

- [x] 2026-10-22 — **Reproducibility:** Pin the paired Brain engine reference to
      the exact source used for integration verification.
  - Result: Replace the floating main reference with the exact accepted Brain
    commit 5329682bd31fbc414840400ede77359ae9f3a398, as required by the CI pin
    contract.
  - Evidence: Reference coverage found the two CI consumers and documentation;
    no tests depend on the literal branch name. The pin is a valid existing
    40-character commit ID. Final pnpm run check:ci --maxWorkers=1 passed 304
    test files and 1344 tests, with all ten paired ingest integration suites
    executing against that exact sibling engine. One existing todo remains.

- [x] 2026-10-22 — **Security:** **Security: update the locked certifi trust
      bundle.** The lockfile candidate updates only certifi from 2026.7.22 to
      the patched 2026.10.19 release for GHSA-6q48-6c7w-9gw2. Next: verify the
      exact locked candidate in an isolated environment and complete the
      required source gates. Installed instances require separate verification;
      source acceptance does not establish their runtime state.
  - Result: Update only certifi from 2026.7.22 to 2026.10.19, preserving every
    other locked package and metadata field. Installed consumer adoption remains
    separate.
  - Evidence: Isolated wheel-only locked setup and both engine lock checks
    passed. pytest -q passed 678 tests with four existing skips; codeality-py
    gate --json passed all seven required stages (90.08-percent coverage,
    unchanged 65-percent requirement). pnpm run check:ci --maxWorkers=1 passed
    with unchanged Node coverage thresholds. All 1956 source bytes/modes, 89
    installed distribution records and 26983 dependency file hashes retained
    parity; owned process groups were empty.

- [x] 2026-10-22 — **Session rendering:** Preserve short Antigravity assistant
      replies.
  - Result: Decode the existing Antigravity text field paths directly,
    preserving short, multilingual, multiline and repeated visible replies while
    excluding reasoning and tool siblings. Keep the generic protobuf walker and
    its established behavior unchanged.
  - Evidence: The old converter fails eight of nine new end-to-end cases; the
    corrected focused suite passes all 36 cases. Both uv lock --check commands
    pass in an isolated pair at the exact .brain-engine-ref. codeality-py gate
    --json passes all seven required stages with coverage threshold 65
    unchanged. pnpm run check:ci --maxWorkers=1 passes 1344 tests across 304
    files, retaining one baseline skipped file and one todo. All actual source
    and installed dependency trees remain exact. An independent read-only
    supplementary proof qualifies the exact 1185 native Vitest compiler-cache
    additions after the initial wrapper classification rejected them; the
    original failed wrapper result is retained and tests were not rerun. Two
    complete synthetic rendering comparisons are deterministic. No real session
    conversion, schedule or resident runtime was changed.
