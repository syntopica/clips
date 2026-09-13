import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { articleDedupKey } from '../harvest/newsletter/article-dedup-key.ts'
import type { CitedCandidate } from './cited-candidate.ts'

/** The pending clips whose url a wiki page already cites.
 *
 * Only full clips in `pending/` qualify: a thin clip has no url to match, and
 * every other bucket is already settled. A body-less clip
 * (`snapshot_mode: 'omitted'`) is excluded for the reason `evidenceClipPaths`
 * excludes it - it carries no evidence, so moving it to processed would dress
 * the absence of a source as its presence. Whether a candidate already has a
 * ledger is the caller's question: that answer lives in the brain repository,
 * and this function stays pure so it can be tested without one. */
export const citedCandidates = (
  clips: readonly (Clip | ThinClip)[],
  citedPages: ReadonlyMap<string, string[]>,
): CitedCandidate[] => {
  const candidates: CitedCandidate[] = []
  for (const clip of clips) {
    if (clip.kind !== 'clip') continue
    if (clip.bucket !== 'pending') continue
    if (clip.metadata.snapshot_mode === 'omitted') continue
    const pages = citedPages.get(articleDedupKey(clip.metadata.normalized_url))
    if (pages === undefined || pages.length === 0) continue
    candidates.push({ clip, pages: [...pages] })
  }
  return candidates
}
