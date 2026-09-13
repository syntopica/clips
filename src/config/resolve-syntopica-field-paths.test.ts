import { describe, expect, it } from 'vitest'

import { symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { resolveSyntopicaFieldPaths } from './resolve-syntopica-field-paths.ts'

describe('resolveSyntopicaFieldPaths', () => {
  it('rejects escaping content but allows external project roots', () => {
    const { root, data } = syntopicaConfigTestState()
    symlinkSync(root, join(data, 'outside'))
    const document = {
      brain: { pages: ['outside/notes'] },
      projects: { roots: ['../workspace'] },
    }
    const origins = new Map([
      ['brain.pages', data],
      ['projects.roots', data],
    ])
    expect(() =>
      resolveSyntopicaFieldPaths(document, origins, data, 'brain.pages'),
    ).toThrow('escapes')
    const projects = resolveSyntopicaFieldPaths(
      document,
      origins,
      data,
      'projects.roots',
    )
    expect(projects).toEqual([join(root, 'workspace')])
    expect(Object.isFrozen(projects)).toBe(true)
  })
  it('rejects a path without an origin and non-string path members', () => {
    expect(() =>
      resolveSyntopicaFieldPaths(
        { paths: ['a'] },
        new Map(),
        '/fixture',
        'paths',
      ),
    ).toThrow('defining file')
    expect(() =>
      resolveSyntopicaFieldPaths(
        { paths: [false] },
        new Map([['paths', '/fixture']]),
        '/fixture',
        'paths',
      ),
    ).toThrow('string')
  })
})
