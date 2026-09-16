import { basename } from 'node:path'

/** Split the inbox's pending clips into the ones the archive lacks and the
 * ones it already holds under any bucket. Both groups leave the inbox; only
 * the first is copied. */
export const partitionInboxClips = (
  pending: readonly string[],
  archived: ReadonlySet<string>,
): { fresh: string[]; duplicates: string[] } => {
  const fresh: string[] = []
  const duplicates: string[] = []
  for (const path of pending)
    (archived.has(basename(path)) ? duplicates : fresh).push(path)
  return { fresh, duplicates }
}
