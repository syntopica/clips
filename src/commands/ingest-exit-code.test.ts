import { describe, expect, it } from 'vitest'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { ingestExitCode } from './ingest-exit-code.ts'

describe('ingestExitCode', () => {
  it('reports an exhausted transport over stopped clips', () => {
    expect(ingestExitCode(['published', 'exhausted'], 1)).toBe(
      EXIT_CODE.exhausted,
    )
  })

  it('reports stopped clips, else success', () => {
    expect(ingestExitCode(['stopped'], 1)).toBe(EXIT_CODE.clipsStopped)
    expect(ingestExitCode(['published'], 0)).toBe(EXIT_CODE.success)
  })
})
