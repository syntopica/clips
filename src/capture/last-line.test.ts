import { describe, expect, it } from 'vitest'
import { lastLine } from './last-line.ts'

describe('lastLine', () => {
  it('takes what the far end answered, not the command that asked', () => {
    expect(
      lastLine(
        'Command failed: python3 page_transport.py https://example.com\nhttps://example.com returned 403\n',
      ),
    ).toBe('https://example.com returned 403')
  })

  it('leaves a single-line message alone', () => {
    expect(lastLine('spawn E2BIG')).toBe('spawn E2BIG')
  })

  it('survives an empty message', () => {
    expect(lastLine('')).toBe('')
  })
})
