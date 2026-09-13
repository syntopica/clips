import { describe, expect, it } from 'vitest'

import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { resolveSyntopicaBrowser } from './resolve-syntopica-browser.ts'

describe('resolveSyntopicaBrowser', () => {
  it('preserves disabled integrations and PATH commands, resolving only explicit paths', () => {
    const { data } = syntopicaConfigTestState()
    expect(resolveSyntopicaBrowser(null, data)).toBeNull()
    expect(resolveSyntopicaBrowser('browser-command', data)).toBe(
      'browser-command',
    )
    expect(resolveSyntopicaBrowser('./bin/browser', data)).toBe(
      join(data, 'bin/browser'),
    )
  })
})
