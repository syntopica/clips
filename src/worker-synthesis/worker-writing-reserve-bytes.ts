import type { WorkerShownPage } from './worker-shown-page.ts'

/** Room the writing pass's answer needs in the window beyond its prompt: every
 * shown page coming back rewritten, plus 16 KB for a page it creates. */
export const workerWritingReserveBytes = (
  shown: readonly WorkerShownPage[],
): number =>
  shown.reduce((sum, page) => sum + Buffer.byteLength(page.content), 0) +
  16 * 1024
