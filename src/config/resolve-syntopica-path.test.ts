import { describe, expect, it } from 'vitest'

import { symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { resolveSyntopicaPath } from './resolve-syntopica-path.ts'

describe('resolveSyntopicaPath', () => {
  it('redacts filesystem details when a symlink cycle prevents resolution', () => {
    const { data } = syntopicaConfigTestState()
    const linkName = 'private-loop'
    symlinkSync(linkName, join(data, linkName))
    expect(() => resolveSyntopicaPath(linkName, data)).toThrow(
      'cannot be resolved',
    )
    expect(() => resolveSyntopicaPath(linkName, data)).not.toThrow(
      /private-loop/u,
    )
  })
})
