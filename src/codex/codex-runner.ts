import type { CodexRunResult } from './codex-run-result.ts'

/** The process boundary, injected so the synthesizer's logic is testable
 * without spending codex quota. */
export type CodexRunner = {
  run(worktree: string, prompt: string): Promise<CodexRunResult>
}
