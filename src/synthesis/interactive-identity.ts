import { sha256Hex } from '../harvest/promote/sha256-hex.ts'
import { INTERACTIVE_MODEL } from './interactive-model.ts'
import { synthesisInstructions } from './synthesis-instructions.ts'
import type { SynthesizerIdentity } from './synthesizer-identity.ts'

/** Who the ledger records for a human/Claude-in-the-loop synthesis. The
 * instructions printed to the operator are this transport's whole prompt:
 * whoever writes the pages read exactly that, so hashing them is the same
 * promise the unattended transports make by hashing theirs. A function, not a
 * constant, because the instructions name the instance's page directories and
 * configuration is read at call time. */
export const interactiveIdentity = (): SynthesizerIdentity => ({
  model: INTERACTIVE_MODEL,
  promptSha256: sha256Hex(synthesisInstructions()),
  boundary: 'human-review',
})
