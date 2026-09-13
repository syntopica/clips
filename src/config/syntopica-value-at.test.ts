import { describe, expect, it } from 'vitest'

import { syntopicaValueAt } from './syntopica-value-at.ts'

describe('syntopicaValueAt', () => {
  it('returns explicit nulls and arrays without traversing inherited properties', () => {
    expect(
      syntopicaValueAt({ section: { empty: null } }, 'section.empty'),
    ).toBeNull()
    expect(
      syntopicaValueAt({ section: { values: ['a'] } }, 'section.values'),
    ).toEqual(['a'])
    expect(() => syntopicaValueAt({}, 'toString')).toThrow('missing')
    expect(() => syntopicaValueAt({ section: null }, 'section.value')).toThrow(
      'missing',
    )
  })
})
