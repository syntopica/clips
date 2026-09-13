import type { SynthesizedVerdict } from './synthesized-verdict.ts'
import type { SynthesizerIdentity } from './synthesizer-identity.ts'

/** The model's own verdict plus the transport's identity.
 *
 * `skipped` exists for the interactive synthesizer, where the operator can
 * abandon the clip before any pages are written; codex-style synthesizers
 * always return it false. A skipped clip stays pending and the brain is
 * untouched.
 *
 * `identity` is carried on every result, failures included: the ledger records
 * who wrote a published page, and a routed clip's evidence is worth as much
 * when it names the transport that could not. */
export type SynthesisResult = SynthesizedVerdict & {
  identity: SynthesizerIdentity
}
