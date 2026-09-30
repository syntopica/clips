import { CONTROL_CHARACTERS } from '../clips/control-characters.ts'
import { isConfiguredPagePath } from '../layout/is-configured-page-path.ts'
import { wikiPagePath } from '../layout/wiki-page-path.ts'
import { pagePathSegmentsFailure } from './page-path-segments-failure.ts'

/** Null when the path is an acceptable wiki page; otherwise why it is not.
 * Judged on the string alone - filesystem truths (symlink, mode, content) are
 * separate checks. Rejects, per SPEC:361-366: paths outside the configured page
 * directories, anything under the ledger, non-.md files, hidden files, control
 * characters, and non-normalized paths.
 *
 * `path` is repository-relative, as git reports it. The allowlist is the
 * instance's `brain.pages`; until 2026-09-30 it was five directory names at the
 * repository root, and when the owner's instance moved its pages under `brain/`
 * on 2026-09-14 every synthesis was refused here as outside them. */
export const pagePathFailure = (path: string): string | null => {
  if (CONTROL_CHARACTERS.test(path)) return 'control characters in the path'
  if (path.includes('\\')) return 'backslash in the path'
  const segments = path.split('/')
  const segmentsFailure = pagePathSegmentsFailure(segments)
  if (segmentsFailure !== null) return segmentsFailure
  const page = wikiPagePath(path)
  if (page === null || !isConfiguredPagePath(page))
    return `outside the allowed directories (${segments.slice(0, -1).join('/')})`
  if (!path.endsWith('.md')) return 'not a markdown file'
  return null
}
