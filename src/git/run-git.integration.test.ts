import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { runGit } from './run-git.ts'

const root = mkdtempSync(join(tmpdir(), 'clips-rungit-'))
afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('runGit', () => {
  it('reports a non-zero exit instead of throwing', async () => {
    const result = await runGit(root, ['rev-parse', 'HEAD'])
    expect(result.exitCode).not.toBe(0)
    expect(result.stderr).toMatch(/not a git repository/i)
  })

  it('returns stdout on success', async () => {
    const result = await runGit(root, ['--version'])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toMatch(/^git version /)
  })
})
