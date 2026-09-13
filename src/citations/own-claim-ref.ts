import type { ClaimRef } from './claim-ref.ts'

/** The ref for a claim the wiki's owner knows first-hand.
 *
 * It is what closes the loop `business/toolkit.md` demonstrated on 2026-08-02:
 * graded three times, it reported one unsupported claim per pass and each fix
 * produced the next, ending at "the official Spanish e-signature application" -
 * a fact no reader here doubts and the repository README simply does not state.
 * With a ref, that claim is attributed to the rank that outranks the clip
 * instead of being unsupported forever.
 *
 * Honest rather than an escape hatch is a prompt rule, not something this
 * constant can enforce: a model must never mark its own inference `OWN`, and a
 * claim it cannot attribute is a claim it should not write. */
export const OWN_CLAIM_REF = 'OWN' satisfies ClaimRef
