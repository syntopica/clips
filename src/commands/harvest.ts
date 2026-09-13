import { EXIT_CODE } from '../cli/exit-code.ts'
import { harvestDate } from '../harvest/harvest-date.ts'
import { HARVEST_SOURCES } from '../harvest/harvest-sources.ts'
import { isKnownSource } from '../harvest/is-known-source.ts'
import { promote } from '../harvest/promote/promote.ts'
import { runHarvest } from '../harvest/run-harvest.ts'
import type { HarvestOptions } from './harvest-options.ts'

/** Two lanes behind one command: `--promote` re-reads a previous run's ticks,
 * everything else sweeps the collectors. Both need the same date and the same
 * guard, which is all this file does.
 *
 * The whole body is guarded, as in `pull()` and `status()`. Every stage past
 * the collectors throws on its own terms - `classifyArticles` on a codex
 * failure, `countExistingTriage` and `writeTriageOutput` on an unreadable or
 * unwritable inbox, and `promote()` on the clip store it walks - and an
 * unguarded throw here escapes runCli and the top-level await in main.ts, so
 * the operator gets a raw stack trace where an exit code and one sentence
 * belong.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const harvest = async (
  brainRepository: string,
  clipsRepository: string,
  options: HarvestOptions,
): Promise<number> => {
  try {
    const date = options.date ?? harvestDate(new Date())
    if (options.promote)
      return await promote(
        brainRepository,
        clipsRepository,
        date,
        options.captureAll,
      )
    if (!isKnownSource(options.source)) {
      process.stderr.write(
        `unknown source: ${String(options.source)} (expected one of ${HARVEST_SOURCES.join(', ')})\n`,
      )
      return EXIT_CODE.fatalLocal
    }
    return await runHarvest(brainRepository, date, options)
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return EXIT_CODE.fatalLocal
  }
}
