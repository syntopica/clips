import { CURSOR_GRADE_MODEL } from '../models/cursor-grade-model.ts'
import type { GradeRunner } from './grade-runner.ts'
import { cursorGradeRunner } from './run-cursor-grade.ts'

/** Grading on the Cursor account: one tier, because one quota pool.
 *
 * The two-tier rule that splits agy into fine and bulk is about which quota a
 * pass may spend, and Cursor has a single subscription behind every model it
 * offers. Splitting it would name a distinction the billing does not make, and
 * the author/verifier guard would still have to refuse the whole account
 * whenever any of it wrote a page. */
export const cursorGrader: GradeRunner = cursorGradeRunner(CURSOR_GRADE_MODEL)
