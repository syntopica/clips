import { ledgerRelativePath } from '../ledger/ledger-relative-path.ts'
import { FIXTURE_CLIP_ID } from './clip-state-fixture-clip-id.ts'

/** The ledger path for FIXTURE_CLIP_ID, relative to a brain root. */
export const FIXTURE_LEDGER_PATH = ledgerRelativePath(FIXTURE_CLIP_ID)
