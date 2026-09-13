import { homedir } from 'node:os'
import { join } from 'node:path'

/** The live Chrome cookie store on macOS. Chrome holds a lock on it, so every
 * reader copies it first; this constant only names the source.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:78-79. */
export const CHROME_COOKIE_DATABASE_PATH = join(
  homedir(),
  'Library',
  'Application Support',
  'Google',
  'Chrome',
  'Default',
  'Cookies',
)
