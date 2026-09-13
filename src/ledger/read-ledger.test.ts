import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { ledgerPath } from './ledger-path.ts'
import { readLedgerSafely } from './read-ledger-safely.ts'
import { readLedger } from './read-ledger.ts'

const traversalClipId = '../../../../../etc/passwd0000000000'

const brain = mkdtempSync(join(tmpdir(), 'clips-ledger-'))
afterAll(() => {
  rmSync(brain, { recursive: true, force: true })
})

const ledger = {
  schemaVersion: 1,
  clipId: '01KYFX6NFRDVW03ZFJXQ6W1VVG',
  clipFormatVersion: 1,
  contentSha256: 'a'.repeat(64),
  clipRepoCommit: 'b'.repeat(40),
  clipSourcePath: 'clips/pending/2026/07/example',
  brainBaseCommit: 'c'.repeat(40),
  processedAt: '2026-07-27T15:00:00Z',
  reviewedAt: '2026-07-27T15:02:00Z',
  pagesTouched: ['topics/browser-apis.md'],
  synthesizer: {
    model: 'none',
    promptSha256: 'd'.repeat(64),
    toolVersion: '0.1.0',
    boundary: 'none',
  },
}

mkdirSync(join(brain, '.ingest', 'clips'), { recursive: true })
writeFileSync(ledgerPath(brain, ledger.clipId), JSON.stringify(ledger))

const reasonFor = async (clipId: string): Promise<string> => {
  const read = await readLedgerSafely(brain, clipId)
  return read.kind === 'unreadable' ? read.reason : `unexpectedly ${read.kind}`
}

describe('readLedgerSafely', () => {
  it('places the ledger at .ingest/clips/<clip_id>.json', () => {
    expect(ledgerPath(brain, ledger.clipId)).toBe(
      join(brain, '.ingest', 'clips', `${ledger.clipId}.json`),
    )
  })

  it('reads a written ledger back unchanged', async () => {
    expect(await readLedgerSafely(brain, ledger.clipId)).toEqual({
      kind: 'readable',
      ledger,
    })
  })

  it('reports a missing ledger as absent, the one case that degrades', async () => {
    expect(await readLedgerSafely(brain, '01KYZZZZZZZZZZZZZZZZZZZZZZ')).toEqual(
      {
        kind: 'absent',
      },
    )
  })
})

describe('readLedgerSafely, on a ledger it cannot read', () => {
  it('names the version it does not know, rather than throwing', async () => {
    const clipId = '01KYGGCNH0HN292WZ1VQGVR2XW'
    writeFileSync(
      ledgerPath(brain, clipId),
      JSON.stringify({ ...ledger, clipId, schemaVersion: 2 }),
    )
    const reason = await reasonFor(clipId)
    expect(reason).toContain('UNSUPPORTED_LEDGER_SCHEMA')
    expect(reason).toContain('2')
  })

  it('reports an empty file as invalid JSON, not as absent', async () => {
    const clipId = '01KYJPFKVB23TAJJ6YKXEX3CMN'
    writeFileSync(ledgerPath(brain, clipId), '')
    expect(await reasonFor(clipId)).toMatch(/not valid JSON/)
  })

  it('reports a null document, which parses but is not an object', async () => {
    const clipId = '01KYK90NPB14SGTFK43HXXBGCF'
    writeFileSync(ledgerPath(brain, clipId), 'null')
    expect(await reasonFor(clipId)).toMatch(/not a JSON object/)
  })

  it('reports an array document', async () => {
    const clipId = '01KYFXABHY680TKQHM1WYG7FJG'
    writeFileSync(ledgerPath(brain, clipId), '[]')
    expect(await reasonFor(clipId)).toMatch(/not a JSON object/)
  })

  it('names the field a schema-1 ledger is missing', async () => {
    const clipId = '01KYJMJ7G60NS316QM7405W18R'
    const { contentSha256, ...withoutHash } = ledger
    expect(contentSha256).toHaveLength(64)
    writeFileSync(
      ledgerPath(brain, clipId),
      JSON.stringify({ ...withoutHash, clipId }),
    )
    expect(await reasonFor(clipId)).toMatch(/contentSha256/)
  })

  it('survives a directory sitting where the ledger should be', async () => {
    // readFileIfPresent rethrows anything that is not ENOENT, so EISDIR would
    // otherwise escape readLedger and abort the whole status run.
    const clipId = '01KYJZ0JEPD9956PGA6X8GA49Z'
    mkdirSync(ledgerPath(brain, clipId), { recursive: true })
    expect(await reasonFor(clipId)).toMatch(/EISDIR/)
  })
})

describe('a clip_id that would escape the ledger directory', () => {
  it('makes ledgerPath throw, since reaching it unvalidated is a programming error', () => {
    expect(() => ledgerPath(brain, traversalClipId)).toThrow(traversalClipId)
  })

  it('makes readLedger return unreadable instead of throwing, since a clip_id read off disk can be anything', async () => {
    expect(await readLedger(brain, traversalClipId)).toEqual({
      kind: 'unreadable',
      reason: `clip_id is not a ULID: ${traversalClipId}`,
    })
  })

  it('makes readLedgerSafely return unreadable too', async () => {
    expect(await readLedgerSafely(brain, traversalClipId)).toEqual({
      kind: 'unreadable',
      reason: `clip_id is not a ULID: ${traversalClipId}`,
    })
  })
})
