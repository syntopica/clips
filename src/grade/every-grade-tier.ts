import { LOCAL_GRADE_TIER } from './local-grade-tier.ts'
import { OPENROUTER_GRADE_TIER } from './openrouter-grade-tier.ts'

/** Every tier a page could be graded on, which is also the answer that leaves
 * the author/verifier guard with nowhere safe to go.
 *
 * Used as the conservative reading of an author the grade lane does not
 * recognise: an unknown model may be any of these, so none of them can be
 * ruled free. The local and OpenRouter tiers are here because the worker's
 * grade queue can fall through to either. */
export const EVERY_GRADE_TIER: readonly string[] = [
  'codex',
  'agy-fine',
  'agy-bulk',
  'cursor',
  LOCAL_GRADE_TIER,
  OPENROUTER_GRADE_TIER,
]
