import type { WorkerSynthesisPort } from './worker-synthesis-port.ts'

export type TrackedWorkerJobIds = {
  port: WorkerSynthesisPort
  jobIds: string[]
}
