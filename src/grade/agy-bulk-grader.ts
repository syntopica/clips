import { AGY_BULK_MODEL } from '../models/agy-bulk-model.ts'
import type { GradeRunner } from './grade-runner.ts'
import { agyGradeRunner } from './run-agy-grade.ts'

/** Grading on the bulk tier. Not the default: grading is judgement over a
 * handful of pages per batch, which is what the fine tier is for. This exists
 * for the case where every fine quota is gone and a graded page on a cheaper
 * model still beats an ungraded one. */
export const agyBulkGrader: GradeRunner = agyGradeRunner(AGY_BULK_MODEL)
