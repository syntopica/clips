import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { WORKER_DEFAULT_MAX_PAYLOAD_BYTES } from './worker-default-max-payload-bytes.ts'
import type { WorkerPayloadConfig } from './worker-payload-config.ts'

/** The largest job body, in bytes, the instance's coordinator accepts.
 *
 * Read so a producer that inlines content can refuse a job with its numbers
 * attached rather than collect a bare 413 from the coordinator. */
export const readWorkerMaxPayloadBytes = (dataRoot: string): number => {
  const raw = JSON.parse(
    readFileSync(join(dataRoot, 'worker', 'config.json'), 'utf8'),
  ) as WorkerPayloadConfig
  const limit = raw.max_payload_bytes
  return typeof limit === 'number' && limit > 0
    ? limit
    : WORKER_DEFAULT_MAX_PAYLOAD_BYTES
}
