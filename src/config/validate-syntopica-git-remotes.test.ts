import { describe, expect, it } from 'vitest'

import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { runSyntopicaGit } from './run-syntopica-git.ts'
import { validateSyntopicaGitRemotes } from './validate-syntopica-git-remotes.ts'

describe('validateSyntopicaGitRemotes', () => {
  it('checks effective push rewrites without exposing the authenticated URL', () => {
    const { data } = syntopicaConfigTestState()
    expect(
      runSyntopicaGit(data, [
        'remote',
        'add',
        'origin',
        'https://safe.example/repo',
      ]).status,
    ).toBe(0)
    expect(() => {
      validateSyntopicaGitRemotes(data)
    }).not.toThrow()
    expect(
      runSyntopicaGit(data, [
        'config',
        'url.https://user:private@example.test/.pushInsteadOf',
        'https://safe.example/',
      ]).status,
    ).toBe(0)
    expect(() => {
      validateSyntopicaGitRemotes(data)
    }).toThrow('credentials')
    expect(() => {
      validateSyntopicaGitRemotes(data)
    }).not.toThrow(/private/u)
  })
})
