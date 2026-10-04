import { execFileSync } from 'node:child_process'
import { vexaMessageHtml } from './vexa-message-html.ts'

/** One message's HTML body through the Vexa CLI.
 *
 * The body left the `messages` row for an on-disk cache keyed by a hash of the
 * id (Vexa's store diet, 2026-09-22): from then every query here failed with
 * `no such column: m.body_html` and the newsletter lane harvested nothing for a
 * month. The cache layout is Vexa's private detail, so the body is read through
 * its documented CLI rather than off the disk. Measured at about 60 ms a call. */
export const readVexaMessageHtml = (id: string): string =>
  vexaMessageHtml(
    execFileSync(
      'vexa',
      ['message', '--json', '--fields', 'body_html', '--', id],
      {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      },
    ),
  )
