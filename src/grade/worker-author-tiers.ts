import { WORKER_AUTHOR_PREFIX } from '../worker-synthesis/worker-author-prefix.ts'
import { agyTiersOfModel } from './agy-tiers-of-model.ts'
import { LOCAL_GRADE_TIER } from './local-grade-tier.ts'
import { OPENROUTER_GRADE_TIER } from './openrouter-grade-tier.ts'

/** The grade tiers a worker executor occupies, or null when the name is not a
 * worker executor or names a provider this lane cannot place.
 *
 * The name is `worker:<provider>/<model>` as the coordinator reported it, and
 * it is read for a page's author and for its grader alike. A local backend is
 * the local tier and OpenRouter its own; a runner CLI is the tier that CLI
 * grades on. agy is the tier its model names when the profile pins one of the
 * two this engine knows, and both tiers otherwise, because the model is then
 * the CLI's own choice. `unreported`, and any provider added later, is null -
 * which refuses every tier until this map learns it. */
export const workerAuthorTiers = (model: string): readonly string[] | null => {
  if (!model.startsWith(WORKER_AUTHOR_PREFIX)) return null
  const [provider = '', ...rest] = model
    .slice(WORKER_AUTHOR_PREFIX.length)
    .split('/')
  const served = rest.join('/')
  if (provider === 'ollama' || provider === 'local-cpu')
    return [LOCAL_GRADE_TIER]
  if (provider === 'openrouter') return [OPENROUTER_GRADE_TIER]
  if (provider === 'codex') return ['codex']
  if (provider === 'cursor') return ['cursor']
  if (provider === 'agy') return agyTiersOfModel(served)
  return null
}
