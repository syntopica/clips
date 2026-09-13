import { CODEX_IDENTITY_MODEL } from '../codex/codex-identity-model.ts'
import { CURSOR_IDENTITY_MODEL } from '../cursor/cursor-identity-model.ts'
import { AGY_BULK_MODEL } from '../models/agy-bulk-model.ts'
import { AGY_FINE_MODEL } from '../models/agy-fine-model.ts'
import { INTERACTIVE_IDENTITY } from '../synthesis/interactive-identity.ts'

/** Which grading tiers a page's actual author rules out, from the model the
 * synthesis run reported for itself.
 *
 * This is the half `CLIPS_SYNTHESIS_RUNNER` cannot answer. The variable says
 * which transport was *asked* for, and `selectSynthesizer` overrides it in
 * three ways - `--manual`, a disabled boundary decision, a missing binary - each
 * of which lands on the interactive synthesizer. An interactive author is a
 * Claude session in the operator's own terminal, so it rules out no grading
 * model at all, and returning the empty set is what makes the pin unnecessary
 * in the one case where it is provably safe.
 *
 * `null` is an author this lane does not recognise. It is deliberately not the
 * same as the empty set: a new transport must widen this map before its pages
 * can be graded, rather than being read as harmless by default. */
export const gradeTiersOfAuthor = (model: string): readonly string[] | null => {
  if (model === INTERACTIVE_IDENTITY.model) return []
  if (model === CODEX_IDENTITY_MODEL) return ['codex']
  if (model === AGY_FINE_MODEL) return ['agy-fine']
  if (model === AGY_BULK_MODEL) return ['agy-bulk']
  if (model === CURSOR_IDENTITY_MODEL) return ['cursor']
  return null
}
