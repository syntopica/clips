import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** The brain engine checkout, which owns the index generator and the schema.
 *
 * That is this checkout in the monorepo and a sibling checkout once the engines
 * are separate repositories - the same two shapes `engines.brain.path` names. */
export function brainEngineDirectory(): string {
  const reader = join('tools', 'index', 'current_syntopica_config.py')
  for (const root of [
    join(import.meta.dirname, '..', '..', '..', '..'),
    join(import.meta.dirname, '..', '..'),
    join(import.meta.dirname, '..', '..', '..', 'brain'),
    join(import.meta.dirname, '..', '..', '..', 'syntopica-brain'),
    join(import.meta.dirname, '..', '..', '..', 'engine-brain'),
  ])
    if (existsSync(join(root, reader))) return root
  throw new Error('Cannot locate the brain engine checkout')
}
