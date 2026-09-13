import { AGY_BULK_MODEL } from '../models/agy-bulk-model.ts'
import type { Synthesizer } from '../synthesis/synthesizer.ts'
import { agySynthesizer } from './agy-synthesizer.ts'
import { agySynthesisRunner } from './run-agy-synthesis.ts'

/** Synthesis on Gemini. Off-tier by the standing routing rule, which sends
 * judgement work to the fine models - kept because quotas are per family, so
 * this is the transport that still writes pages when the Claude pool is spent
 * and the codex workspace has no credits. A batch that continues on the cheaper
 * model, with the same validator and the same human gate in front of it, beats
 * a batch that stops. */
export const agyBulkSynthesizer: Synthesizer = agySynthesizer(
  agySynthesisRunner(AGY_BULK_MODEL),
  AGY_BULK_MODEL,
)
