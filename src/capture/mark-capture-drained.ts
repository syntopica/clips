import { captureServiceOrigin } from './capture-service-origin.ts'
import { readCaptureToken } from './read-capture-token.ts'

/** Take one capture out of the inbox.
 *
 * Called *after* the URL is in hand, never before. That ordering is what makes
 * the drain re-runnable: a crash between the two leaves the capture undrained
 * and the next run takes it again, and taking a URL twice is harmless because
 * the clip store dedupes it, while losing one is not.
 * SPEC: docs/superpowers/specs/2026-08-04-capture-service-design.md */
export const markCaptureDrained = async (captureId: string): Promise<void> => {
  const response = await fetch(
    `${captureServiceOrigin()}/api/captures/${encodeURIComponent(captureId)}`,
    {
      method: 'PATCH',
      headers: { authorization: `Bearer ${readCaptureToken()}` },
    },
  )
  if (!response.ok)
    throw new Error(
      `marking ${captureId} drained returned ${String(response.status)}`,
    )
}
