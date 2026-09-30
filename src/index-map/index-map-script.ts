import { join } from 'node:path'
import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'

/** The generator that owns the index: the brain engine's builder, which reads
 * the instance's own `brain.pages` and `brain.index`. It lived in the data
 * repository as `tools/index/build.py` until the split of 2026-09-14 moved it
 * into the engine; the worktree path this used to name has not existed since,
 * so every ingest from then on would have failed here had validation not
 * refused it first. */
export const indexMapScript = (): string =>
  join(currentSyntopicaConfig().brainPath, 'tools', 'index', 'build.py')
