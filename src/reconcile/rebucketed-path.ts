import type { ClipBucket } from '../clips/clip-bucket.ts'

/** The same clip directory under a different bucket, keeping its `YYYY/MM/`
 * position. A path outside the source bucket is a programming error rather
 * than a data condition, so it throws: the caller decided which bucket the clip
 * was in before asking for the move. */
export const rebucketedPath = (
  source: string,
  from: ClipBucket,
  to: ClipBucket,
): string => {
  const prefix = `clips/${from}/`
  if (!source.startsWith(prefix))
    throw new Error(`${source} is not under ${prefix}`)
  return `clips/${to}/${source.slice(prefix.length)}`
}
