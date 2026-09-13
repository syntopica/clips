import type { CapturedPage } from './captured-page.ts'
import type { UndrainedCapture } from './undrained-capture.ts'

/** One capture, what fetching it produced, and where the clip goes. The clock
 * comes from the caller so a run's clip ids sort together. */
export type WriteCapturedClipInput = {
  capture: UndrainedCapture
  captured: CapturedPage
  clipsRepository: string
  now: Date
}
