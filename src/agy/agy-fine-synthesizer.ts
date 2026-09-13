import { AGY_FINE_MODEL } from '../models/agy-fine-model.ts'
import type { Synthesizer } from '../synthesis/synthesizer.ts'
import { agySynthesizer } from './agy-synthesizer.ts'
import { agySynthesisRunner } from './run-agy-synthesis.ts'

/** Synthesis on the fine tier - Claude through agy. Where synthesis belongs by
 * the standing routing rule: a page is written once and approved by a human,
 * and nothing downstream re-reads it. */
export const agyFineSynthesizer: Synthesizer = agySynthesizer(
  agySynthesisRunner(AGY_FINE_MODEL),
  AGY_FINE_MODEL,
)
