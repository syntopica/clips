import { z } from 'zod'

/** One row of the capture service's inbox, as `GET /api/captures` returns it.
 *
 * `note` is nullable because the Shortcut's prompt is optional, and the URL is
 * validated here rather than trusted: the service refuses a malformed one at
 * capture time, but this package fetches whatever the far end sends and the
 * value becomes an outbound request. */
export const UndrainedCaptureSchema = z.object({
  capture_id: z.string().min(1),
  url: z.url(),
  note: z.string().nullable(),
  capture_source: z.string().min(1),
  captured_at: z.string().min(1),
})
