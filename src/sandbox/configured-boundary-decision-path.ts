import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { BOUNDARY_DECISION_PATH } from './boundary-decision-path.ts'

/** The boundary decision codex answers to: the instance's
 * `clips.boundaryDecision` when it declares one, otherwise the engine's
 * packaged decision, which refuses. An operator's acceptance of the risk is
 * theirs and lives in their data directory, never in this repository. */
export function configuredBoundaryDecisionPath(): string {
  return currentSyntopicaConfig().boundaryDecision ?? BOUNDARY_DECISION_PATH
}
