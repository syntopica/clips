import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { sourceEntryFailure } from './source-entry-failure.ts'

const worktree = mkdtempSync(join(tmpdir(), 'clips-source-entry-'))
afterAll(() => {
  rmSync(worktree, { recursive: true, force: true })
})

const page = (sources: string[]): string =>
  [
    '---',
    'sources:',
    ...sources.map((entry) => `  - ${entry}`),
    '---',
    '',
    'Body. [S1]',
    '',
  ].join('\n')

describe('sourceEntryFailure', () => {
  it('accepts urls, paths, emails and prose entries', async () => {
    writeFileSync(
      join(worktree, 'clean.md'),
      page([
        'https://example.com/a',
        'sources/vault/business/a.md',
        'info@example.com',
        'Apple Notes "FICHA" (extracted 2026-08-14)',
      ]),
    )
    expect(await sourceEntryFailure(worktree, 'clean.md')).toBeNull()
  })

  it('refuses an entry that opens with a claim marker', async () => {
    writeFileSync(
      join(worktree, 'corrupt.md'),
      page(['https://example.com/a', '[S129] https://example.com/b']),
    )
    const failure = await sourceEntryFailure(worktree, 'corrupt.md')
    expect(failure).toContain('starts with a claim marker')
    expect(failure).toContain('[S129] https://example.com/b')
  })

  it('refuses a [SNEW] marker written into the list itself', async () => {
    writeFileSync(
      join(worktree, 'snew.md'),
      page(['[SNEW] https://example.com/c']),
    )
    expect(await sourceEntryFailure(worktree, 'snew.md')).toContain(
      'starts with a claim marker',
    )
  })
})
