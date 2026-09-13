import { DatabaseSync } from 'node:sqlite'
import type { BodyHeader } from './newsletter/body-header.ts'
import { VEXA_BODY_HEADER_QUERY } from './newsletter/vexa-body-header-query.ts'
import { VEXA_DATABASE_PATH } from './newsletter/vexa-database-path.ts'

/** One body-content sender's message headers since a date, from every account
 * Vexa syncs. The generator shape and the read-only handle with a busy timeout
 * match `readVexaDigests`, and for the same reasons: Vexa writes to this file
 * while the app runs, and the consumer may abandon the iteration early.
 * Subjectless messages are dropped - a candidate with no title has nothing to
 * put in front of triage. */
export function* readVexaBodyHeaders(
  sender: string,
  since: string,
): Generator<BodyHeader> {
  const database = new DatabaseSync(VEXA_DATABASE_PATH, {
    readOnly: true,
    timeout: 30_000,
  })
  try {
    const rows = database
      .prepare(VEXA_BODY_HEADER_QUERY)
      .iterate(sender.toLowerCase(), since)
    for (const row of rows) {
      if (
        typeof row['date'] !== 'string' ||
        typeof row['subject'] !== 'string' ||
        row['subject'].trim() === ''
      )
        continue
      yield { date: row['date'].slice(0, 10), subject: row['subject'] }
    }
  } finally {
    database.close()
  }
}
