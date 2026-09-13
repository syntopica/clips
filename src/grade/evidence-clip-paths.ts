import { join } from 'node:path'
import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { articleDedupKey } from '../harvest/newsletter/article-dedup-key.ts'
import { citationDedupKey } from './citation-dedup-key.ts'

/** The `index.md` of every clip a page cites, matched on the same dedup key the
 * harvest uses: one Medium post reaches the store under several url spellings,
 * so comparing the page's `sources:` url against `metadata.normalized_url`
 * verbatim would drop evidence that is on disk. Thin clips carry no metadata
 * and cannot be matched at all; they are simply absent from the result, and the
 * grader reports the shortfall rather than grading against nothing.
 *
 * A **body-less** clip is skipped for the same reason, added 2026-08-04 after
 * it was found satisfying the check it should fail. `capturePage` writes one
 * when a page cannot be read at all - a host that refuses the fetch, markup
 * with no article in it - and it is a clip in every structural sense: it has
 * `metadata.json`, so it matched here and `clips audit` called the citation
 * resolved. Two of the thirty backfilled that day were of this shape, which
 * means a check reporting `none` was partly reporting the absence of evidence
 * as its presence. `snapshot_mode: 'omitted'` is the field that says so - the
 * one the design named when it decided `extractor` could not. */
export const evidenceClipPaths = (
  sourceUrls: readonly string[],
  clips: readonly (Clip | ThinClip)[],
): string[] => {
  const wanted = new Set(sourceUrls.map((url) => citationDedupKey(url)))
  const paths: string[] = []
  for (const clip of clips) {
    if (clip.kind !== 'clip') continue
    if (clip.metadata.snapshot_mode === 'omitted') continue
    if (!wanted.has(articleDedupKey(clip.metadata.normalized_url))) continue
    paths.push(join(clip.directory, 'index.md'))
  }
  return paths
}
