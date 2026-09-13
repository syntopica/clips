import { DatabaseSync } from 'node:sqlite'
import { VEXA_BODY_MESSAGE_QUERY } from '../newsletter/vexa-body-message-query.ts'
import { VEXA_DATABASE_PATH } from '../newsletter/vexa-database-path.ts'
import type { BodyArticle } from './body-article.ts'
import { slugify } from './slugify.ts'

/** Resolve a body-content identity to the newest message whose slugified
 * subject matches, and throw with the identity spelled out when nothing does -
 * the promotion loop reports the throw against the one article and carries on.
 *
 * Streamed newest-first and stopped at the first hit, so at most one body
 * beyond the match is ever materialised. The handle settings match the sweep
 * readers, for the reasons documented on `readVexaDigests`. */
export const readVexaBodyArticle = (
  sender: string,
  slug: string,
): BodyArticle => {
  const database = new DatabaseSync(VEXA_DATABASE_PATH, {
    readOnly: true,
    timeout: 30_000,
  })
  try {
    const rows = database
      .prepare(VEXA_BODY_MESSAGE_QUERY)
      .iterate(sender.toLowerCase())
    for (const row of rows) {
      if (
        typeof row['date'] !== 'string' ||
        typeof row['subject'] !== 'string' ||
        typeof row['body'] !== 'string'
      )
        continue
      if (slugify(row['subject']) !== slug) continue
      return {
        subject: row['subject'],
        date: row['date'].slice(0, 10),
        bodyHtml: row['body'],
      }
    }
  } finally {
    database.close()
  }
  throw new Error(`no message from ${sender} matches subject slug "${slug}"`)
}
