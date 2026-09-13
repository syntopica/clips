import { AGY_BULK_MODEL } from '../../models/agy-bulk-model.ts'
import { agyTriageRunner } from './run-triage-agy.ts'
import type { TriageRunner } from './triage-runner.ts'

/** Classification on the bulk tier, and the harvest's default. This pass reads
 * every harvested title - 1462 in the verified run - which is the definition of
 * work that has to sit on the quota that survives a whole corpus. */
export const agyBulkTriage: TriageRunner = agyTriageRunner(AGY_BULK_MODEL)
