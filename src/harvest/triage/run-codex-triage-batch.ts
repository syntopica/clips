import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { currentSyntopicaConfig } from '../../config/current-syntopica-config.ts'
import { runCommand } from '../run-command.ts'
import type { CodexTriageResult } from './codex-triage-result.ts'
import { configuredTriageTopics } from './configured-triage-topics.ts'
import { isCodexOutOfCredits } from './is-codex-out-of-credits.ts'
import { triageOutputSchema } from './triage-output-schema.ts'
import { triagePrompt } from './triage-prompt.ts'

/** One codex classification call, reporting the credit wall separately.
 *
 * Extracted from `runTriageCodex` so the fallback runner can tell "codex has no
 * credits and never will until someone pays" apart from "this batch failed",
 * which are the same `null` from the outside.
 *
 * Deliberately the opposite profile to `runCodexExec`. That one runs
 * `danger-full-access` at `xhigh` because a human approves its diff. This one
 * classifies untrusted third-party titles harvested from the open web, so it
 * runs `-s read-only` with no `--search`: a prompt-injection payload inside a
 * title reaches a process that can neither write nor reach the network. It is
 * also the cheap end of the model range, `gpt-5.5` at `low`, because the task is
 * classification over short strings and the measured run showed no benefit from
 * more.
 *
 * The scratch directory is the working root rather than the brain, so the
 * process is never pointed at the repository it feeds. */
export const runCodexTriageBatch = async (
  batch: string,
): Promise<CodexTriageResult> => {
  const scratch = await mkdtemp(join(tmpdir(), 'clips-triage-'))
  const schemaPath = join(scratch, 'output-schema.json')
  const lastMessagePath = join(scratch, 'last-message.json')
  const topics = configuredTriageTopics()
  await writeFile(schemaPath, JSON.stringify(triageOutputSchema(topics)))
  const pending = runCommand(
    'codex',
    [
      'exec',
      triagePrompt(batch, currentSyntopicaConfig().triageProfile, topics),
      '-C',
      scratch,
      '-m',
      'gpt-5.5',
      '-c',
      'model_reasoning_effort=low',
      '-s',
      'read-only',
      '--skip-git-repo-check',
      '--output-schema',
      schemaPath,
      '-o',
      lastMessagePath,
    ],
    {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
      timeout: 10 * 60 * 1000,
      killSignal: 'SIGKILL',
    },
  )
  pending.child.stdin?.end()

  let stdout: string
  let stderr: string
  try {
    const settled = await pending
    stdout = settled.stdout
    stderr = settled.stderr
  } catch (error) {
    // codex does not always exit non-zero on the credit wall, so both paths
    // have to be read for it rather than only the failure one.
    const failure = error as { stdout?: string; stderr?: string }
    stdout = failure.stdout ?? ''
    stderr = failure.stderr ?? ''
  }

  const message = await readFile(lastMessagePath, 'utf8').catch(() => null)
  return { message, outOfCredits: isCodexOutOfCredits(stdout, stderr) }
}
