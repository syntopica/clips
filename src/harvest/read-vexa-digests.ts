import { DatabaseSync } from 'node:sqlite'
import type { DigestBody } from './newsletter/digest-body.ts'
import { digestHtmlToMarkdown } from './newsletter/digest-html-to-markdown.ts'
import { VEXA_DATABASE_PATH } from './newsletter/vexa-database-path.ts'
import { VEXA_DIGEST_QUERY } from './newsletter/vexa-digest-query.ts'

/** One sender's newsletter bodies since a date, as markdown, from every account
 * Vexa syncs.
 *
 * Streamed one row at a time rather than collected, because the whole point of
 * a widened window is that it can be wide: `noreply@medium.com` alone holds
 * 1,872 non-trashed messages carrying 142 MB of `body_html`, and materialising
 * that with `.all()` before converting each body through JSDOM aborts Node with
 * `Ineffective mark-compacts near heap limit` at around a quarter of the way
 * in. An OOM abort cannot be caught, so it bypasses this lane's own error
 * handling and hands the operator a V8 fatal error where an exit code and one
 * sentence belong. Yielding keeps one body live at a time; only the extracted
 * links accumulate.
 *
 * The handle is read-only and carries a busy timeout because Vexa writes to
 * this file while the app runs and a bare read fails outright with `database is
 * locked (5)`. It closes in `finally`, which a generator also runs when the
 * consumer abandons it early. Empty bodies are dropped rather than passed on: a
 * message with no HTML part has no links to find, and letting it through would
 * inflate the email count the deduplication ratio is reported against. */
export function* readVexaDigests(
  sender: string,
  since: string,
): Generator<DigestBody> {
  const database = new DatabaseSync(VEXA_DATABASE_PATH, {
    readOnly: true,
    timeout: 30_000,
  })
  try {
    const rows = database
      .prepare(VEXA_DIGEST_QUERY)
      .iterate(sender.toLowerCase(), since)
    for (const row of rows) {
      if (
        typeof row['date'] !== 'string' ||
        typeof row['body'] !== 'string' ||
        row['body'] === ''
      )
        continue
      yield {
        date: row['date'].slice(0, 10),
        body: digestHtmlToMarkdown(row['body']),
      }
    }
  } finally {
    database.close()
  }
}
