import { readFileSync } from 'node:fs'

/** Read a newsletter sender file: a JSON array of `[address, value]` pairs.
 *
 * The lists were TypeScript constants until 2026-09-13, which made the engine
 * carry one person's subscriptions. A stranger cloning it inherited them. They
 * are instance data and live in the data directory now; the prose explaining
 * each cohort, which JSON cannot hold, is in `docs/newsletter-sender-cohorts.md`
 * of that instance. */
export function readSenderPairs(
  path: string,
): readonly (readonly [string, string])[] {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (!Array.isArray(parsed)) {
    throw new TypeError(`${path} must hold an array of [address, value] pairs`)
  }
  return parsed.map((entry: unknown) => {
    if (
      !Array.isArray(entry) ||
      entry.length !== 2 ||
      typeof entry[0] !== 'string' ||
      typeof entry[1] !== 'string'
    ) {
      throw new TypeError(
        `${path} must hold an array of [address, value] pairs`,
      )
    }
    return [entry[0], entry[1]] as const
  })
}
