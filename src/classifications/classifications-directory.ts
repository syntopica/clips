import { join } from 'node:path'

/** `classifications/<run-dir>/<run>.jsonl` at the root of the clips
 * repository, the stage 2 store of the capture-first design. */
export const classificationsDirectory = (clipsRepository: string): string =>
  join(clipsRepository, 'classifications')
