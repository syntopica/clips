# TODO

- [x] Resolve the ChatGPT converter output from instance configuration.
      `convert.py` now reads `SYNTOPICA_DATA` and `brain.sources` at call time;
      `run.sh` and `purge.sh` use the same configuration contract as
      `keeper.sh`. Verified with temporary instances by `uv run pytest -q` (646
      passed, 4 skipped) and `uv run baseline-py gate` (all applicable checks
      passed).
- [x] Resolve the sessions converter output from instance configuration.
      `convert.py` now resolves rendered pages and mirrored hosts from
      `SYNTOPICA_DATA` and `brain.sources` at call time. Tests use temporary
      instances and a synthetic home; missing or invalid configuration refuses
      before scanning stores. Verified by `uv run pytest -q` (668 passed, 4
      skipped), `uv run baseline-py gate` (all applicable checks passed),
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

## Shared package scope migration (2026-09-14)

- [ ] After the owner publishes the renamed shared packages, regenerate the lockfile and run the existing repository quality gate. Source references now use the new scope; the lockfile is intentionally unchanged because the packages are not published.
