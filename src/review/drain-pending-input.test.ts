import { PassThrough } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { drainPendingInput } from './drain-pending-input.ts'

describe('drainPendingInput', () => {
  it('discards what was written before the question', async () => {
    const stream = new PassThrough()
    stream.write('a 01kysgc20y00\n')
    await drainPendingInput(stream)
    expect(stream.read()).toBeNull()
  })

  it('keeps what arrives after the drain', async () => {
    const stream = new PassThrough()
    stream.write('stale\n')
    await drainPendingInput(stream)
    stream.write('fresh\n')
    expect(String(stream.read())).toBe('fresh\n')
  })

  it('is harmless on an empty stream', async () => {
    const stream = new PassThrough()
    await expect(drainPendingInput(stream)).resolves.toBeUndefined()
  })
})
