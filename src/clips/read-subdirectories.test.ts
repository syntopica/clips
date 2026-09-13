import { chmodSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { readSubdirectories } from './read-subdirectories.ts'

const root = mkdtempSync(join(tmpdir(), 'clips-read-subdirectories-'))
afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('readSubdirectories', () => {
  it('returns an empty list for a directory that does not exist', async () => {
    const found = await readSubdirectories(join(root, 'missing'))
    expect(found).toEqual([])
  })

  it('rethrows a permission error instead of reporting an empty listing', async () => {
    const locked = join(root, 'locked')
    mkdirSync(locked)
    chmodSync(locked, 0o000)
    try {
      await expect(readSubdirectories(locked)).rejects.toMatchObject({
        code: 'EACCES',
      })
    } finally {
      chmodSync(locked, 0o700)
    }
  })
})
