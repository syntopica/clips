import { join } from 'node:path'

/** Where the dated triage runs live. The brain's `inbox/` is gitignored on
 * purpose: it is a drop zone the user reads and then empties, not a wiki
 * page. */
export const triageRootPath = (brainRepository: string): string =>
  join(brainRepository, 'inbox', 'newsletter-triage')
