import { CONTROL_CHARACTERS } from '../clips/control-characters.ts'
import { ALLOWED_PAGE_DIRECTORIES } from './allowed-page-directories.ts'
import { pagePathSegmentsFailure } from './page-path-segments-failure.ts'

/** Null when the path is an acceptable wiki page; otherwise why it is not.
 * Judged on the string alone - filesystem truths (symlink, mode, content) are
 * separate checks. Rejects, per SPEC:361-366: paths outside the allowlist,
 * anything under .ingest/, non-.md files, hidden files, control characters,
 * and non-normalized paths. */
export const pagePathFailure = (path: string): string | null => {
  if (CONTROL_CHARACTERS.test(path)) return 'control characters in the path'
  if (path.includes('\\')) return 'backslash in the path'
  const segments = path.split('/')
  const segmentsFailure = pagePathSegmentsFailure(segments)
  if (segmentsFailure !== null) return segmentsFailure
  const [top] = segments
  if (top === undefined || !ALLOWED_PAGE_DIRECTORIES.has(top))
    return `outside the allowed directories (${top ?? 'empty'})`
  if (!path.endsWith('.md')) return 'not a markdown file'
  return null
}
