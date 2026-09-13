import type { Clip } from '../../clips/clip.ts'
import type { ThinClip } from '../../clips/thin-clip.ts'
import { articleDedupKey } from '../newsletter/article-dedup-key.ts'

/** The dedup key of every article already present in the clip store, across all
 * buckets. Keys rather than raw URLs, because one Medium post reaches the store
 * under more than one URL spelling. Thin clips carry no metadata, so they
 * cannot take part in dedup; plan 2d normalised the two that existed, and the
 * capture service creates no more.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const clippedArticleKeys = (
  clips: readonly (Clip | ThinClip)[],
): Set<string> => {
  const keys = new Set<string>()
  for (const clip of clips) {
    if (clip.kind === 'clip')
      keys.add(articleDedupKey(clip.metadata.normalized_url))
  }
  return keys
}
