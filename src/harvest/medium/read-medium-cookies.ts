import { copyFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { decryptChromeCookie } from './decrypt-chrome-cookie.ts'

/** Reads the `.medium.com` session cookies out of the Chrome profile. The
 * store is copied to a temp path first because Chrome keeps the live file
 * locked while it runs, and the copy is removed before returning.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:76-92.
 *
 * The cookies stay in memory: they are re-read on every run and never written
 * to a clip, a page or the ledger. Rows whose shape does not match the schema
 * are skipped rather than failing the read - one odd row must not cost the
 * whole session. */
export const readMediumCookies = (
  databasePath: string,
  key: Buffer,
): Map<string, string> => {
  const scratch = mkdtempSync(join(tmpdir(), 'medium-cookies-'))
  try {
    const copy = join(scratch, 'Cookies')
    copyFileSync(databasePath, copy)
    const database = new DatabaseSync(copy)
    const rows = database
      .prepare(
        "SELECT name, encrypted_value FROM cookies WHERE host_key LIKE '%medium.com%'",
      )
      .all()
    database.close()
    const cookies = new Map<string, string>()
    for (const row of rows) {
      const name = row['name']
      const encrypted = row['encrypted_value']
      if (typeof name !== 'string' || !(encrypted instanceof Uint8Array))
        continue
      cookies.set(name, decryptChromeCookie(Buffer.from(encrypted), key))
    }
    return cookies
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}
