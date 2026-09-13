import type { BooleanFlagKey } from './boolean-flag-key.ts'

/** Flag spelling to the field it sets. A table rather than a chain of `if`s so
 * adding a flag is one line and the parser's shape does not grow with the
 * flag count. */
export const BOOLEAN_FLAGS: Record<string, BooleanFlagKey> = {
  '--auto-review': 'autoReview',
  '--capture-all': 'captureAll',
  '--cited': 'cited',
  '--dry-run': 'dryRun',
  '--grade': 'grade',
  '--manual': 'manual',
  '--promote': 'promote',
}
