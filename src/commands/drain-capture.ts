import { capturePage } from '../capture/capture-page.ts'
import { markCaptureDrained } from '../capture/mark-capture-drained.ts'
import type { UndrainedCapture } from '../capture/undrained-capture.ts'
import { writeCapturedClip } from '../capture/write-captured-clip.ts'
import { articleDedupKey } from '../harvest/newsletter/article-dedup-key.ts'
import { normalizeArticleUrl } from '../harvest/newsletter/normalize-article-url.ts'
import type { DrainCaptureInput } from './drain-capture-input.ts'
import type { DrainOutcome } from './drain-outcome.ts'

/** Take one capture out of the inbox: fetch its page into the clip store, then
 * mark it drained.
 *
 * A capture whose article is already in the store is marked drained without a
 * fetch. That is not a shortcut - the phone and the harvest reach the same
 * article all the time, and `/have` exists precisely because they did it
 * silently before. The URL has been handed over either way, which is all
 * `drained_at` claims.
 *
 * **A page that cannot be read still produces a clip and still drains.** The
 * fetch and the extraction fail for reasons that are usually permanent, and
 * leaving those in the inbox meant retrying them forever while `clips drain`
 * stayed red - the always-fails shape. `capturePage` reports rather than throws,
 * and the body-less clip keeps the URL, the note and the timestamp.
 * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
export const drainCapture = async (
  input: DrainCaptureInput,
): Promise<DrainOutcome> => {
  const capture: UndrainedCapture = input.capture
  if (
    input.clippedKeys.has(articleDedupKey(normalizeArticleUrl(capture.url)))
  ) {
    await markCaptureDrained(capture.capture_id)
    return { kind: 'already-clipped', reason: null }
  }
  const captured = await capturePage(capture.url)
  writeCapturedClip({
    capture,
    captured,
    clipsRepository: input.clipsRepository,
    now: new Date(),
  })
  await markCaptureDrained(capture.capture_id)
  return captured.page === null
    ? { kind: 'no-body', reason: captured.reason }
    : { kind: 'clipped', reason: null }
}
