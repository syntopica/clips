import { existsSync } from 'node:fs'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { discoverClips } from '../clips/discover-clips.ts'
import { configuredRunner } from '../config/configured-runner.ts'
import { computeGradeTotals } from '../grade/compute-grade-totals.ts'
import { formatGradeReport } from '../grade/format-grade-report.ts'
import { gradePage } from '../grade/grade-page.ts'
import { selectGradeRunner } from '../grade/select-grade-runner.ts'

/** The external-grader pass: a second model, which never saw the synthesis,
 * asked whether a page claims anything its cited clips do not say. Read-only in
 * both repositories - it reports, it never edits, because a grader that repairs
 * its own findings is a generator again.
 *
 * Exit 2 when anything is unsupported OR when any page could not be graded.
 * Both are results the operator has to look at, and collapsing "not graded"
 * into success is exactly the silence this pass exists to break. A page
 * declaring `verification: exempt` is neither: it maintains itself elsewhere
 * and has no evidence here, so counting it as ungraded would fire on every
 * future batch and teach the operator to ignore the number. `clips audit` is
 * what keeps the exemption honest, by reporting every page that needs one and
 * has not declared it.
 *
 * `author` is the model that wrote these pages, when a synthesis run is there
 * to report it. Null is the honest answer for a page handed to the standalone
 * command, which has no run behind it, and the guard reads the configured
 * transport instead. */
export const grade = async (
  brainRepository: string,
  clipsRepository: string,
  pages: readonly string[],
  author: string | null,
): Promise<number> => {
  try {
    if (pages.length === 0) {
      process.stderr.write('grade needs at least one --page <path>\n')
      return EXIT_CODE.fatalLocal
    }
    if (!existsSync(clipsRepository)) {
      process.stderr.write(
        `${clipsRepository} does not exist; run \`clips pull\` first\n`,
      )
      return EXIT_CODE.fatalLocal
    }
    const runner = selectGradeRunner(configuredRunner('grade'), author)
    const clips = await discoverClips(clipsRepository)
    const graded = []
    for (const page of pages) {
      graded.push(await gradePage(brainRepository, page, clips, runner))
    }
    process.stdout.write(formatGradeReport(graded))
    const { unsupported, uncheckable, misattributed, ungraded, exempt } =
      computeGradeTotals(graded)
    process.stdout.write(
      `\n${String(graded.length)} pages, ${String(unsupported)} unsupported claims, ${String(misattributed)} misattributed, ${String(uncheckable)} uncheckable, ${String(ungraded)} not graded, ${String(exempt)} exempt\n`,
    )
    return unsupported === 0 && misattributed === 0 && ungraded === 0
      ? EXIT_CODE.success
      : EXIT_CODE.clipsStopped
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return EXIT_CODE.fatalLocal
  }
}
