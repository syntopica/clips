import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { clipTestMetadata as metadata } from '../testing/clip-test-metadata.ts'
import { clipTestState as state } from '../testing/clip-test-state.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { writeTestFiles as write } from '../testing/write-test-files.ts'
import { discoverClips } from './discover-clips.ts'

const root = temporaryDir('clips-discover-')

write(join(root, 'clips/pending/2026/07/2026-07-26-example-com-t-01kyfx6n'), {
  'metadata.json': JSON.stringify(metadata),
  'state.json': JSON.stringify(state),
  'index.md': '# t\n',
})
write(join(root, 'clips/pending/2026/07/2026-07-28-042951-mobile'), {
  'index.md': '---\nschema_version: 2\n---\n',
})
write(join(root, 'clips/processed/2026/07/2026-07-26-example-com-u-01kyfx7n'), {
  'metadata.json': JSON.stringify({
    ...metadata,
    clip_id: '01KYFX7NFRDVW03ZFJXQ6W1VVG',
  }),
  'state.json': JSON.stringify({
    ...state,
    status: 'processed',
    brainCommit: 'c'.repeat(40),
  }),
  'index.md': '# u\n',
})
write(join(root, 'clips/pending/2026/07/2026-07-29-future-01kyfx8n'), {
  'metadata.json': JSON.stringify({ ...metadata, schema_version: 3 }),
  'state.json': JSON.stringify(state),
  'index.md': '# v\n',
})
write(join(root, 'clips/pending/2026/07/2026-07-30-corrupt-01kyfx9n'), {
  'metadata.json': '{ broken',
  'state.json': JSON.stringify(state),
  'index.md': '# w\n',
})
// metadata.json is a directory, not a file: readFileIfPresent rethrows EISDIR
// rather than swallowing it, so this exercises readClip actually throwing.
mkdirSync(
  join(
    root,
    'clips/pending/2026/07/2026-07-31-unreadable-01kyfxan/metadata.json',
  ),
  { recursive: true },
)

describe('discoverClips', () => {
  it('finds clips across every bucket', async () => {
    const found = await discoverClips(root)
    expect(found).toHaveLength(6)
    expect(found.filter((c) => c.bucket === 'processed')).toHaveLength(1)
  })

  it('still returns the healthy clip when a sibling clip is corrupt', async () => {
    const found = await discoverClips(root)
    const healthy = found.find((c) => c.directory.endsWith('-01kyfx6n'))
    expect(healthy?.kind).toBe('clip')
    const corrupt = found.find((c) => c.directory.endsWith('-01kyfx9n'))
    expect(corrupt?.kind).toBe('thin')
    expect(corrupt?.kind === 'thin' && corrupt.reason).toMatch(
      /metadata\.json is not valid JSON/,
    )
  })

  it('still returns the healthy clip when a sibling clip makes readClip throw', async () => {
    const found = await discoverClips(root)
    const healthy = found.find((c) => c.directory.endsWith('-01kyfx6n'))
    expect(healthy?.kind).toBe('clip')
    const unreadable = found.find((c) => c.directory.endsWith('-01kyfxan'))
    expect(unreadable?.kind).toBe('thin')
    expect(unreadable?.kind === 'thin' && unreadable.reason).toMatch(
      /^unreadable:/,
    )
  })

  it('recognises a thin clip instead of crashing on it', async () => {
    const found = await discoverClips(root)
    const mobile = found.find((c) => c.directory.endsWith('-mobile'))
    expect(mobile?.kind).toBe('thin')
    expect(mobile?.kind === 'thin' && mobile.reason).toMatch(/metadata\.json/)
  })

  it('reports an unsupported schema version as thin, with the code in the reason', async () => {
    const found = await discoverClips(root)
    const future = found.find((c) => c.directory.endsWith('-01kyfx8n'))
    expect(future?.kind === 'thin' && future.reason).toMatch(
      /UNSUPPORTED_CLIP_SCHEMA/,
    )
  })
})
