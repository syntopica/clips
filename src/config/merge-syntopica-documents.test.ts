import { describe, expect, it } from 'vitest'

import { mergeSyntopicaDocuments } from './merge-syntopica-documents.ts'

describe('mergeSyntopicaDocuments', () => {
  it('replaces arrays and nulls while deeply preserving unmentioned siblings', () => {
    const base = { nested: { value: 'old', sibling: true }, list: ['old'] }
    const overlay = { nested: { value: null }, list: ['new'] }
    const result = mergeSyntopicaDocuments(base, overlay)
    expect(result).toEqual({
      nested: { value: null, sibling: true },
      list: ['new'],
    })
    overlay.list.push('later')
    expect(result['list']).toEqual(['new'])
    expect(base.nested.value).toBe('old')
  })
  it('preserves a prototype-named JSON key as data without changing the object prototype', () => {
    const overlay = JSON.parse('{"__proto__":{"polluted":true}}') as Record<
      string,
      unknown
    >
    const result = mergeSyntopicaDocuments({}, overlay)
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(Object.hasOwn(result, '__proto__')).toBe(true)
    expect(result['polluted']).toBeUndefined()
  })
})
