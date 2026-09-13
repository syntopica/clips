import { describe, expect, it } from 'vitest'
import { agyFailureTail } from './agy-failure-tail.ts'

const QUOTA =
  'Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 3h1m57s.'

describe('agyFailureTail', () => {
  it('carries the quota wall, which agy prints on stdout', () => {
    expect(agyFailureTail({ stdout: QUOTA, stderr: '' })).toContain(
      'Individual quota reached',
    )
  })

  it('still carries stderr', () => {
    expect(agyFailureTail({ stdout: '', stderr: 'boom' })).toBe('boom')
  })

  it('names a kill for running long', () => {
    expect(agyFailureTail({ stdout: '', stderr: '', killed: true })).toContain(
      'killed for running long',
    )
  })
})

describe('agyFailureTail under --output-format json', () => {
  it('finds the quota wall inside the envelope, not only at the end', () => {
    const envelope = `{"status":"error","response":"${QUOTA}","json_schema":{"type":"object","properties":{"pages_touched":{"type":"array"}}},"usage":{"input_tokens":0,"output_tokens":0,"thinking_tokens":0,"cache_read_tokens":0,"total_tokens":0}}`
    expect(agyFailureTail({ stdout: envelope, stderr: '' })).toContain(
      'Individual quota reached',
    )
  })
})
