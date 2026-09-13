import type { Clip } from '../clips/clip.ts'

/** A pending clip whose url the wiki already cites, and the pages citing it. */
export type CitedCandidate = {
  clip: Clip
  pages: string[]
}
