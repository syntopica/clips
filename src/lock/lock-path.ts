import { join } from 'node:path'

/** At the repository root, not under `brain.ledger`: the lock guards the
 * repository's one ingest at a time rather than holding wiki data, and every
 * instance already ignores `.ingest/lock/` there. */
export const lockPath = (brainRepository: string): string =>
  join(brainRepository, '.ingest', 'lock')
