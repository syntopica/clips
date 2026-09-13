import { AGY_FINE_MODEL } from '../models/agy-fine-model.ts'
import type { GradeRunner } from './grade-runner.ts'
import { agyGradeRunner } from './run-agy-grade.ts'

/** Grading on the fine tier, and the transport behind codex. A grader reads a
 * handful of pages per batch and its answer is acted on without anything
 * downstream re-reading it, which is the definition of work that belongs on the
 * better model even though its quota empties faster. */
export const agyFineGrader: GradeRunner = agyGradeRunner(AGY_FINE_MODEL)
