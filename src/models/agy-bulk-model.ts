/** The model for volume: every harvested title, every batch, the passes that
 * read the whole corpus.
 *
 * Gemini 3.1 Pro rather than the newer 3.6 Flash, measured on a 20-item batch
 * of exactly this kind of task: Flash returned 15 NEW / 5 REINFORCES against
 * Pro's 8 / 12, which is the shape of a model labelling on novelty instead of
 * reading the reference. Gemini's quota is the one that survives a full corpus,
 * which is the whole reason bulk work goes here. */
export const AGY_BULK_MODEL = 'gemini-3.1-pro-high'
