/** Every message from one sender, at or after a date, across every account.
 *
 * Two things about the schema this depends on. `messages` carries no
 * `account_id`, so a message reaches its account only through
 * `message_placements` - and because one message holds several placements at
 * once, the trash test has to be `NOT EXISTS` rather than a join filter: a
 * Gmail message moved to Trash keeps its `CATEGORY_UPDATES` placement, so
 * "has a placement outside trash" is true of everything and would deliver the
 * mail this lane already processed. Matching on `folders.role` rather than
 * `folders.path` covers `TRASH`, `INBOX.Trash`, `SPAM`, `INBOX.spam` and
 * `INBOX.Junk` without naming them.
 *
 * Parameters, in order: the lowercased sender address, and the inclusive
 * `YYYY-MM-DD` lower bound. */
export const VEXA_DIGEST_QUERY = `
  SELECT m.date_utc AS date, COALESCE(m.body_html, '') AS body
  FROM messages m
  WHERE LOWER(TRIM(m.from_addr)) = ?
    AND m.date_utc >= ?
    AND NOT EXISTS (
      SELECT 1
      FROM message_placements mp
      JOIN folders f ON f.id = mp.folder_id
      WHERE mp.message_id = m.id AND f.role IN ('trash', 'spam')
    )
  ORDER BY m.date_utc
`
