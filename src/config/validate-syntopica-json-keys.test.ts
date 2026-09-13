import { describe, expect, it } from 'vitest'

import { validateSyntopicaJsonKeys } from './validate-syntopica-json-keys.ts'

describe('validateSyntopicaJsonKeys', () => {
  it('allows the same key in separate objects and ignores braces inside strings', () => {
    expect(() => {
      validateSyntopicaJsonKeys('{"a":{"name":"x"},"b":{"name":"[{}]"}}')
    }).not.toThrow()
  })
  it('rejects escaped duplicate keys in nested array members', () => {
    expect(() => {
      validateSyntopicaJsonKeys(String.raw`{"list":[{"name":1,"na\u006de":2}]}`)
    }).toThrow('duplicate')
  })
})
