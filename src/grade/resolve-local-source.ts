import { existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { wikiDirectory } from '../layout/wiki-directory.ts'

/** One `sources:` entry resolved to a readable file inside the page root, or
 * null for everything else — a url, a path that escapes the root, a path to
 * nothing.
 *
 * The scheme test names every scheme `pageSourceUrls` claims, so the two
 * extractors stay disjoint by construction rather than by a `vexa://` identity
 * happening not to exist as a path.
 *
 * Containment is checked rather than assumed. `sources:` is frontmatter a model
 * wrote from untrusted material, so `../../../etc/passwd` is a shape this has
 * to refuse, and refusing it silently is right: an escaping path and an absent
 * one are equally unusable as evidence.
 *
 * Entries are written against the page root, not the repository root - a page
 * cites `sources/x/...` whether or not the instance keeps its pages in a
 * subdirectory. */
export const resolveLocalSource = (
  brainRepository: string,
  value: string,
): string | null => {
  if (/^(?:https?|vexa):\/\//.test(value)) return null
  const root = resolve(wikiDirectory(brainRepository))
  const absolute = resolve(join(root, value))
  const inside = relative(root, absolute)
  if (inside === '' || inside.startsWith('..')) return null
  return existsSync(absolute) ? absolute : null
}
