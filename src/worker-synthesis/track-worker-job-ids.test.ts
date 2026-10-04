import { describe, expect, it } from 'vitest'
import { trackWorkerJobIds } from './track-worker-job-ids.ts'
import type { WorkerSynthesisPort } from './worker-synthesis-port.ts'

describe('trackWorkerJobIds', () => {
  it('keeps the id of every submitted job and passes each answer through', async () => {
    const answers = [
      { text: 'a', executor: null, jobId: 'job-1' },
      { failure: 'refused before submission' },
      { failure: 'no answer', jobId: 'job-2' },
    ]
    const port: WorkerSynthesisPort = {
      infer: async () =>
        Promise.resolve(answers.shift() ?? { failure: 'none' }),
    }
    const tracked = trackWorkerJobIds(port)
    expect(await tracked.port.infer('select', 'p', {}, 0)).toEqual({
      text: 'a',
      executor: null,
      jobId: 'job-1',
    })
    await tracked.port.infer('write', 'p', {}, 0)
    await tracked.port.infer('write', 'p', {}, 0)
    expect(tracked.jobIds).toEqual(['job-1', 'job-2'])
  })
})
