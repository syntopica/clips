import { readLatestVerdicts } from '../classifications/read-latest-verdicts.ts'
import { EXIT_CODE } from '../cli/exit-code.ts'
import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { deriveClipState } from '../state/derive-clip-state.ts'
import type { ClipOutcome } from './clip-outcome.ts'
import { derivedStateAction } from './derived-state-action.ts'
import { formatIngestSummary } from './format-ingest-summary.ts'
import type { IngestDependencies } from './ingest-dependencies.ts'
import { ingestOneClip } from './ingest-one-clip.ts'
import { isSynthesizableClip } from './is-synthesizable-clip.ts'
import { matchesClipFilter } from './matches-clip-filter.ts'
import { reportDemotedClip } from './report-demoted-clip.ts'
import { reportUnprocessableClip } from './report-unprocessable-clip.ts'
import type { Repositories } from './repositories.ts'

/** The per-clip loop, in stable order. An inconsistent clip stops that clip
 * and is reported, never synthesized (SPEC:253-254); an unreadable one is a
 * known gap until plan 2d; `quit` ends the run cleanly.
 *
 * Stage 3 of the capture-first design reads the `latest` verdict view rather
 * than assuming every pending clip is still wanted: a re-classification run
 * that demotes a capture out of the `ingest` bucket now takes effect here
 * without moving any directory. A capture with no verdict is ingested - the
 * store only covers what a classification run has seen.
 *
 * The run closes with `formatIngestSummary`, which is where a run that changed
 * nothing says so instead of ending in silence and exit 0. */
export const ingestClips = async (
  repositories: Repositories,
  clips: (Clip | ThinClip)[],
  clipFilter: string | null,
  dependencies: IngestDependencies,
): Promise<number> => {
  const verdicts = await readLatestVerdicts(repositories.clips)
  const outcomes: ClipOutcome[] = []
  const matching = clips.filter((clip) => matchesClipFilter(clip, clipFilter))
  let stopped = 0
  for (const clip of matching) {
    const evidence = await deriveClipState({
      clip,
      brainRepository: repositories.brain,
      clipsRepository: repositories.clips,
    })
    const action = derivedStateAction(clip, evidence)
    if (action === 'report') {
      if (reportUnprocessableClip(clip, evidence)) stopped += 1
      continue
    }
    if (!isSynthesizableClip(clip, action)) continue
    if (reportDemotedClip(verdicts, clip)) continue
    const outcome = await ingestOneClip(
      repositories,
      clip,
      evidence,
      dependencies,
    )
    process.stdout.write(`${clip.metadata.clip_id}: ${outcome}\n`)
    outcomes.push(outcome)
    if (outcome === 'quit') break
    if (outcome === 'stopped') stopped += 1
  }
  process.stdout.write(
    formatIngestSummary(matching.length, outcomes, clipFilter),
  )
  return stopped === 0 ? EXIT_CODE.success : EXIT_CODE.clipsStopped
}
