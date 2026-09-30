import type { Synthesizer } from '../synthesis/synthesizer.ts'
import { workerSynthesisPortOnQueue } from './worker-synthesis-port-on-queue.ts'
import { WORKER_SYNTHESIS_QUEUE } from './worker-synthesis-queue.ts'
import { WORKER_SYNTHESIS_TIMING } from './worker-synthesis-timing.ts'
import { workerSynthesizer } from './worker-synthesizer.ts'

/** Synthesis on the instance's worker, bound to the engine's synthesis queue.
 * Nothing is read at import: the model, address and token are resolved per
 * job. */
export const workerQueueSynthesizer: Synthesizer = workerSynthesizer(
  workerSynthesisPortOnQueue(WORKER_SYNTHESIS_QUEUE, WORKER_SYNTHESIS_TIMING),
)
