import { join } from 'node:path'
import { CLIP_BUCKETS } from './clip-buckets.ts'
import type { Clip } from './clip.ts'
import { orderClips } from './order-clips.ts'
import { readClipSafely } from './read-clip-safely.ts'
import { readSubdirectories } from './read-subdirectories.ts'
import type { ThinClip } from './thin-clip.ts'

/** clips/<bucket>/YYYY/MM/<directory>. A missing bucket is normal: needs-claude
 * does not exist in the store until the first clip lands there. */
export const discoverClips = async (
  clipsRepository: string,
): Promise<(Clip | ThinClip)[]> => {
  const found: (Clip | ThinClip)[] = []
  for (const bucket of CLIP_BUCKETS) {
    const bucketRoot = join(clipsRepository, 'clips', bucket)
    for (const year of await readSubdirectories(bucketRoot)) {
      const yearRoot = join(bucketRoot, year.name)
      for (const month of await readSubdirectories(yearRoot)) {
        const monthRoot = join(yearRoot, month.name)
        for (const entry of await readSubdirectories(monthRoot)) {
          found.push(await readClipSafely(join(monthRoot, entry.name), bucket))
        }
      }
    }
  }
  return orderClips(found)
}
