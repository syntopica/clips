import { describe, expect, it } from 'vitest'
import { mediumCookieHeader } from './medium-cookie-header.ts'

describe('mediumCookieHeader', () => {
  it('joins the jar as name=value pairs', () => {
    expect(
      mediumCookieHeader(
        new Map([
          ['sid', '1:abc'],
          ['uid', '8bf66de01196'],
          ['xsrf', 'token-value'],
        ]),
      ),
    ).toBe('sid=1:abc; uid=8bf66de01196; xsrf=token-value')
  })

  it('emits a single pair without a separator', () => {
    expect(mediumCookieHeader(new Map([['sid', '1:abc']]))).toBe('sid=1:abc')
  })

  it('emits an empty header for an empty jar', () => {
    expect(mediumCookieHeader(new Map())).toBe('')
  })
})
