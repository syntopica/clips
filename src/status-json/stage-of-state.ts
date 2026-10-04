import type { DerivedState } from '../state/derived-state.ts'
import type { ClipStage } from './clip-stage.ts'

export const stageOfState = (state: DerivedState): ClipStage => {
  switch (state) {
    case 'pending':
      return 'synthesis'
    case 'synthesized':
    case 'locally-stale':
      return 'publication'
    case 'reconciliation-pending':
      return 'reconciliation'
    case 'reconciled':
      return 'done'
    case 'needs-claude':
    case 'inconsistent':
      return 'operator'
    case 'unreadable':
      return 'capture'
  }
}
