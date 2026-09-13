import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CodexRunner } from '../codex/codex-runner.ts'
import { parseCodexOutput } from '../codex/parse-codex-output.ts'
import { sha256Hex } from '../harvest/promote/sha256-hex.ts'
import type { Synthesizer } from '../synthesis/synthesizer.ts'
import { AGY_PROMPT_CEILING_BYTES } from './agy-prompt-ceiling-bytes.ts'
import { agySynthesisPrompt } from './agy-synthesis-prompt.ts'
import { overCeilingPromptFailure } from './over-ceiling-prompt-failure.ts'

/** agy-backed synthesis. The clip is read here rather than handed over as a
 * path, because agy told to open a file skims it or hunts the filesystem for
 * it; `parseCodexOutput` is reused because the final-message contract is
 * synthesis's, not codex's.
 *
 * Inlining the clip is also what puts a ceiling on it, checked before the run
 * rather than after: past `AGY_PROMPT_CEILING_BYTES` the process never starts,
 * and `spawn E2BIG` says neither how big the clip was nor which transport has
 * room. Refusing up front is the same answer with the numbers attached.
 *
 * Every failure mode returns needsClaude - an unreadable clip, an oversized
 * one, a non-zero exit, an envelope that carries no verdict - so a transport
 * problem routes the clip to needs-claude with its evidence and never into the
 * brain. */
export const agySynthesizer = (
  runner: CodexRunner,
  model: string,
): Synthesizer => ({
  synthesize: async ({ clipDirectory, worktree, guidance }) => {
    // An unreadable clip never becomes a prompt, so there is nothing to hash.
    // The empty string says that; a hash of "" would read like a real one.
    const unread = { model, promptSha256: '', boundary: 'agy-accept-edits' }
    const clipText = await readFile(
      join(clipDirectory, 'index.md'),
      'utf8',
    ).catch(() => null)
    if (clipText === null)
      return {
        pagesTouched: [],
        needsClaude: true,
        skipped: false,
        reason: 'clip index.md is not readable',
        identity: unread,
      }
    const prompt = agySynthesisPrompt(clipText, worktree, guidance)
    const promptBytes = Buffer.byteLength(prompt, 'utf8')
    // A prompt too large to spawn is never sent, so it is hashed like the clip
    // that could not be read: `promptSha256` is of the prompt the model saw,
    // and a hash here would record one it never did.
    if (promptBytes > AGY_PROMPT_CEILING_BYTES)
      return {
        pagesTouched: [],
        needsClaude: true,
        skipped: false,
        reason: overCeilingPromptFailure(promptBytes, AGY_PROMPT_CEILING_BYTES),
        identity: unread,
      }
    const identity = { ...unread, promptSha256: sha256Hex(prompt) }
    const result = await runner.run(worktree, prompt)
    if (result.exitCode !== 0)
      return {
        pagesTouched: [],
        needsClaude: true,
        skipped: false,
        reason: `agy exited ${String(result.exitCode)}: ${result.stderrTail.slice(-500)}`,
        identity,
      }
    const parsed = parseCodexOutput(result.lastMessage)
    if (parsed === null)
      return {
        pagesTouched: [],
        needsClaude: true,
        skipped: false,
        reason: `agy produced no parseable output (PROMPT_OUTPUT_INVALID): ${result.stderrTail.slice(-300)}`,
        identity,
      }
    return { ...parsed, identity }
  },
})
