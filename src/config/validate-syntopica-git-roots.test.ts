import { describe, expect, it } from 'vitest'

import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { validateSyntopicaGitRoots } from './validate-syntopica-git-roots.ts'

describe('validateSyntopicaGitRoots', () => {
  it('accepts distinct repositories and rejects engine aliases outside the monorepo exception', () => {
    const { root, data } = syntopicaConfigTestState()
    const brain = join(root, 'engine-brain')
    expect(() => {
      validateSyntopicaGitRoots([
        data,
        join(data, 'clips'),
        brain,
        join(root, 'engine-clips'),
      ])
    }).not.toThrow()
    expect(() => {
      validateSyntopicaGitRoots([data, join(data, 'clips'), brain, brain])
    }).toThrow('distinct')
    expect(() => {
      validateSyntopicaGitRoots([data, data, data, data])
    }).not.toThrow()
  })
})
