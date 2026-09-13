import { describe, expect, it } from 'vitest'

import { validateSyntopicaUrls } from './validate-syntopica-urls.ts'

describe('validateSyntopicaUrls', () => {
  it('inspects nested object and array leaves before overlays can hide credentials', () => {
    expect(() => {
      validateSyntopicaUrls({
        nested: [{ remote: 'https://user:private@example.test' }],
      })
    }).toThrow('credentials')
    expect(() => {
      validateSyntopicaUrls({
        disabled: null,
        enabled: false,
        count: 2,
        nested: ['git@example.test:repo'],
      })
    }).not.toThrow()
  })
})
