import type { ClipBucket } from './clip-bucket.ts'
import type { Clip } from './clip.ts'
import { readClip } from './read-clip.ts'
import type { ThinClip } from './thin-clip.ts'

/** `readClip` is written never to throw, but that is a property of its
 * current body, not a structural guarantee. This wrapper makes it structural:
 * any future edit that reintroduces a throw (a property access on null, a
 * `.parse` instead of `.safeParse`) still yields a ThinClip here rather than
 * discarding every healthy clip in the same `discoverClips` walk. */
export const readClipSafely = async (
  directory: string,
  bucket: ClipBucket,
): Promise<Clip | ThinClip> => {
  try {
    return await readClip(directory, bucket)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      kind: 'thin',
      directory,
      bucket,
      reason: `unreadable: ${message.replace(/\r?\n/g, ' ')}`,
    }
  }
}
