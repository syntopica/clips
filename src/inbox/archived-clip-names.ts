import { basename } from 'node:path'
import { discoverClips } from '../clips/discover-clips.ts'

/** Directory names already present in the archive, in any bucket. A clip the
 * archive has processed or parked must not come back as pending because the
 * inbox still carries its original copy. */
export const archivedClipNames = async (
  clipsRepository: string,
): Promise<ReadonlySet<string>> =>
  new Set(
    (await discoverClips(clipsRepository)).map((clip) =>
      basename(clip.directory),
    ),
  )
