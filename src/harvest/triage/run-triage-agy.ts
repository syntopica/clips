import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { currentSyntopicaConfig } from '../../config/current-syntopica-config.ts'
import { runCommand } from '../run-command.ts'
import { configuredTriageTopics } from './configured-triage-topics.ts'
import { triageOutputSchema } from './triage-output-schema.ts'
import { triagePrompt } from './triage-prompt.ts'
import type { TriageRunner } from './triage-runner.ts'
import { unwrapAgyResponse } from './unwrap-agy-response.ts'

/** The Antigravity CLI as a second transport for triage, so a codex outage does
 * not take the whole harvest down. Added 2026-08-01, the day codex started
 * answering `Your workspace is out of credits` and left `clips harvest` with no
 * classifier at all.
 *
 * Same prompt, same schema, different process. It is a transport swap and not a
 * behaviour change: the prompt is the one verified over 1462 titles, and the
 * schema is enforced by `--json-schema` exactly as `--output-schema` enforces
 * it for codex.
 *
 * Two things differ from the codex runner and both are load-bearing:
 * - agy has no `-C`, and it cannot be confined the way codex is with
 *   `-s read-only`, so this transport is the weaker of the two against a
 *   prompt-injection payload hidden in a harvested title. It is narrowed as far
 *   as the CLI allows: `--sandbox` for terminal restrictions, `--mode plan` so
 *   the session cannot edit, `--disable-slash-commands` so injected text cannot
 *   expand a command or skill, and **no `--dangerously-skip-permissions`**, so
 *   a tool request blocks and times out rather than being auto-approved. The
 *   flag was there until 2026-08-02 and bought nothing: classification needs no
 *   tools, because the batch is already in the prompt.
 * - The default `--print-timeout` is 5 minutes and a full batch prompt runs
 *   long, so it is raised here rather than left to trip on large batches.
 *
 * A non-zero exit or an unreadable envelope returns null, which degrades the
 * batch to "review" rather than losing it. */
export const agyTriageRunner = (model: string): TriageRunner => ({
  run: async (batch) => {
    const scratch = await mkdtemp(join(tmpdir(), 'clips-triage-agy-'))
    const schemaPath = join(scratch, 'output-schema.json')
    const topics = configuredTriageTopics()
    await writeFile(schemaPath, JSON.stringify(triageOutputSchema(topics)))
    const result = await runCommand(
      'agy',
      [
        '-p',
        triagePrompt(batch, currentSyntopicaConfig().triageProfile, topics),
        '--model',
        model,
        '--json-schema',
        schemaPath,
        '--output-format',
        'json',
        '--print-timeout',
        '20m',
        '--sandbox',
        '--mode',
        'plan',
      ],
      {
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        timeout: 25 * 60 * 1000,
        killSignal: 'SIGKILL',
      },
    ).catch(() => null)
    return result === null ? null : unwrapAgyResponse(result.stdout)
  },
})
