import { existsSync } from 'node:fs'
import { fetchUndrainedCaptures } from '../capture/fetch-undrained-captures.ts'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { discoverClips } from '../clips/discover-clips.ts'
import { clippedArticleKeys } from '../harvest/promote/clipped-article-keys.ts'
import { drainCaptures } from './drain-captures.ts'
import { formatDrainSummary } from './format-drain-summary.ts'

/** Take the phone's captures out of the capture service and into the clip
 * store.
 *
 * The direction is the design, not an implementation detail: the service holds
 * no GitHub credential and never pushes anywhere, so draining is a pull from
 * the machine that already has the credentials. The per-capture loop and its
 * failure shape are in `drainCaptures`.
 * SPEC: docs/superpowers/specs/2026-08-04-capture-service-design.md */
export const drain = async (
  clipsRepository: string,
  limit: number,
  dryRun: boolean,
): Promise<number> => {
  if (!existsSync(clipsRepository)) {
    process.stderr.write(
      `${clipsRepository} does not exist; run \`clips pull\` first\n`,
    )
    return EXIT_CODE.fatalLocal
  }

  let captures
  try {
    captures = await fetchUndrainedCaptures(limit)
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return EXIT_CODE.fatalLocal
  }
  process.stdout.write(formatDrainSummary(captures))
  if (captures.length === 0) return EXIT_CODE.success
  if (dryRun) {
    process.stdout.write('dry run: nothing fetched, nothing marked drained\n')
    return EXIT_CODE.success
  }

  const clippedKeys = clippedArticleKeys(await discoverClips(clipsRepository))
  const { clipped, alreadyClipped, withoutBody, failed } = await drainCaptures(
    captures,
    clipsRepository,
    clippedKeys,
  )
  process.stdout.write(
    `  clips written    ${String(clipped)}\n  without a body   ${String(withoutBody)}\n  already clipped  ${String(alreadyClipped)}\n`,
  )
  if (failed > 0) {
    process.stderr.write(
      `${String(failed)} captures stay in the inbox for the next run\n`,
    )
    return EXIT_CODE.fatalLocal
  }
  if (clipped + withoutBody > 0)
    process.stdout.write(
      'commit the new clips in the configured capture archive, then run `clips ingest`\n',
    )
  return EXIT_CODE.success
}
