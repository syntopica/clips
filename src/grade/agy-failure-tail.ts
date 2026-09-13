import { AGY_QUOTA_WALL_PATTERN } from '../agy/agy-quota-wall-pattern.ts'

/** What to report when an agy run failed.
 *
 * **Both streams, because the quota wall arrives on stdout.** This read stderr
 * alone until 2026-08-03, on the stated belief that agy "has no credit wall to
 * detect - its quota is per model family and it returns empty output rather
 * than a message". Half of that is right: the quota is per family. The rest was
 * not. agy prints `Error: Individual quota reached. Please upgrade your
 * subscription ... Resets in 3h1m57s.` on **stdout** and exits 1, so the
 * failure reached the operator as `agy exited 1:` with nothing after the colon,
 * and the transport fallback watching for that sentence never fired.
 *
 * stdout also carries the model's own prose, generated from an untrusted
 * captured article, which is why every consumer of this string matches a whole
 * sentence rather than a memorable phrase.
 */
export const agyFailureTail = (failure: unknown): string => {
  const shape = failure as {
    stdout?: string
    stderr?: string
    killed?: boolean
  }
  const streams = [shape.stdout ?? '', shape.stderr ?? '']
    .map((stream) => stream.trim())
    .filter((stream) => stream !== '')
    .join(' | ')
  // Search the whole output, then truncate - never the other way round. Under
  // `--output-format json` the message sits in a field near the front of the
  // envelope and the schema echo fills the end, so a tail slice taken first
  // returned `7s."` and the fallback still did not fire.
  const quota = AGY_QUOTA_WALL_PATTERN.exec(streams)
  const tail = quota === null ? streams.slice(-400) : quota[0]
  return shape.killed === true
    ? `agy was killed for running long; check ~/.gemini/antigravity-cli/cli.log for a 429. ${tail}`
    : tail
}
