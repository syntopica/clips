import { readFile } from 'node:fs/promises'
import type { ClaimRef } from '../citations/claim-ref.ts'
import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { evidenceClipPaths } from '../grade/evidence-clip-paths.ts'
import { resolveLocalSource } from '../grade/resolve-local-source.ts'
import { pageSources } from './page-sources.ts'

/** What a marker points at, read off disk, or null when there is nothing to
 * read.
 *
 * Null covers four different things and deliberately does not distinguish
 * them: `OWN` names no source at all, a ref past the end of the list is
 * `findUnresolvedClaimRefs`' finding and not this one, a url whose clip is not
 * on disk is `findUnresolvedCitations`', and a local path that escapes the
 * repository or points at nothing is `resolveLocalSource`'s refusal. Each is
 * already reported where it belongs; repeating it here as an ungrounded
 * quotation would name the wrong defect.
 *
 * Both source shapes resolve: a url through the harvest's own dedup key, since
 * one article reaches the store under several spellings, and a repository-local
 * path through the containment check the grader uses. */
export const sourceTextForRef = async (
  brainRepository: string,
  page: string,
  ref: ClaimRef,
  clips: readonly (Clip | ThinClip)[],
): Promise<string | null> => {
  if (ref === 'OWN') return null
  const source = pageSources(page)[Number(ref.slice(1)) - 1]
  if (source === undefined) return null
  const path = /^https?:\/\//.test(source)
    ? evidenceClipPaths([source], clips)[0]
    : resolveLocalSource(brainRepository, source)
  if (path === undefined || path === null) return null
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}
