import { describe, expect, it } from 'vitest'

import { validateSyntopicaUrl } from './validate-syntopica-url.ts'

describe('validateSyntopicaUrl', () => {
  it('accepts anonymous URLs and standard SSH Git usernames', () => {
    expect(() => {
      validateSyntopicaUrl('https://example.test/repo.git')
    }).not.toThrow()
    expect(() => {
      validateSyntopicaUrl('ssh://git@example.test/repo.git')
    }).not.toThrow()
  })
  it.each([
    'https://user:placeholder@example.test/repo',
    'ssh://git@user@example.test/repo',
    'https://example.test?signature=placeholder',
    'https://example.test/#placeholder',
    'https://[broken',
  ])('rejects unsafe or malformed URL %s with redacted diagnostics', (url) => {
    expect(() => {
      validateSyntopicaUrl(url)
    }).toThrow('Remote URL')
    expect(() => {
      validateSyntopicaUrl(url)
    }).not.toThrow(/placeholder/u)
  })
})
