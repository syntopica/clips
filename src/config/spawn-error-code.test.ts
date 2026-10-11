import { describe, expect, it } from 'vitest'
import { spawnErrorCode } from './spawn-error-code.ts'

describe('spawnErrorCode', () => {
  it('reads the code a spawn error carries', () => {
    expect(
      spawnErrorCode(Object.assign(new Error('x'), { code: 'ETIMEDOUT' })),
    ).toBe('ETIMEDOUT')
  })

  it('answers unknown for an error without one', () => {
    expect(spawnErrorCode(new Error('x'))).toBe('unknown')
  })
})
