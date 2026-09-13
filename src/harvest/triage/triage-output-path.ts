import { join } from 'node:path'
import { triageRootPath } from './triage-root-path.ts'

/** One directory per run date keeps successive runs from overwriting each
 * other. */
export const triageOutputPath = (
  brainRepository: string,
  date: string,
): string => join(triageRootPath(brainRepository), date)
