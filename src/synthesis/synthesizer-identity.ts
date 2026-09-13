/** Who wrote a page and under what, reported by the transport that actually
 * ran rather than assumed by the publisher.
 *
 * It travels with the synthesis result and not with the `Synthesizer` type
 * because of the fallback: `synthesizeWithFallback` switches from Claude to
 * Gemini mid-batch on the quota wall, so the transport is only known once the
 * run is over.
 *
 * `promptSha256` is of the prompt actually sent, which for the unattended
 * transports includes the clip text - that is the "what was the synthesizer
 * shown" half the ledger was missing. */
export type SynthesizerIdentity = {
  model: string
  promptSha256: string
  boundary: string
}
