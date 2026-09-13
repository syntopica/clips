import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { evidenceClipPaths } from './evidence-clip-paths.ts'
import { xThreadEvidencePaths } from './x-thread-evidence-paths.ts'

/** Every file on disk that a page's citations resolve to, from all three
 * evidence classes this wiki has.
 *
 * Clips are the ordinary case. An X status url resolves against `sources/x/`
 * as well - the same class the audit gained on 2026-08-11, which the grader
 * lacked until 2026-08-22 and which made it read a scraped thread's citations
 * as unsupported. A `sources:` entry that is a path rather than a url is
 * already a local file and needs no resolving at all.
 *
 * Order is clips, then threads, then local files, and nothing depends on it -
 * the caller counts these and hands them over as a set. */
export const pageEvidencePaths = (
  brainRepository: string,
  urls: readonly string[],
  localFiles: readonly string[],
  clips: readonly (Clip | ThinClip)[],
): string[] => [
  ...evidenceClipPaths(urls, clips),
  ...xThreadEvidencePaths(brainRepository, urls),
  ...localFiles,
]
