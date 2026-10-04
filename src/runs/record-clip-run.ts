import { mkdir, writeFile } from 'node:fs/promises'
import type { ClipRun } from './clip-run.ts'
import { clipRunsDirectory } from './clip-runs-directory.ts'
import { clipRunsPath } from './clip-runs-path.ts'
import { MAX_CLIP_RUNS } from './max-clip-runs.ts'
import { readClipRuns } from './read-clip-runs.ts'

/** Append one run to the clip's history. Never throws: the history is an
 * observation for a dashboard, and failing to keep it must not cost the clip
 * its synthesis. A failure is named on stderr instead. */
export const recordClipRun = async (
  brainRepository: string,
  clipId: string,
  run: ClipRun,
): Promise<void> => {
  try {
    const directory = await clipRunsDirectory(brainRepository)
    if (directory === null) return
    const runs = [...(await readClipRuns(directory, clipId)), run].slice(
      -MAX_CLIP_RUNS,
    )
    await mkdir(directory, { recursive: true })
    await writeFile(
      clipRunsPath(directory, clipId),
      `${JSON.stringify(runs, null, 2)}\n`,
    )
  } catch (error) {
    process.stderr.write(
      `${clipId}: the run was not recorded: ${error instanceof Error ? error.message : String(error)}\n`,
    )
  }
}
