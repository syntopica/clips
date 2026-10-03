import { HEX_ABBREVIATION } from '../git/hex-abbreviation.ts'

/** Only a hex object name goes on a `cat-file --batch-check` line: anything
 * else (a ref name, a value with whitespace or a newline) keeps the one-process
 * per-commit path, where `--end-of-options` already fences it. */
export const isBatchResolvableCommit = (brainCommit: string): boolean =>
  HEX_ABBREVIATION.test(brainCommit)
