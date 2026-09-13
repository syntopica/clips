import { git } from '../testing/git.ts'
import { FIXTURE_LEDGER_PATH } from './clip-state-fixture-ledger-path.ts'

/** Commits the ledger written by writeLedger for FIXTURE_CLIP_ID. */
export const commitLedger = (brain: string): void => {
  git(brain, 'add', FIXTURE_LEDGER_PATH)
  git(brain, 'commit', '-qm', 'ledger')
}
