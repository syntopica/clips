import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { TICKED_OR_UNTICKED_PATTERN } from './ticked-or-unticked-pattern.ts'

/** How many articles a triage run already on disk covers.
 *
 * A rerun overwrites the dated directory, so a run whose collectors partly
 * failed would silently replace a fuller one - and take the user's ticks with
 * it. Counting first is what lets the command refuse. */
export const countExistingTriage = (directory: string): number => {
  if (!existsSync(directory)) return 0
  return readdirSync(directory)
    .filter((entry) => entry.endsWith('.md') && entry !== 'README.md')
    .reduce(
      (total, entry) =>
        total +
        (readFileSync(join(directory, entry), 'utf8').match(
          TICKED_OR_UNTICKED_PATTERN,
        )?.length ?? 0),
      0,
    )
}
