# Capture Python tools

Keep each existing command path and its public imports compatible when
extracting helpers. Place each helper beside its caller, with one declaration
per module. Use bare sibling imports at runtime and explicit repository imports
under `TYPE_CHECKING` for strict mypy resolution.

Store SQL text in `sql/*.sql` and retain its parameter placeholders. Bind the
resource directory to the calling module: several tool directories can share the
same cached `load_sql` module during a test process.

Keep executable work behind `main` and the `__main__` guard. When callers
replace an entrypoint dependency, preserve that lookup through an explicit
callable parameter instead of freezing the dependency in an extracted module.

Verify changes with `uv run ruff check tools/capture`,
`uv run ruff format --check tools/capture`, `uv run mypy tools/capture`, and
`uv run pytest -q tests -k capture`. Run `uv run codeality-py check` as well;
report validator constraints that conflict with preserving command paths.
