import { AGY_FINE_MODEL } from '../../models/agy-fine-model.ts'
import { agyTriageRunner } from './run-triage-agy.ts'
import type { TriageRunner } from './triage-runner.ts'

/** Classification on the fine tier: the refinement pass over the articles the
 * bulk model left in `review`, when codex has no credits. A fraction of the
 * corpus, which is what makes a quota that empties in about two batches of
 * twenty an acceptable trade. */
export const agyFineTriage: TriageRunner = agyTriageRunner(AGY_FINE_MODEL)
