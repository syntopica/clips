import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { indexRepositoryPath } from '../layout/index-repository-path.ts'
import { parseWorkerSelection } from './parse-worker-selection.ts'
import { readShownPages } from './read-shown-pages.ts'
import type { WorkerSelectionOutcome } from './worker-selection-outcome.ts'
import { workerSelectionPrompt } from './worker-selection-prompt.ts'
import { WORKER_SELECTION_SCHEMA } from './worker-selection-schema.ts'
import type { WorkerSynthesisPort } from './worker-synthesis-port.ts'

/** The first worker pass: the clip and the index in, the chosen pages read
 * whole out of the worktree. An index that cannot be read is sent empty, and
 * the model can still say the clip needs a human. 4 KB is room for an answer
 * of two paths and a sentence. */
export const runWorkerSelection = async (
  port: WorkerSynthesisPort,
  clipText: string,
  worktree: string,
  directories: readonly string[],
): Promise<WorkerSelectionOutcome> => {
  const indexText = await readFile(
    join(worktree, indexRepositoryPath()),
    'utf8',
  ).catch(() => '')
  const selected = await port.infer(
    'select',
    workerSelectionPrompt(clipText, indexText, directories),
    WORKER_SELECTION_SCHEMA,
    4096,
  )
  if ('failure' in selected)
    return { refusal: `selection: ${selected.failure}`, executor: null }
  const selection = parseWorkerSelection(selected.text)
  if (selection === null)
    return {
      refusal: `the worker's selection was not parseable (PROMPT_OUTPUT_INVALID): ${selected.text.slice(-300)}`,
      executor: selected.executor,
    }
  if (selection.needs_claude)
    return { refusal: selection.reason, executor: selected.executor }
  return {
    shown: await readShownPages(worktree, selection.pages, directories),
  }
}
