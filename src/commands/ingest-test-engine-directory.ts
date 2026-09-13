import { execFileSync } from 'node:child_process'

import { temporaryDir } from '../testing/temporary-dir.ts'

/** Give each synthetic engine an independent Git common directory. */
export function ingestTestEngineDirectory(): string {
  const root = temporaryDir('ing-engine-')
  execFileSync('git', ['init', '--quiet', '--template=', root])
  return root
}
