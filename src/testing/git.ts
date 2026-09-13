import { execFileSync } from 'node:child_process'

/** Runs git against the given repository root and returns trimmed stdout. A
 * test helper: production code goes through `runGit`, which reports failures
 * as values; a fixture wants the exception. */
export const git = (root: string, ...args: string[]): string =>
  execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
