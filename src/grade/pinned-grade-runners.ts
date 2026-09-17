import { agyBulkGrader } from './agy-bulk-grader.ts'
import { agyFineGrader } from './agy-fine-grader.ts'
import { cursorGrader } from './cursor-grader.ts'
import type { GradeRunner } from './grade-runner.ts'
import { runCodexGrade } from './run-codex-grade.ts'

/** Every transport a caller may pin, by the name `CLIPS_GRADE_RUNNER` takes. */
export const PINNED_GRADE_RUNNERS: Readonly<Record<string, GradeRunner>> = {
  codex: runCodexGrade,
  'agy-fine': agyFineGrader,
  'agy-bulk': agyBulkGrader,
  cursor: cursorGrader,
}
