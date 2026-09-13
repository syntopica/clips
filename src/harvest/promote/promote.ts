import { EXIT_CODE } from '../../cli/exit-code.ts'
import { discoverClips } from '../../clips/discover-clips.ts'
import { triageOutputPath } from '../triage/triage-output-path.ts'
import { clippedArticleKeys } from './clipped-article-keys.ts'
import { formatEmptyRun } from './format-empty-run.ts'
import { formatPromoteFailures } from './format-promote-failures.ts'
import { formatPromotionSummary } from './format-promotion-summary.ts'
import { formatSkippedArticles } from './format-skipped-articles.ts'
import { HARVEST_CLIP_SOURCE } from './harvest-clip-source.ts'
import { mediumCookieJar } from './medium-cookie-jar.ts'
import { promoteArticles } from './promote-articles.ts'
import { readTickedArticles } from './read-ticked-articles.ts'
import { recordPromoteOutcome } from './record-promote-outcome.ts'
import { selectFreshArticles } from './select-fresh-articles.ts'

/** Fetch every article the user ticked in a dated triage run into the clip
 * store, ready for `clips ingest`.
 *
 * The exit code reflects whether anything failed, so a scripted caller can tell
 * a clean run from a partial one.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const promote = async (
  brainRepository: string,
  clipsRepository: string,
  date: string,
  captureAll = false,
): Promise<number> => {
  const directory = triageOutputPath(brainRepository, date)
  const ticked = readTickedArticles(directory, captureAll)
  if (ticked === null) return EXIT_CODE.fatalLocal
  process.stdout.write(formatPromotionSummary(directory, ticked))
  if (ticked.length === 0) {
    process.stdout.write(formatEmptyRun(captureAll))
    return EXIT_CODE.success
  }

  const fresh = selectFreshArticles(
    ticked,
    clippedArticleKeys(await discoverClips(clipsRepository)),
  )
  process.stdout.write(formatSkippedArticles(ticked.length - fresh.length))
  if (fresh.length === 0) {
    process.stdout.write('every ticked article is already in the clip store\n')
    return EXIT_CODE.success
  }

  const { written, failures } = await promoteArticles({
    articles: fresh,
    clippedFrom: HARVEST_CLIP_SOURCE,
    cookies: mediumCookieJar(),
    clipsRepository,
    brainRepository,
    now: new Date(),
  })
  const outstanding = await recordPromoteOutcome(
    directory,
    fresh,
    failures,
    new Date().toISOString(),
  )
  process.stdout.write(`  clips written    ${String(written)}\n`)
  process.stdout.write(formatPromoteFailures(outstanding))
  if (failures.length > 0) {
    process.stderr.write(
      `${String(failures.length)} of ${String(fresh.length)} articles could not be fetched\n`,
    )
    return EXIT_CODE.fatalLocal
  }
  process.stdout.write('run `clips ingest` to synthesize them into the brain\n')
  return EXIT_CODE.success
}
