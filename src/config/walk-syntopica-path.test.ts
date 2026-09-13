import { describe, expect, it } from 'vitest'

import { mkdirSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { walkSyntopicaPath } from './walk-syntopica-path.ts'

describe('walkSyntopicaPath', () => {
  it('follows symlinks before applying parent segments, including missing leaves', () => {
    const { root, data } = syntopicaConfigTestState()
    const nested = join(root, 'nested')
    mkdirSync(nested)
    symlinkSync(nested, join(data, 'link'))
    expect(walkSyntopicaPath('link/../missing/leaf', data)).toBe(
      join(root, 'missing/leaf'),
    )
    expect(walkSyntopicaPath('/../../..', data)).toBe('/')
  })
})
