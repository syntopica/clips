/** The model for judgement: the small number of items where being right matters
 * more than the price, and where a cheaper model's answer would be taken on
 * trust because nothing downstream re-reads it.
 *
 * Claude Opus through agy, whose quota is separate from Gemini's and **empties
 * far faster** - roughly two batches of twenty on the triage task. That is
 * acceptable precisely because fine work is a fraction of the volume; it is not
 * acceptable for anything that reads a whole corpus, which is what
 * `AGY_BULK_MODEL` is for. `claude-sonnet-4-6` and `gpt-oss-120b-medium` are
 * the other fine-tier options on the same transport if this one is exhausted. */
export const AGY_FINE_MODEL = 'claude-opus-4-6-thinking'
