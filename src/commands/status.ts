import { existsSync } from 'node:fs'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { discoverClips } from '../clips/discover-clips.ts'
import { clippedArticleKeys } from '../harvest/promote/clipped-article-keys.ts'
import { formatUnfetchedRuns } from '../harvest/promote/format-unfetched-runs.ts'
import { unfetchedRuns } from '../harvest/promote/unfetched-runs.ts'
import { deriveClipState } from '../state/derive-clip-state.ts'
import { formatStatusLine } from './format-status-line.ts'

/** Read-only. Nothing here writes, so it needs no lock, only the preflight
 * below: without it, a clips repository that was never pulled reads back as
 * zero clips everywhere, indistinguishable from a healthy, fully processed
 * store.
 *
 * Only `inconsistent` sets exit 2 - decision 4. An `unreadable` clip is printed
 * and counted, and the process still exits 0: a thin clip is a known, accepted
 * gap until plan 2d, and counting it as an error would make `clips status` exit
 * non-zero on every run and be unusable under `set -e`. Ticked-but-unclipped
 * articles print under the same rule and for the same reason: a Medium 403 is
 * intermittent and the next promote retries it, so the report names the gap
 * without turning the store's health check into a fetch alarm.
 *
 * The whole body is guarded, as in `pull()`. `readSubdirectories` deliberately
 * rethrows anything that is not ENOENT/ENOTDIR - EACCES on the clips repository
 * chief among them - and an unguarded throw here escapes runCli and the
 * top-level await in main.ts, so the operator gets a raw stack trace where an
 * exit code and one sentence belong. */
export const status = async (
  brainRepository: string,
  clipsRepository: string,
): Promise<number> => {
  try {
    if (!existsSync(clipsRepository)) {
      process.stderr.write(
        `${clipsRepository} does not exist; run \`clips pull\` first\n`,
      )
      return EXIT_CODE.fatalLocal
    }
    const clips = await discoverClips(clipsRepository)
    let inconsistent = 0
    let unreadable = 0
    for (const clip of clips) {
      const evidence = await deriveClipState({
        clip,
        brainRepository,
        clipsRepository,
      })
      if (evidence.state === 'inconsistent') inconsistent += 1
      if (evidence.state === 'unreadable') unreadable += 1
      process.stdout.write(`${formatStatusLine(clip, evidence)}\n`)
    }
    process.stdout.write(
      `\n${String(clips.length)} clips, ${String(inconsistent)} inconsistent, ${String(unreadable)} unreadable\n`,
    )
    process.stdout.write(
      formatUnfetchedRuns(
        await unfetchedRuns(brainRepository, clippedArticleKeys(clips)),
      ),
    )
    return inconsistent === 0 ? EXIT_CODE.success : EXIT_CODE.clipsStopped
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return EXIT_CODE.fatalLocal
  }
}
