import { describe, expect, it } from 'vitest'

import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { runSyntopicaGit } from './run-syntopica-git.ts'

describe('runSyntopicaGit', () => {
  it('returns failures as metadata without leaking Git stderr', () => {
    const { root, data } = syntopicaConfigTestState()
    expect(
      runSyntopicaGit(data, ['rev-parse', '--is-inside-work-tree']),
    ).toEqual({ status: 0, stdout: 'true\n' })
    const failure = runSyntopicaGit(join(root, 'missing-private-path'), [
      'status',
    ])
    expect(failure.status).not.toBe(0)
    expect(Object.keys(failure)).toEqual(['status', 'stdout'])
    expect(JSON.stringify(failure)).not.toContain('missing-private-path')
  })
})
