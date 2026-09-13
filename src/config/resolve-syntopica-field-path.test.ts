import { describe, expect, it } from 'vitest'

import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { resolveSyntopicaFieldPath } from './resolve-syntopica-field-path.ts'

describe('resolveSyntopicaFieldPath', () => {
  it('requires a scalar path to resolve to a value', () => {
    const { data } = syntopicaConfigTestState()
    expect(
      resolveSyntopicaFieldPath(
        { path: 'nested/file' },
        new Map([['path', data]]),
        data,
        'path',
      ),
    ).toBe(join(data, 'nested/file'))
    expect(() =>
      resolveSyntopicaFieldPath(
        { path: [] },
        new Map([['path', data]]),
        data,
        'path',
      ),
    ).toThrow('missing')
  })
})
