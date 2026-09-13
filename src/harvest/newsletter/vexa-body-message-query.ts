/** One sender's messages with their bodies, newest first, for resolving a
 * subject slug at promotion time.
 *
 * Deliberately **without** the trash filter the sweep queries carry: the sweep
 * must not resurrect processed mail, but a promotion is an explicit
 * instruction, and the mail deletion pass may have trashed the message between
 * tick and fetch. The body survives in Vexa until the upstream expunge.
 *
 * Newest first because sender+slug identity resolves resends and re-used
 * subjects to the latest body - the resend case is the one measured (OpenAI,
 * one announcement, three sends).
 *
 * Parameter: the lowercased sender address. */
export const VEXA_BODY_MESSAGE_QUERY = `
  SELECT m.date_utc AS date, COALESCE(m.subject, '') AS subject,
         COALESCE(m.body_html, '') AS body
  FROM messages m
  WHERE LOWER(TRIM(m.from_addr)) = ?
    AND COALESCE(m.body_html, '') <> ''
  ORDER BY m.date_utc DESC
`
