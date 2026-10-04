import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { repositoryPageDirectories } from '../layout/repository-page-directories.ts'
import type { Synthesizer } from '../synthesis/synthesizer.ts'
import { runWorkerSelection } from './run-worker-selection.ts'
import { runWorkerWriting } from './run-worker-writing.ts'
import { trackWorkerJobIds } from './track-worker-job-ids.ts'
import { workerAuthorModel } from './worker-author-model.ts'
import { WORKER_SYNTHESIS_BOUNDARY } from './worker-synthesis-boundary.ts'
import { workerSynthesisEscalation } from './worker-synthesis-escalation.ts'
import type { WorkerSynthesisPort } from './worker-synthesis-port.ts'

/** Synthesis through the worker queue, in two tool-less passes.
 *
 * The first shows the model the clip and the index and asks which pages it
 * belongs in; the second shows it the clip and those pages whole and takes
 * back complete pages, which this engine writes into the worktree. Two passes
 * because the model has no tools and a local window does not hold the wiki.
 *
 * The author is who the coordinator says answered, so the author/verifier
 * guard sees the model that wrote the page and not the one that was asked for.
 * Every failure - an unreadable clip, a prompt too large for the window, a job
 * with no answer, an answer of the wrong shape, a path outside the page
 * directories - returns `needsClaude` with nothing written, and the validator
 * and the human review gate still stand after a success.
 *
 * Every job the run submitted is named on the result, failures included, so
 * the clip's run history can link to them.
 *
 * `today` is injected so the prompt's `updated:` date is testable. */
export const workerSynthesizer = (
  port: WorkerSynthesisPort,
  today: () => string = () => new Date().toISOString().slice(0, 10),
): Synthesizer => ({
  synthesize: async ({ clipDirectory, worktree, guidance }) => {
    const tracked = trackWorkerJobIds(port)
    const unsent = {
      model: workerAuthorModel(null),
      promptSha256: '',
      boundary: WORKER_SYNTHESIS_BOUNDARY,
    }
    const clipText = await readFile(
      join(clipDirectory, 'index.md'),
      'utf8',
    ).catch(() => null)
    if (clipText === null)
      return {
        ...workerSynthesisEscalation('clip index.md is not readable', unsent),
        workerJobIds: [],
      }
    const directories = repositoryPageDirectories()
    const selection = await runWorkerSelection(
      tracked.port,
      clipText,
      worktree,
      directories,
    )
    if ('refusal' in selection)
      return {
        ...workerSynthesisEscalation(selection.refusal, {
          ...unsent,
          model: workerAuthorModel(selection.executor),
        }),
        workerJobIds: tracked.jobIds,
      }
    const written = await runWorkerWriting(tracked.port, {
      clipText,
      shown: selection.shown,
      worktree,
      directories,
      today: today(),
      guidance,
    })
    return { ...written, workerJobIds: tracked.jobIds }
  },
})
