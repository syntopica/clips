import { join } from 'node:path'
import { sha256Hex } from '../harvest/promote/sha256-hex.ts'
import type { Synthesizer } from '../synthesis/synthesizer.ts'
import { CODEX_IDENTITY_MODEL } from './codex-identity-model.ts'
import { codexPrompt } from './codex-prompt.ts'
import type { CodexRunner } from './codex-runner.ts'
import { parseCodexOutput } from './parse-codex-output.ts'

/** Codex-backed synthesis, enabled by the operator override recorded in
 * boundary-decision.json. Every failure mode returns needsClaude - a codex
 * error, quota exhaustion, or unparseable output routes the clip to
 * needs-claude with the evidence, never into the brain; the hard validator
 * and the human review gate still stand between whatever codex wrote and a
 * commit. */
export const codexSynthesizer = (runner: CodexRunner): Synthesizer => ({
  synthesize: async ({ clipDirectory, worktree, guidance }) => {
    const prompt = codexPrompt(join(clipDirectory, 'index.md'), guidance)
    const identity = {
      model: CODEX_IDENTITY_MODEL,
      promptSha256: sha256Hex(prompt),
      boundary: 'codex-danger-full-access',
    }
    const result = await runner.run(worktree, prompt)
    if (result.exitCode !== 0) {
      return {
        pagesTouched: [],
        needsClaude: true,
        skipped: false,
        reason: `codex exec exited ${String(result.exitCode)}: ${result.stderrTail.slice(-500)}`,
        identity,
      }
    }
    const parsed = parseCodexOutput(result.lastMessage)
    if (parsed === null) {
      return {
        pagesTouched: [],
        needsClaude: true,
        skipped: false,
        reason: 'codex produced no parseable output (PROMPT_OUTPUT_INVALID)',
        identity,
      }
    }
    return { ...parsed, identity }
  },
})
