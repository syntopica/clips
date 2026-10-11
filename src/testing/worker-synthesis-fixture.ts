import type { SynthesisResult } from '../synthesis/synthesis-result.ts'

export type WorkerSynthesisFixture = {
  result: SynthesisResult
  worktree: string
}
