import { demotedVerdictForClip } from '../classifications/demoted-verdict-for-clip.ts'
import { readLatestVerdicts } from '../classifications/read-latest-verdicts.ts'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { discoverClips } from '../clips/discover-clips.ts'
import { orderClips } from '../clips/order-clips.ts'
import { readSensitiveDomains } from '../routing/read-sensitive-domains.ts'
import { routeClip } from '../routing/route-clip.ts'
import { deriveClipState } from '../state/derive-clip-state.ts'
import { dryRunSuffix } from './dry-run-suffix.ts'
import { matchesClipFilter } from './matches-clip-filter.ts'

/** `--dry-run` guarantees (SPEC:285-288): no modification to either
 * repository, no commit, no push, no state update. This implementation goes
 * further than the spec allows for and opens no worktree at all: it derives,
 * routes, and prints what a real run would do. */
export const ingestDryRun = async (
  brainRepository: string,
  clipsRepository: string,
  clipFilter: string | null,
): Promise<number> => {
  const domains = await readSensitiveDomains(brainRepository)
  const verdicts = await readLatestVerdicts(clipsRepository)
  const clips = orderClips(await discoverClips(clipsRepository))
  for (const clip of clips) {
    if (!matchesClipFilter(clip, clipFilter)) continue
    const evidence = await deriveClipState({
      clip,
      brainRepository,
      clipsRepository,
    })
    if (clip.kind === 'thin') {
      process.stdout.write(
        `${clip.directory}: ${evidence.state} (${evidence.reason})\n`,
      )
      continue
    }
    const suffix = dryRunSuffix(
      evidence.state,
      demotedVerdictForClip(verdicts, clip),
      routeClip(clip.metadata, domains).route,
    )
    process.stdout.write(
      `${clip.metadata.clip_id}: ${evidence.state} (${evidence.reason})${suffix}\n`,
    )
  }
  return EXIT_CODE.success
}
