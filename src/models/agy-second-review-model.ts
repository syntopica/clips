/** The review gate's model for a diff `AGY_BULK_MODEL` wrote itself.
 *
 * A different Gemini, not a different family: on 2026-10-04 agy's Claude pool
 * was spent for 133 hours and Gemini was the only family answering, so the one
 * independent reviewer on the transport was another Gemini model. Flash 3.8
 * rather than 3.1 Pro's sibling tier because the guard compares model ids, and
 * a newer generation is the furthest apart the transport offers. */
export const AGY_SECOND_REVIEW_MODEL = 'gemini-3.8-flash-high'
