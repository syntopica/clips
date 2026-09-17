import { brainEngineRoot } from './brain-engine-root.ts'

/** The brain engine checkout, for a caller that cannot proceed without one. */
export function brainEngineDirectory(): string {
  const root = brainEngineRoot()
  if (root === null) throw new Error('Cannot locate the brain engine checkout')
  return root
}
