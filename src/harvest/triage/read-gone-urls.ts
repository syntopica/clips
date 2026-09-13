import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { GONE_ENTRY_PATTERN } from './gone-entry-pattern.ts'

/** Every URL a triage directory already marks `[gone-410]`.
 *
 * Read before the directory is replaced, so a harvest re-run can carry the
 * markers forward the way the overwrite guard carries the tick count - the
 * markers are hand-applied and nothing upstream can re-derive them. */
export const readGoneUrls = (directory: string): Set<string> => {
  const gone = new Set<string>()
  if (!existsSync(directory)) return gone
  for (const entry of readdirSync(directory)) {
    if (!entry.endsWith('.md') || entry === 'README.md') continue
    const content = readFileSync(join(directory, entry), 'utf8')
    for (const match of content.matchAll(GONE_ENTRY_PATTERN)) {
      const url = match[1]
      if (url !== undefined) gone.add(url)
    }
  }
  return gone
}
