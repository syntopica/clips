import type { WorkerShownPage } from './worker-shown-page.ts'

/** Everything the writing pass is built from. */
export type WorkerWritingInput = {
  clipText: string
  shown: readonly WorkerShownPage[]
  worktree: string
  directories: readonly string[]
  today: string
  guidance: string
}
