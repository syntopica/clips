import { captureServiceOrigin } from './capture-service-origin.ts'
import type { ClipMirrorState } from './clip-mirror-state.ts'
import { readCaptureToken } from './read-capture-token.ts'

/** Tell the capture service how far a clip got.
 *
 * Two calls, because the service is keyed on the URL and the state is keyed on
 * the capture id. `POST /api/capture` is idempotent on the normalised URL and
 * returns the id of the row that survived, whether it was just inserted or was
 * already there - which is exactly what a desktop clip needs, since the service
 * has never heard of it until now.
 *
 * The `PATCH` also marks the capture drained, and that is correct rather than a
 * side effect: the caller is holding the clip, so there is nothing left for the
 * drain to fetch. Without it every clip pushed from here would look like inbox
 * work and be promoted a second time.
 * SPEC: ~/p/brain/docs/superpowers/specs/2026-08-04-clip-state-in-the-browser-design.md */
export const pushCaptureState = async (input: {
  url: string
  state: ClipMirrorState
  clipDir: string
}): Promise<void> => {
  const token = readCaptureToken()
  const recorded = await fetch(`${captureServiceOrigin()}/api/capture`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ url: input.url, capture_source: 'mac-clips' }),
  })
  if (!recorded.ok)
    throw new Error(
      `recording ${input.url} returned ${String(recorded.status)}`,
    )
  const body = (await recorded.json()) as { data?: { capture_id?: string } }
  const captureId = body.data?.capture_id
  if (captureId === undefined)
    throw new Error(`recording ${input.url} returned no capture id`)

  const pushed = await fetch(
    `${captureServiceOrigin()}/api/captures/${encodeURIComponent(captureId)}`,
    {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ state: input.state, clip_dir: input.clipDir }),
    },
  )
  if (!pushed.ok)
    throw new Error(
      `pushing ${input.state} for ${captureId} returned ${String(pushed.status)}`,
    )
}
