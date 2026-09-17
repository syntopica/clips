/** Which executable each synthesis transport needs on PATH.
 *
 * `selectSynthesizer` probes it with `--version` before returning the
 * transport, so a missing binary degrades to the interactive synthesizer with a
 * printed reason instead of failing mid-clip. A map rather than the ternary
 * that was here until 2026-09-11: with two transports the ternary read as a
 * fact about codex, and with a third it silently probed the wrong binary,
 * announcing `agy not available` for a cursor run. */
export const SYNTHESIS_BINARIES: Readonly<Record<string, string>> = {
  codex: 'codex',
  cursor: 'cursor-agent',
  'agy-fine': 'agy',
  'agy-bulk': 'agy',
  fallback: 'agy',
}
