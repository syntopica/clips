import { basename } from 'node:path'
import type { PartitionedInboxClips } from './partitioned-inbox-clips.ts'

/** Split the inbox's pending clips into the ones the archive lacks and the
 * ones it already holds under any bucket. Both groups leave the inbox; only
 * the first is copied. */
export const partitionInboxClips = (
  pending: readonly string[],
  archived: ReadonlySet<string>,
): PartitionedInboxClips => {
  const fresh: string[] = []
  const duplicates: string[] = []
  for (const path of pending)
    (archived.has(basename(path)) ? duplicates : fresh).push(path)
  return { fresh, duplicates }
}
