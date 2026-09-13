import { createHash } from 'node:crypto'

/** Hex sha256 of a string, matching how the extension fills `content_sha256`
 * and `source_html_sha256`: the hash is of the content itself, not of the clip
 * files (that separate hash lives in `src/clips/content-sha256.ts` and feeds
 * the ledger). */
export const sha256Hex = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex')
