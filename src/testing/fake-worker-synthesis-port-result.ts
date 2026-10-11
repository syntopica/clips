import type { WorkerSynthesisPort } from '../worker-synthesis/worker-synthesis-port.ts'
import type { WorkerPortCall } from './worker-port-call.ts'

export type FakeWorkerSynthesisPortResult = {
  port: WorkerSynthesisPort
  calls: WorkerPortCall[]
}
