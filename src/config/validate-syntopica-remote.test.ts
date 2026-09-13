import { describe, expect, it } from 'vitest'

import { validateSyntopicaRemote } from './validate-syntopica-remote.ts'

describe('validateSyntopicaRemote', () => {
  it('preserves standard SCP and local path semantics', () => {
    expect(() => {
      validateSyntopicaRemote('git@example.test:archive.git')
    }).not.toThrow()
    expect(() => {
      validateSyntopicaRemote('../local-archive')
    }).not.toThrow()
    expect(() => {
      validateSyntopicaRemote('user@example.test:archive.git')
    }).toThrow('authentication')
    expect(() => {
      validateSyntopicaRemote('https://example.test?signature=private')
    }).toThrow('credentials')
  })
})
