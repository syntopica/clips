import { readdirSync } from 'node:fs'
import { join } from 'node:path'

/** The scraped thread file under `sources/x/` for an X status url, or `null`.
 *
 * `sources/x/` is an evidence class this repository already accepts - the
 * grader reads it through `pageSourceFiles` - but a page cites a tweet by its
 * url, and until this existed the unresolved-citation and unverifiable-page
 * checks resolved urls against clips alone. A thread the X sweep scraped to
 * disk therefore read as missing evidence while sitting right there.
 *
 * The match is on the status id: `tools/x/scrape.sh` names its output
 * `thread-<id>-<stamp>.json` at the root of `sources/x/` and the tab sweeps
 * write `thread-<id>.json` into dated subdirectories, so the basename must be
 * `thread-<id>` followed by `.` or `-` - the separator check keeps one id from
 * matching another it prefixes. A `.raw` sibling is scrape debris, not
 * evidence, which the `.json` suffix excludes. */
export const xThreadSourcePath = (
  brainRepository: string,
  url: string,
): string | null => {
  const id =
    /^https?:\/\/(?:mobile\.)?(?:x|twitter)\.com\/[^/]+\/status\/(\d+)/.exec(
      url,
    )?.[1]
  if (id === undefined) return null
  const root = join(brainRepository, 'sources', 'x')
  let entries: string[]
  try {
    entries = readdirSync(root, { recursive: true, encoding: 'utf8' })
  } catch {
    return null
  }
  const match = entries.find((entry) => {
    const base = entry.split('/').at(-1) ?? entry
    return (
      base.endsWith('.json') &&
      (base === `thread-${id}.json` || base.startsWith(`thread-${id}-`))
    )
  })
  return match === undefined ? null : join(root, match)
}
