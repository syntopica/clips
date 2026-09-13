import { z } from 'zod'
import { captureServiceOrigin } from './capture-service-origin.ts'
import { readCaptureToken } from './read-capture-token.ts'
import { UndrainedCaptureSchema } from './undrained-capture-schema.ts'
import type { UndrainedCapture } from './undrained-capture.ts'

/** What the inbox has that this Mac has not taken yet.
 *
 * `?drained=false` is the only filter the service supports and also its
 * default; it is sent explicitly so the request says what it wants rather than
 * relying on the far end's default staying what it is today.
 * SPEC: docs/superpowers/specs/2026-08-04-capture-service-design.md */
export const fetchUndrainedCaptures = async (
  limit: number,
): Promise<UndrainedCapture[]> => {
  const response = await fetch(
    `${captureServiceOrigin()}/api/captures?drained=false&limit=${String(limit)}`,
    { headers: { authorization: `Bearer ${readCaptureToken()}` } },
  )
  if (!response.ok)
    throw new Error(
      `the capture service answered ${String(response.status)} to the drain`,
    )
  return z
    .object({ data: z.array(UndrainedCaptureSchema) })
    .parse(await response.json()).data
}
