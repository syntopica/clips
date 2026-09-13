import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { clipTestMetadata as metadata } from '../testing/clip-test-metadata.ts'
import { clipTestState as state } from '../testing/clip-test-state.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { writeTestFiles as write } from '../testing/write-test-files.ts'
import { readClip } from './read-clip.ts'

const root = temporaryDir('clips-read-clip-')

describe('readClip', () => {
  it('reports malformed metadata.json as thin rather than throwing', async () => {
    const directory = join(root, 'malformed-metadata')
    write(directory, {
      'metadata.json': '{ broken',
      'state.json': JSON.stringify(state),
    })
    const result = await readClip(directory, 'pending')
    expect(result.kind).toBe('thin')
    expect(result.kind === 'thin' && result.reason).toMatch(
      /metadata\.json is not valid JSON/,
    )
  })

  it('reports malformed state.json as thin rather than throwing', async () => {
    const directory = join(root, 'malformed-state')
    write(directory, {
      'metadata.json': JSON.stringify(metadata),
      'state.json': '{ broken',
    })
    const result = await readClip(directory, 'pending')
    expect(result.kind).toBe('thin')
    expect(result.kind === 'thin' && result.reason).toMatch(
      /state\.json is not valid JSON/,
    )
  })

  it('reports metadata.json missing a required field as thin, naming the field', async () => {
    const directory = join(root, 'missing-field')
    const { title: _title, ...withoutTitle } = metadata
    write(directory, {
      'metadata.json': JSON.stringify(withoutTitle),
      'state.json': JSON.stringify(state),
    })
    const result = await readClip(directory, 'pending')
    expect(result.kind).toBe('thin')
    expect(result.kind === 'thin' && result.reason).toMatch(/title/)
  })
})

describe('readClip, given a metadata.json that is valid JSON but not an object', () => {
  it.each([
    ['null', 'null'],
    ['an array', '[]'],
    ['a string', '"text"'],
  ])(
    'reports metadata.json containing %s as not a JSON object, not as invalid JSON',
    async (_label, body) => {
      const directory = join(root, `not-an-object-${body.replace(/\W/g, '')}`)
      write(directory, {
        'metadata.json': body,
        'state.json': JSON.stringify(state),
      })
      const result = await readClip(directory, 'pending')
      expect(result.kind).toBe('thin')
      expect(result.kind === 'thin' && result.reason).toBe(
        'metadata.json is not a JSON object',
      )
    },
  )
})
