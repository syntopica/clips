import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { agySynthesisPrompt } from '../agy/agy-synthesis-prompt.ts'
import type { CodexRunner } from '../codex/codex-runner.ts'
import { parseCodexOutput } from '../codex/parse-codex-output.ts'
import { sha256Hex } from '../harvest/promote/sha256-hex.ts'
import type { Synthesizer } from '../synthesis/synthesizer.ts'
import { cursorEscalation } from './cursor-escalation.ts'
import { CURSOR_IDENTITY_MODEL } from './cursor-identity-model.ts'
import { cursorOverCeilingFailure } from './cursor-over-ceiling-failure.ts'
import { CURSOR_PROMPT_CEILING_BYTES } from './cursor-prompt-ceiling-bytes.ts'

/** Cursor-backed synthesis.
 *
 * The prompt is `agySynthesisPrompt` unchanged, and reusing it is a decision
 * rather than a shortcut. It inlines the clip and names every path absolutely,
 * which agy needs because it has no working directory; cursor has one and does
 * not need it, but absolute paths are correct on both and one prompt means one
 * place to fix a synthesis instruction. Sharing it also keeps `promptSha256`
 * comparable across transports, so the ledger can answer whether two runs saw
 * the same thing.
 *
 * The ledger records `cursor` as the model, not the model string. Which model
 * answered is the CLI's configuration and this process never reads it back, so
 * naming the transport is the only claim it can actually support - the same
 * choice `CODEX_IDENTITY_MODEL` makes, and what lets `gradeTiersOfAuthor`
 * recognise the author later.
 *
 * Every failure mode returns `needsClaude`: an unreadable clip, an oversized
 * one, a failed run, an envelope with no verdict. A transport problem routes
 * the clip to needs-claude carrying its evidence and never into the brain, and
 * the validator and the human review gate still stand between whatever was
 * written and a commit. */
export const cursorSynthesizer = (runner: CodexRunner): Synthesizer => ({
  synthesize: async ({ clipDirectory, worktree, guidance }) => {
    // An unreadable clip and an unsent prompt are both hashed as the empty
    // string: `promptSha256` is of the prompt the model saw, and a hash of one
    // it never received would read exactly like a real one.
    const unread = {
      model: CURSOR_IDENTITY_MODEL,
      promptSha256: '',
      boundary: 'cursor-force',
    }
    const clipText = await readFile(
      join(clipDirectory, 'index.md'),
      'utf8',
    ).catch(() => null)
    if (clipText === null)
      return cursorEscalation('clip index.md is not readable', unread)
    const prompt = agySynthesisPrompt(clipText, worktree, guidance)
    const promptBytes = Buffer.byteLength(prompt, 'utf8')
    if (promptBytes > CURSOR_PROMPT_CEILING_BYTES)
      return cursorEscalation(
        cursorOverCeilingFailure(promptBytes, CURSOR_PROMPT_CEILING_BYTES),
        unread,
      )
    const identity = { ...unread, promptSha256: sha256Hex(prompt) }
    const result = await runner.run(worktree, prompt)
    if (result.exitCode !== 0)
      return cursorEscalation(
        `cursor exited ${String(result.exitCode)}: ${result.stderrTail.slice(-500)}`,
        identity,
      )
    const parsed = parseCodexOutput(result.lastMessage)
    if (parsed === null)
      return cursorEscalation(
        `cursor produced no parseable output (PROMPT_OUTPUT_INVALID): ${result.stderrTail.slice(-300)}`,
        identity,
      )
    return { ...parsed, identity }
  },
})
