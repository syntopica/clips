import { EXIT_CODE } from '../cli/exit-code.ts'
import type { HarvestOptions } from '../commands/harvest-options.ts'
import { collectHarvest } from './collect-harvest.ts'
import { formatHarvestSummary } from './format-harvest-summary.ts'
import { reportTriageGaps } from './report-triage-gaps.ts'
import { classifyArticles } from './triage/classify-articles.ts'
import { countExistingTriage } from './triage/count-existing-triage.ts'
import { harvestWindowStart } from './triage/harvest-window-start.ts'
import { markNewsletterSweep } from './triage/mark-newsletter-sweep.ts'
import { selectTriageRefiner } from './triage/select-triage-refiner.ts'
import { selectTriageRunner } from './triage/select-triage-runner.ts'
import { triageOutputPath } from './triage/triage-output-path.ts'
import { writeTriageOutput } from './triage/write-triage-output.ts'

/** The sweep itself: collect, classify, write one dated triage run.
 *
 * `--dry-run` stops after deduplication, which is the honest boundary because
 * classification is the first stage that spends anything.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const runHarvest = async (
  brainRepository: string,
  date: string,
  options: HarvestOptions,
): Promise<number> => {
  const since = options.since ?? harvestWindowStart(brainRepository, date)
  const run = await collectHarvest(options.source, date, since)
  process.stdout.write(formatHarvestSummary(date, run))
  process.stdout.write(`  mail since       ${since}\n`)
  process.stdout.write(`  saved articles   ${String(run.savedCount)}\n`)
  if (options.dryRun) {
    process.stdout.write('dry run: stopping before classification\n')
    return EXIT_CODE.success
  }
  if (run.articles.length === 0) {
    process.stderr.write(
      'nothing harvested - every requested collector came back empty\n',
    )
    return EXIT_CODE.fatalLocal
  }

  // Writing is destructive: the dated directory is replaced, ticks and all. A
  // run whose collectors partly failed must not quietly overwrite a fuller one
  // that already answered the same day.
  const directory = triageOutputPath(brainRepository, date)
  const existing = countExistingTriage(directory)
  if (existing > run.articles.length) {
    process.stderr.write(
      `refusing to overwrite: ${directory} already covers ${String(existing)} articles ` +
        `and this run found only ${String(run.articles.length)}; fix the skipped collector ` +
        'and rerun, or move that directory aside\n',
    )
    return EXIT_CODE.fatalLocal
  }

  const triaged = await classifyArticles(
    run.articles,
    selectTriageRunner(process.env['CLIPS_TRIAGE_RUNNER']),
    selectTriageRefiner(process.env['CLIPS_TRIAGE_REFINER']),
  )
  writeTriageOutput({
    brainRepository,
    date,
    emailCount: run.emailCount,
    linkCount: run.linkCount,
    articles: triaged,
  })
  process.stdout.write(`  triage written   ${directory}\n`)
  // Only a run that actually read newsletters may move the window; see
  // NEWSLETTER_SWEEP_MARKER for what advancing it on the others would cost.
  if (run.newsletterSwept) markNewsletterSweep(directory, since, run.emailCount)
  return reportTriageGaps(triaged, run.skipped)
    ? EXIT_CODE.success
    : EXIT_CODE.fatalLocal
}
