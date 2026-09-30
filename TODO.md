# TODO

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
