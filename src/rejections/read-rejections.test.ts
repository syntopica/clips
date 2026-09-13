import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readRejections } from './read-rejections.ts'

const clipDirectory = async (contents?: string): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'rejections-'))
  if (contents !== undefined)
    await writeFile(join(root, 'rejections.json'), contents)
  return root
}

describe('readRejections', () => {
  it('reads no history for a clip that has never been rejected', async () => {
    expect(await readRejections(await clipDirectory())).toEqual([])
  })

  it('reads the recorded rejections back', async () => {
    const directory = await clipDirectory(
      '[{"at":"2026-08-03T10:00:00.000Z","reason":"thin"}]',
    )

    expect(await readRejections(directory)).toEqual([
      { at: '2026-08-03T10:00:00.000Z', reason: 'thin' },
    ])
  })

  it('reads a corrupt file as no history rather than throwing', async () => {
    expect(await readRejections(await clipDirectory('not json'))).toEqual([])
    expect(await readRejections(await clipDirectory('{"reason":1}'))).toEqual(
      [],
    )
  })
})
