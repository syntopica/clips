import { EVERY_GRADE_TIER } from './every-grade-tier.ts'
import { gradeTiersOfAuthor } from './grade-tiers-of-author.ts'
import { synthesisModelNames } from './synthesis-model-names.ts'

/** The tiers the author/verifier guard must refuse, preferring what actually
 * ran over what was configured.
 *
 * A null author is the standalone `clips grade`, which is handed a page and no
 * history: there the environment is the only evidence, and its worst case is
 * the right reading. An author the run reported is better evidence than the
 * variable, and an author this lane cannot place is worse than both - it
 * refuses every tier rather than guessing, which keeps the guard erring in the
 * direction it was built to err in. */
export const modelsThatWroteBatch = (
  author: string | null,
  synthesisRunner: string | undefined,
): readonly string[] => {
  if (author === null) return synthesisModelNames(synthesisRunner)
  return gradeTiersOfAuthor(author) ?? EVERY_GRADE_TIER
}
