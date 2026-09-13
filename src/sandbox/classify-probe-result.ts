import type { ProbeCommandResult } from './probe-command-result.ts'
import type { ProbeOutcome } from './probe-outcome.ts'

/**
 * Judges one probe command from the child process alone.
 *
 * `denialSignature` belongs to the assertion being run, not to a list shared
 * across every row. A shared list credits any refusal anywhere in stderr as
 * evidence for the row, and that produced a real false pass: `network-denied`
 * reported `denied` while the network was fully open, because curl failed
 * reading an SSL config file and wrote "Operation not permitted" before it ever
 * opened a socket.
 *
 * A denial must therefore be recognisable as *this command's* denial. Exit code
 * 134 with no message - which codex-cli 0.145.0 produces when its own sandbox
 * aborts - proves nothing about what the boundary would have allowed, so it
 * stays inconclusive.
 */
export function classifyProbeResult(
  result: ProbeCommandResult,
  denialSignature: RegExp | null,
): ProbeOutcome {
  if (result.timedOut) return 'inconclusive'
  if (result.exitCode === 0) return 'succeeded'
  if (denialSignature !== null && denialSignature.test(result.stderr))
    return 'denied'
  return 'inconclusive'
}
