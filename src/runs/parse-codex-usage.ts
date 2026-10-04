import { completedTurnUsage } from './completed-turn-usage.ts'
import { finiteCountOrNull } from './finite-count-or-null.ts'
import type { RunUsage } from './run-usage.ts'

/** Sum the `usage` of every `turn.completed` event in `codex exec --json`
 * output (JSON Lines on stdout, per the codex non-interactive docs, checked
 * 2026-10-04 against codex-cli 0.159). Null when no turn completed: a run that
 * failed reports nothing rather than zero. */
export const parseCodexUsage = (stdout: string): RunUsage | null => {
  const turns = stdout.split('\n').flatMap((line) => {
    const usage = completedTurnUsage(line)
    return usage === null ? [] : [usage]
  })
  if (turns.length === 0) return null
  const total = {
    inputTokens: 0,
    outputTokens: 0,
    cachedInputTokens: 0,
    reasoningTokens: 0,
  }
  for (const turn of turns) {
    total.inputTokens += finiteCountOrNull(turn.input_tokens) ?? 0
    total.outputTokens += finiteCountOrNull(turn.output_tokens) ?? 0
    total.cachedInputTokens += finiteCountOrNull(turn.cached_input_tokens) ?? 0
    total.reasoningTokens +=
      finiteCountOrNull(turn.reasoning_output_tokens) ?? 0
  }
  return total
}
