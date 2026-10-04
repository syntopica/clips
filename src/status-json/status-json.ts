import { existsSync } from 'node:fs'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { discoverClips } from '../clips/discover-clips.ts'
import { deriveClipState } from '../state/derive-clip-state.ts'
import { resolveRecordedCommits } from '../state/resolve-recorded-commits.ts'
import { buildStatusDocument } from './build-status-document.ts'
import { clipCapturedAt } from './clip-captured-at.ts'
import type { EvaluatedClip } from './evaluated-clip.ts'
import type { StatusEntry } from './status-entry.ts'
import { statusItems } from './status-items.ts'

/** `clips status --json`: the same derivation as `clips status`, reduced to
 * counts and capture times before anything is written, so no clip's id, title,
 * url or text can reach the document. The exit code follows `clips status`
 * (2 when any clip is inconsistent) and the document is printed either way.
 *
 * The unfetched-run report is left out: it reads triage runs, not the store,
 * and it names articles.
 *
 * `items` adds the per-clip list from the same derivation, so a consumer that
 * wants both pays for one run (orbit polls this under a 2 s budget). */
export const statusJson = async (
  brainRepository: string,
  clipsRepository: string,
  now: Date,
  items = false,
): Promise<number> => {
  try {
    if (!existsSync(clipsRepository)) {
      process.stderr.write(
        `${clipsRepository} does not exist; run \`clips pull\` first\n`,
      )
      return EXIT_CODE.fatalLocal
    }
    const clips = await discoverClips(clipsRepository)
    const resolvedCommits = await resolveRecordedCommits(brainRepository, clips)
    const entries: StatusEntry[] = []
    const evaluated: EvaluatedClip[] = []
    for (const clip of clips) {
      const evidence = await deriveClipState({
        clip,
        brainRepository,
        clipsRepository,
        resolvedCommits,
      })
      entries.push({ state: evidence.state, capturedAt: clipCapturedAt(clip) })
      evaluated.push({ clip, evidence })
    }
    const document = {
      ...buildStatusDocument(entries, now),
      ...(items
        ? { items: await statusItems(brainRepository, evaluated) }
        : {}),
    }
    process.stdout.write(`${JSON.stringify(document)}\n`)
    return document.states.inconsistent === 0
      ? EXIT_CODE.success
      : EXIT_CODE.clipsStopped
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return EXIT_CODE.fatalLocal
  }
}
