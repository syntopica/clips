import { WORKER_AUTHOR_PREFIX } from '../worker-synthesis/worker-author-prefix.ts'
import { LOCAL_GRADE_TIER } from './local-grade-tier.ts'

/** The grade tiers a worker-written page's author rules out, or null when the
 * author is not a worker author or names a provider this lane cannot place.
 *
 * The author is `worker:<provider>/<model>` as the coordinator reported it. A
 * local backend is the local tier; a runner CLI is the tier that CLI grades on,
 * and agy is both of its tiers because the model behind it is the CLI's own
 * choice. `unreported`, and any provider added later, is null - which refuses
 * every tier until this map learns it. */
export const workerAuthorTiers = (model: string): readonly string[] | null => {
  if (!model.startsWith(WORKER_AUTHOR_PREFIX)) return null
  const provider = model.slice(WORKER_AUTHOR_PREFIX.length).split('/')[0]
  if (provider === 'ollama' || provider === 'local-cpu')
    return [LOCAL_GRADE_TIER]
  if (provider === 'codex') return ['codex']
  if (provider === 'cursor') return ['cursor']
  if (provider === 'agy') return ['agy-fine', 'agy-bulk']
  return null
}
