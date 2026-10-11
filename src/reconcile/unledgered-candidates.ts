import type { CitedCandidate } from './cited-candidate.ts'

export type UnledgeredCandidates = {
  candidates: CitedCandidate[]
  alreadyLedgered: number
}
