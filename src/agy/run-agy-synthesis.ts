import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CODEX_OUTPUT_SCHEMA } from '../codex/codex-output-schema.ts'
import type { CodexRunner } from '../codex/codex-runner.ts'
import { agyFailureTail } from '../grade/agy-failure-tail.ts'
import { isCommandOutput } from '../grade/is-command-output.ts'
import { runCommand } from '../harvest/run-command.ts'
import { unwrapAgyResponse } from '../harvest/triage/unwrap-agy-response.ts'

/** The Antigravity CLI as a synthesis transport, so a run needs no codex
 * credits at all. Added 2026-08-02 on the owner's instruction, after the second
 * credit wall in a day.
 *
 * `CodexRunner` is the type because it is the synthesis process boundary -
 * worktree in, final message out - and only its name is codex-specific.
 * `CODEX_OUTPUT_SCHEMA` is shared for the same reason: the final-message
 * contract belongs to synthesis, not to a vendor.
 *
 * **This runner carries `--dangerously-skip-permissions` and `--mode
 * accept-edits`, and that is a deliberate operator override.** The grade runner
 * beside it refuses both flags on the argument that it inlines untrusted web
 * text into a session pointed at a repository holding live credentials, and
 * that argument applies here word for word - with the difference that a grader
 * needs no tools while a synthesizer must write files, so the safe
 * configuration and the task are mutually exclusive. Asked to choose, the owner
 * chose the transport (2026-08-02: "quita las restricciones"). The accepted
 * risk is the one already recorded for codex in boundary-decision.json: a
 * prompt-injection payload inside a clip can make the model read anything this
 * user can read and transmit it through the model channel.
 *
 * What still stands between it and the brain is unchanged and is not nothing:
 * the hard validator accepts only paths inside the five page directories plus
 * index.md, refuses a page marked `reviewed: true`, and a human approves every
 * diff before it is committed.
 *
 * `--add-dir` plus absolute paths in the prompt is what makes the worktree
 * reachable at all; see agySynthesisPrompt for the probe behind that. Twenty
 * minutes, SIGKILL, matching the codex runner. */
export const agySynthesisRunner = (model: string): CodexRunner => ({
  run: async (worktree, prompt) => {
    const scratch = await mkdtemp(join(tmpdir(), 'agy-ingest-'))
    const schemaPath = join(scratch, 'output-schema.json')
    await writeFile(schemaPath, JSON.stringify(CODEX_OUTPUT_SCHEMA))
    const result = await runCommand(
      'agy',
      [
        '-p',
        prompt,
        '--add-dir',
        worktree,
        '--model',
        model,
        '--mode',
        'accept-edits',
        '--dangerously-skip-permissions',
        '--disable-slash-commands',
        '--json-schema',
        schemaPath,
        '--output-format',
        'json',
        '--print-timeout',
        '20m',
      ],
      {
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        timeout: 20 * 60 * 1000,
        killSignal: 'SIGKILL',
      },
    ).catch((error: unknown) => error)
    if (!isCommandOutput(result))
      return {
        exitCode: 1,
        lastMessage: null,
        stderrTail: agyFailureTail(result),
      }
    const lastMessage = unwrapAgyResponse(result.stdout)
    // An envelope with no verdict is not self-explanatory, and the first time
    // it happened the cause was a 429 - "Individual quota reached ... Resets in
    // 3h" - reported to the operator as "no parseable output". Carrying the raw
    // tail lets the escalation say which of the two it was.
    return {
      exitCode: 0,
      lastMessage,
      stderrTail: lastMessage === null ? result.stdout.slice(-400) : '',
    }
  },
})
