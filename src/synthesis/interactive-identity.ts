import { sha256Hex } from '../harvest/promote/sha256-hex.ts'
import { SYNTHESIS_INSTRUCTIONS } from './synthesis-instructions.ts'
import type { SynthesizerIdentity } from './synthesizer-identity.ts'

/** Who the ledger records for a human/Claude-in-the-loop synthesis. The
 * instructions printed to the operator are this transport's whole prompt:
 * whoever writes the pages read exactly that, so hashing them is the same
 * promise the unattended transports make by hashing theirs. */
export const INTERACTIVE_IDENTITY: SynthesizerIdentity = {
  model: 'claude-in-the-loop',
  promptSha256: sha256Hex(SYNTHESIS_INSTRUCTIONS),
  boundary: 'human-review',
}
