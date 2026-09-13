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
