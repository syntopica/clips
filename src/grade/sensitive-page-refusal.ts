import { SENSITIVE_PAGE_DIRECTORIES } from './sensitive-page-directories.ts'

/** Why this page must not be handed to a grading transport, or null when it
 * may be.
 *
 * Refusing is the whole behaviour: there is no override flag, and that is
 * deliberate rather than unfinished. A flag would be reached for on the first
 * page it blocked, by whoever was in a hurry, which is the population this
 * protects. What the operator can do instead is exactly what the written rule
 * already says - read the page against its sources in a Claude session, which
 * costs no quota and sends nothing anywhere - and then record that reading in
 * `last_verified:`, which is the field built for it.
 *
 * Matched on the path the caller passed rather than on the page's content. A
 * content sniffer would be the more precise check and the wrong one: it fires
 * on the presence of a secret, so a page that merely describes a bank
 * relationship passes, and the page is transmitted before anyone learns the
 * sniffer was too narrow. The directory is what the wiki's own conventions
 * already use to say how a page is treated. */
export const sensitivePageRefusal = (page: string): string | null => {
  const directory = SENSITIVE_PAGE_DIRECTORIES.find((prefix) =>
    page.startsWith(prefix),
  )
  if (directory === undefined) return null
  return (
    `refused: ${directory} pages are never sent to a grading transport, which ` +
    'would inline this page and its sources into a prompt on a third-party ' +
    'service. Read it against its sources in session instead, then record that ' +
    'in last_verified:.'
  )
}
