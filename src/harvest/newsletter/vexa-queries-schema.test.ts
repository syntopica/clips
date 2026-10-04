import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { VEXA_BODY_HEADER_QUERY } from './vexa-body-header-query.ts'
import { VEXA_BODY_MESSAGE_QUERY } from './vexa-body-message-query.ts'
import { VEXA_DIGEST_QUERY } from './vexa-digest-query.ts'

// The columns these queries touch, as Vexa's store has them since its HTML
// moved out of the row into the on-disk body cache: `has_html` says a message
// has a body, and the body itself is fetched through `vexa message`.
const storeWithoutBodyColumn = (): DatabaseSync => {
  const database = new DatabaseSync(':memory:')
  database.exec(`
    CREATE TABLE messages (id TEXT PRIMARY KEY, subject TEXT, from_addr TEXT,
      date_utc TEXT, has_html INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE folders (id INTEGER PRIMARY KEY, role TEXT);
    CREATE TABLE message_placements (message_id TEXT, folder_id INTEGER);
    INSERT INTO messages VALUES
      ('m1', 'Digest one', 'noreply@medium.com', '2026-09-10T08:00:00Z', 1),
      ('m2', 'Plain text', 'noreply@medium.com', '2026-09-11T08:00:00Z', 0);
  `)
  return database
}

describe('Vexa queries against the current store', () => {
  it('lists digest message ids with an HTML body', () => {
    const rows = storeWithoutBodyColumn()
      .prepare(VEXA_DIGEST_QUERY)
      .all('noreply@medium.com', '2026-09-01')

    expect(rows.map((row) => row['id'])).toEqual(['m1'])
  })

  it('lists body-content headers for messages with an HTML body', () => {
    const rows = storeWithoutBodyColumn()
      .prepare(VEXA_BODY_HEADER_QUERY)
      .all('noreply@medium.com', '2026-09-01')

    expect(rows.map((row) => row['subject'])).toEqual(['Digest one'])
  })

  it('lists body-content message ids newest first', () => {
    const rows = storeWithoutBodyColumn()
      .prepare(VEXA_BODY_MESSAGE_QUERY)
      .all('noreply@medium.com')

    expect(rows.map((row) => row['id'])).toEqual(['m1'])
  })
})
