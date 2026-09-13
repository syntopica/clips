import { describe, expect, it } from 'vitest'
import { completeDump } from './complete-dump.ts'

describe('completeDump', () => {
  it('returns the document when the dump reached its closing tag', () => {
    const html = '<!DOCTYPE html><html><body>hi</body></html>\n'
    expect(completeDump({ stdout: html })).toBe(html)
  })

  it('is null for a dump cut short', () => {
    expect(completeDump({ stdout: '<!DOCTYPE html><html><body>hi' })).toBeNull()
  })

  it('is null when the browser printed nothing', () => {
    expect(completeDump({ stdout: '' })).toBeNull()
  })

  it('is null for an error that carries no output at all', () => {
    expect(completeDump(new Error('spawn ENOENT'))).toBeNull()
    expect(completeDump(null)).toBeNull()
    expect(completeDump('boom')).toBeNull()
  })
})
