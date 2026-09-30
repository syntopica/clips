import type { WorkerExecutor } from '../worker/worker-executor.ts'
import type { WorkerShownPage } from './worker-shown-page.ts'

/** What the selection pass leaves the writing pass: the pages to show it, or
 * why the clip stops here and who, if anyone, said so. */
export type WorkerSelectionOutcome =
  | { shown: WorkerShownPage[] }
  | { refusal: string; executor: WorkerExecutor | null }
