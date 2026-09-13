import { fileURLToPath } from 'node:url'

/** boundary-decision.json sits at the package root, two levels above
 * src/sandbox/. Resolved from this module's location so the CLI works from
 * any working directory. */
export const BOUNDARY_DECISION_PATH = fileURLToPath(
  new URL('../../boundary-decision.json', import.meta.url),
)
