import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** The brain engine checkout, or null where this clone has none beside it.
 *
 * That is this checkout in the monorepo and a sibling checkout once the
 * engines are separate repositories - the same two shapes `engines.brain.path`
 * names. Null is the third case, a clips-only clone: the caller decides
 * whether that is a failure or a reason to skip, which is why this returns
 * rather than throws. */
export function brainEngineRoot(): string | null {
  const reader = join('tools', 'index', 'current_syntopica_config.py')
  for (const root of [
    join(import.meta.dirname, '..', '..', '..', '..'),
    join(import.meta.dirname, '..', '..'),
    join(import.meta.dirname, '..', '..', '..', 'brain'),
    join(import.meta.dirname, '..', '..', '..', 'syntopica-brain'),
    join(import.meta.dirname, '..', '..', '..', 'engine-brain'),
  ])
    if (existsSync(join(root, reader))) return root
  return null
}
