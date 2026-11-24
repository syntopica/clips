import { LOCAL_GRADE_TIER } from './local-grade-tier.ts'
import { OPENROUTER_GRADE_TIER } from './openrouter-grade-tier.ts'

/** The worker executor providers each grade tier is served by, as a result's
 * `executor.provider` names them: the inverse of what `workerAuthorTiers`
 * reads. Both agy tiers share the `agy` provider, so the worker can only be
 * asked to leave out all of agy, never one of its two model families. */
export const GRADE_TIER_PROVIDERS: Readonly<Record<string, readonly string[]>> =
  {
    codex: ['codex'],
    cursor: ['cursor'],
    'agy-fine': ['agy'],
    'agy-bulk': ['agy'],
    [LOCAL_GRADE_TIER]: ['ollama', 'local-cpu'],
    [OPENROUTER_GRADE_TIER]: ['openrouter'],
  }
