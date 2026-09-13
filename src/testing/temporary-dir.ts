import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { trackTempRoot } from './track-temp-root.ts'

/** Creates a fresh temp directory under the given prefix and tracks it for
 * cleanup once the test file finishes. */
export const temporaryDir = (prefix: string): string => {
  const root = mkdtempSync(join(tmpdir(), prefix))
  trackTempRoot(root)
  return root
}
