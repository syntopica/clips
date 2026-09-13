import type { UndrainedCapture } from '../capture/undrained-capture.ts'

/** What the inbox held, one line per capture, before anything is fetched.
 *
 * Printed up front rather than as each one lands so a `--dry-run` and a real
 * run open with the same text, and so an interrupted run leaves a record of
 * what it was working through. */
export const formatDrainSummary = (
  captures: readonly UndrainedCapture[],
): string =>
  [
    `${String(captures.length)} undrained captures`,
    ...captures.map(
      (capture) =>
        `  ${capture.captured_at}  ${capture.capture_source}  ${capture.url}`,
    ),
    '',
  ].join('\n')
