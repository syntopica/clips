import type { Clip } from '../clips/clip.ts'
import type { Synthesizer } from '../synthesis/synthesizer.ts'
import type { Repositories } from './repositories.ts'

/** What synthesizeAndValidate needs to run the synthesizer in a worktree and
 * validate what it left there: which repositories to route rejections into,
 * which clip and worktree this run covers, which synthesizer to call, and
 * the guidance carried forward from a prior rejection. */
export type SynthesizeAndValidateInput = {
  repositories: Repositories
  clip: Clip
  worktree: string
  synthesizer: Synthesizer
  guidance: string
}
