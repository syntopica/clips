import { describe, expect, it } from 'vitest'

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { syntopicaGitCommonDirectory } from './syntopica-git-common-directory.ts'

describe('syntopicaGitCommonDirectory', () => {
  it('identifies real repository roots and refuses nested directory aliases', () => {
    const { data } = syntopicaConfigTestState()
    expect(syntopicaGitCommonDirectory(data)).toBe(join(data, '.git'))
    const child = join(data, 'nested')
    mkdirSync(child)
    expect(() => syntopicaGitCommonDirectory(child)).toThrow('worktree root')
  })
})
