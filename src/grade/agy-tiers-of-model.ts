import { AGY_BULK_MODEL } from '../models/agy-bulk-model.ts'
import { AGY_FINE_MODEL } from '../models/agy-fine-model.ts'

/** The grade tiers an agy run occupies, from the model it was pinned to: the
 * one tier that model names when it is one of the two this engine knows, and
 * both otherwise, because an unpinned or unknown model is the CLI's choice. */
export const agyTiersOfModel = (model: string): readonly string[] => {
  if (model === AGY_FINE_MODEL) return ['agy-fine']
  if (model === AGY_BULK_MODEL) return ['agy-bulk']
  return ['agy-fine', 'agy-bulk']
}
