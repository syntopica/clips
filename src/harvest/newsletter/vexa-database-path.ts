import { homedir } from 'node:os'
import { join } from 'node:path'

/** Vexa's local store: every synced message across every configured account,
 * with `body_html` intact and no network, no IMAP session and no credential
 * involved.
 *
 * It replaced Spark as this lane's transport on 2026-08-08 for two measured
 * reasons. Spark's local cache holds roughly a day - `spark emails --filter
 * from:noreply@medium.com` returned 1 message where Vexa held 15 over the same
 * window - and the Spark lane read one hardcoded account, while the newsletters
 * arrive across several. */
export const VEXA_DATABASE_PATH = join(
  homedir(),
  'Library',
  'Application Support',
  'com.vexamail.com',
  'vexa.db',
)
