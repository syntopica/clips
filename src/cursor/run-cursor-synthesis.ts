import type { CodexRunner } from '../codex/codex-runner.ts'
import { unwrapCursorResponse } from '../grade/unwrap-cursor-response.ts'
import { cursorJsonPayload } from './cursor-json-payload.ts'
import { cursorSynthesisArgs } from './cursor-synthesis-args.ts'
import { runCursorAgent } from './run-cursor-agent.ts'

/** The Cursor CLI as a synthesis transport, so a run needs neither codex
 * credits nor agy quota. Added 2026-09-11 on the owner's instruction, the
 * account having sat unused.
 *
 * `CodexRunner` is the type because it is the synthesis process boundary -
 * worktree in, final message out - and only its name is codex-specific, the
 * same reasoning `agySynthesisRunner` records.
 *
 * The worktree reaches the model two ways at once, and both are wanted.
 * `--workspace` is what the process actually writes under; the prompt names the
 * same path absolutely because it is `agySynthesisPrompt`, written for a
 * transport with no working directory at all. Carrying one prompt shape across
 * both is worth more than tailoring it.
 *
 * Twenty minutes, SIGKILL, matching the codex and agy runners. That is longer
 * than it sounds here: a 480 KB prompt on this transport was measured at 465
 * seconds, so a large clip can legitimately use a third of the budget before
 * the model has written anything.
 *
 * An empty envelope is carried on the failure tail rather than dropped. It is
 * the shape this transport produces when a prompt is too large - exit 0, no
 * output, no error - and the escalation has to be able to say so instead of
 * reporting a model that declined. */
export const cursorSynthesisRunner = (model: string): CodexRunner => ({
  run: async (worktree, prompt) => {
    const result = await runCursorAgent(
      cursorSynthesisArgs(worktree, model),
      prompt,
      20 * 60 * 1000,
    )
    if (result.failed)
      return {
        exitCode: 1,
        lastMessage: null,
        stderrTail: [result.stderr, result.stdout]
          .filter((part) => part !== '')
          .join(' | ')
          .slice(-2000),
      }
    // The envelope's answer is prose with the contract object at the end of it,
    // not the bare object codex and agy are made to return by their schema
    // flags. Digging the object out here rather than in the synthesizer keeps
    // `parseCodexOutput` shared with the transports that do have a schema.
    const answer = unwrapCursorResponse(result.stdout)
    const lastMessage = answer === null ? null : cursorJsonPayload(answer)
    return {
      exitCode: 0,
      lastMessage,
      // Carrying the model's own words, not the envelope, when the object is
      // missing: the answer is where a refusal or a half-finished turn says so,
      // and an empty tail on a non-null answer is what made the first failure
      // of this kind unreadable.
      stderrTail:
        lastMessage === null ? (answer ?? result.stdout).slice(-400) : '',
    }
  },
})
