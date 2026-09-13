/** Every body-content message's subject and date from one sender, at or after
 * a date, across every account - and never the body: the sweep only makes
 * triage candidates, and `body_html` for one sender alone can run to hundreds
 * of megabytes.
 *
 * The trash test matches `VEXA_DIGEST_QUERY`'s and exists for the same reason:
 * the sweep must not resurrect mail the deletion pass already processed. Empty
 * bodies are excluded here rather than downstream because a candidate that can
 * never be promoted should not reach triage at all.
 *
 * Parameters, in order: the lowercased sender address, and the inclusive
 * `YYYY-MM-DD` lower bound. */
export const VEXA_BODY_HEADER_QUERY = `
  SELECT m.date_utc AS date, COALESCE(m.subject, '') AS subject
  FROM messages m
  WHERE LOWER(TRIM(m.from_addr)) = ?
    AND m.date_utc >= ?
    AND COALESCE(m.body_html, '') <> ''
    AND NOT EXISTS (
      SELECT 1
      FROM message_placements mp
      JOIN folders f ON f.id = mp.folder_id
      WHERE mp.message_id = m.id AND f.role IN ('trash', 'spam')
    )
  ORDER BY m.date_utc
`
