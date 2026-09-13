import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

// The prettier configuration these tests reproduce belongs to the checkout that
// runs them: `tools/clips` in the monorepo, the repository root once the engine
// is its own repository. Found by walking up to the configuration rather than
// by counting directories, which is what made it wrong in the second shape.
export function checkoutRoot(): string {
  let candidate = import.meta.dirname
  while (candidate !== dirname(candidate)) {
    if (existsSync(join(candidate, 'prettier.config.mjs'))) return candidate
    candidate = dirname(candidate)
  }
  throw new Error('Cannot locate the checkout root')
}
