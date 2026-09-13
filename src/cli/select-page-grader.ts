import { grade } from '../commands/grade.ts'
import type { PageGrader } from '../grade/page-grader.ts'

/** `--grade` wires the grade pass into the ingest run itself; without it the
 * run is ungraded, which is what every batch before 2026-08-02 was. Off by
 * default because grading doubles the codex quota a clip costs, and a flag was
 * the cheaper of the two shapes the backlog weighed against grading every
 * page. */
export const selectPageGrader = (enabled: boolean): PageGrader | null =>
  enabled ? { grade } : null
