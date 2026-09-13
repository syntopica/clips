import type { ClipMirrorState } from './clip-mirror-state.ts'
import { mirroringIsEnabled } from './mirroring-is-enabled.ts'
import { pushCaptureState } from './push-capture-state.ts'
import { urlIsMirrorable } from './url-is-mirrorable.ts'

/** Publish a clip's state to the capture service, and never fail the caller.
 *
 * The ledger under `.ingest/clips/` is the truth and it is already written by
 * the time this runs; the service is its published mirror, read by clients that
 * cannot see the ledger - today a browser extension colouring a toolbar icon. A
 * mirror that is briefly behind shows an amber icon for a green clip, and
 * re-running the backfill repairs it. An ingest that failed because a web
 * service was down would be a far worse trade.
 *
 * A missing `CAPTURE_TOKEN` lands here too, and deliberately: a machine that has
 * never been given one still ingests. */
export const mirrorClipState = async (input: {
  url: string
  state: ClipMirrorState
  clipDir: string
}): Promise<void> => {
  if (!mirroringIsEnabled()) return
  if (!urlIsMirrorable(input.url)) return
  try {
    await pushCaptureState(input)
  } catch (error) {
    console.warn(
      `could not mirror ${input.state} for ${input.url}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}
