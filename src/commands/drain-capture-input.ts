import type { UndrainedCapture } from '../capture/undrained-capture.ts'

/** One capture plus what the run around it already computed: where the clip
 * store is, and the dedup keys of every article already in it. Both are
 * per-run, which is why they are passed in rather than read here.
 *
 * The cookie jar left with the Medium-only fetcher: `pageRequestHeaders` opens
 * it per request now, because the drain reaches arbitrary hosts one at a time
 * and there is no batch to amortise it over. */
export type DrainCaptureInput = {
  capture: UndrainedCapture
  clipsRepository: string
  clippedKeys: ReadonlySet<string>
}
