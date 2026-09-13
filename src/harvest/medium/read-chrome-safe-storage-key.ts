import { execFileSync } from 'node:child_process'
import { pbkdf2Sync } from 'node:crypto'

/** Chrome's cookie values are encrypted with a key derived from a single
 * Keychain password ("Chrome Safe Storage"), PBKDF2-SHA1 over the salt
 * `saltysalt`, 1003 iterations, 16 bytes out.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:80-82.
 *
 * The first call in a given binary raises a macOS authorization dialog asking
 * to unlock the Keychain item. Choosing "Always Allow" grants that binary
 * standing access, after which later runs are fully non-interactive; choosing
 * "Allow" makes every subsequent run prompt again, which breaks unattended
 * harvesting. The derived key is held in memory only and never written out. */
export const readChromeSafeStorageKey = (): Buffer => {
  const password = execFileSync(
    'security',
    [
      'find-generic-password',
      '-w',
      '-s',
      'Chrome Safe Storage',
      '-a',
      'Chrome',
    ],
    { encoding: 'utf8' },
  ).trim()
  return pbkdf2Sync(password, 'saltysalt', 1003, 16, 'sha1')
}
