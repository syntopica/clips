import { createHash } from 'node:crypto'
import type { SynthesizerIdentity } from '../synthesis/synthesizer-identity.ts'

/** The identity a cited-reconcile ledger records. No synthesizer ran and no
 * prompt was sent, so the model names the pass itself and `promptSha256` is
 * the hash of the empty string - computed rather than pasted, so the value can
 * never drift from what it claims to be. The schema requires all three fields;
 * inventing a plausible model name here would be worse than an honest
 * sentinel. */
export const RECONCILE_CITED_IDENTITY: SynthesizerIdentity = {
  model: 'reconcile-cited',
  promptSha256: createHash('sha256').update('').digest('hex'),
  boundary: 'none',
}
